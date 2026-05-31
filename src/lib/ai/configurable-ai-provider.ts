import { AppError } from "@/lib/api/error";
import type { ActionItem, AiApiStyle, AiNoteInput, AiProvider, AiRuntimeConfig } from "@/lib/ai/types";

type FetchLike = typeof fetch;

type CompatibleProviderConfig = Required<Pick<AiRuntimeConfig, "baseUrl" | "model" | "apiStyle">> &
  Pick<AiRuntimeConfig, "apiKey" | "label"> & {
    fetcher?: FetchLike;
  };

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    code?: string;
    message?: string;
    status?: string;
  };
};

type ResponsesApiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    code?: string;
    message?: string;
    status?: string;
  };
};

const REQUEST_TIMEOUT_MS = 30_000;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function joinEndpoint(baseUrl: string, path: string) {
  return `${trimTrailingSlash(baseUrl)}/${path.replace(/^\/+/, "")}`;
}

function validateConfig(config: CompatibleProviderConfig) {
  const baseUrl = config.baseUrl.trim();
  const model = config.model.trim();

  if (!baseUrl) {
    throw new AppError({
      code: "AI_PROVIDER_ERROR",
      status: 400,
      message: "AI baseUrl 不能为空。",
    });
  }

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new AppError({
      code: "AI_PROVIDER_ERROR",
      status: 400,
      message: "AI baseUrl 必须以 http:// 或 https:// 开头。",
    });
  }

  if (!model) {
    throw new AppError({
      code: "AI_PROVIDER_ERROR",
      status: 400,
      message: "AI model 不能为空。",
    });
  }

  return {
    ...config,
    baseUrl,
    model,
  };
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError({
      code: "AI_PROVIDER_ERROR",
      status: 502,
      message: "AI 返回了无法解析的 JSON。请检查模型是否支持 JSON 输出，或调整提示词。",
    });
  }
}

function normalizeSummary(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "summary" in value &&
    typeof value.summary === "string" &&
    value.summary.trim()
  ) {
    return value.summary.trim();
  }

  throw new AppError({
    code: "AI_PROVIDER_ERROR",
    status: 502,
    message: "AI 摘要结果格式不正确，应返回 { summary: string }。",
  });
}

function normalizeActionItems(value: unknown): ActionItem[] {
  if (!value || typeof value !== "object" || !("items" in value) || !Array.isArray(value.items)) {
    throw new AppError({
      code: "AI_PROVIDER_ERROR",
      status: 502,
      message: "AI 行动项结果格式不正确，应返回 { items: [...] }。",
    });
  }

  return value.items
    .filter(
      (item): item is { title: string; description?: string | null } =>
        typeof item === "object" &&
        item !== null &&
        "title" in item &&
        typeof item.title === "string" &&
        Boolean(item.title.trim()),
    )
    .slice(0, 5)
    .map((item) => ({
      title: item.title.trim().slice(0, 120),
      description:
        typeof item.description === "string" && item.description.trim()
          ? item.description.trim().slice(0, 500)
          : null,
    }));
}

function buildUserInput(input: AiNoteInput) {
  return `标题：${input.title}\n\n正文：\n${input.content}`;
}

function buildHeaders(apiKey: string | undefined) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (apiKey?.trim()) {
    headers.authorization = `Bearer ${apiKey.trim()}`;
  }

  return headers;
}

async function requestJson(input: {
  fetcher: FetchLike;
  endpoint: string;
  apiKey?: string;
  body: Record<string, unknown>;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await input.fetcher(input.endpoint, {
      method: "POST",
      headers: buildHeaders(input.apiKey),
      body: JSON.stringify(input.body),
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => ({}))) as ChatCompletionResponse & ResponsesApiResponse;

      if (!response.ok) {
        const providerCode = payload.error?.code ? String(payload.error.code) : "";
        const providerStatus = payload.error?.status ? String(payload.error.status) : "";
        const messagePrefix = payload.error?.message ?? "AI provider 请求失败。";

        throw new AppError({
          code: "AI_PROVIDER_ERROR",
          status: response.status >= 500 ? 502 : response.status,
          message: messagePrefix,
          details: {
            httpStatus: String(response.status),
            ...(providerCode ? { providerCode } : {}),
            ...(providerStatus ? { providerStatus } : {}),
          },
        });
      }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError({
      code: "AI_PROVIDER_ERROR",
      status: 502,
      message: error instanceof DOMException && error.name === "AbortError" ? "AI provider 请求超时。" : "AI provider 请求失败。",
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractResponsesText(payload: ResponsesApiResponse) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const chunks =
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .filter((content) => content.type === "output_text" && typeof content.text === "string")
      .map((content) => content.text)
      .filter(Boolean) ?? [];

  if (chunks.length > 0) {
    return chunks.join("");
  }

  throw new AppError({
    code: "AI_PROVIDER_ERROR",
    status: 502,
    message: "Responses API 响应中没有可用文本。",
  });
}

function extractChatText(payload: ChatCompletionResponse) {
  const text = payload.choices?.[0]?.message?.content;

  if (typeof text === "string" && text.trim()) {
    return text;
  }

  throw new AppError({
    code: "AI_PROVIDER_ERROR",
    status: 502,
    message: "Chat Completions 响应中没有可用文本。",
  });
}

function buildInstructions(kind: "summary" | "actions") {
  if (kind === "summary") {
    return [
      "你是个人知识管理助手。",
      "请阅读用户提供的笔记，只返回严格 JSON，不要添加 Markdown。",
      'JSON 格式必须是：{"summary":"1 到 3 句中文摘要"}。',
    ].join("\n");
  }

  return [
    "你是任务拆解助手。",
    "请从笔记中提取可执行行动项，只返回严格 JSON，不要添加 Markdown。",
    'JSON 格式必须是：{"items":[{"title":"行动项标题","description":"说明或空字符串"}]}。',
    "items 最多 5 条；没有明确行动项时，根据正文推断 1 到 2 条合理下一步。",
  ].join("\n");
}

async function createCompletion(input: {
  config: CompatibleProviderConfig;
  fetcher: FetchLike;
  kind: "summary" | "actions";
  note: AiNoteInput;
}) {
  const instructions = buildInstructions(input.kind);
  const userInput = buildUserInput(input.note);

  if (input.config.apiStyle === "responses") {
    const payload = await requestJson({
      fetcher: input.fetcher,
      endpoint: joinEndpoint(input.config.baseUrl, "responses"),
      apiKey: input.config.apiKey,
      body: {
        model: input.config.model,
        instructions,
        input: userInput,
        text: {
          format: {
            type: "json_object",
          },
        },
      },
    });

    return extractResponsesText(payload);
  }

  const payload = await requestJson({
    fetcher: input.fetcher,
    endpoint: joinEndpoint(input.config.baseUrl, "chat/completions"),
    apiKey: input.config.apiKey,
    body: {
      model: input.config.model,
      messages: [
        {
          role: "system",
          content: instructions,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      response_format: {
        type: "json_object",
      },
    },
  });

  return extractChatText(payload);
}

export function createOpenAiCompatibleProvider(config: CompatibleProviderConfig): AiProvider {
  const normalizedConfig = validateConfig(config);
  const fetcher = config.fetcher ?? fetch;

  return {
    name: normalizedConfig.label?.trim() || "openai-compatible",
    async summarizeNote(input) {
      const text = await createCompletion({
        config: normalizedConfig,
        fetcher,
        kind: "summary",
        note: input,
      });

      return normalizeSummary(parseJsonObject(text));
    },
    async extractActionItems(input) {
      const text = await createCompletion({
        config: normalizedConfig,
        fetcher,
        kind: "actions",
        note: input,
      });

      return normalizeActionItems(parseJsonObject(text));
    },
  };
}

export function normalizeApiStyle(value: string | undefined): AiApiStyle {
  return value === "responses" ? "responses" : "chat-completions";
}
