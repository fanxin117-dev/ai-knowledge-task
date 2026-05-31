import { AppError } from "@/lib/api/error";
import type { ActionItem, AiNoteInput, AiProvider } from "@/lib/ai/types";

type FetchLike = typeof fetch;

type OpenAiProviderConfig = {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  fetcher?: FetchLike;
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_OPENAI_MODEL = "gpt-5.2";
const DEFAULT_OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const REQUEST_TIMEOUT_MS = 30_000;

const summarySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      description: "一段面向个人知识管理场景的中文摘要。",
    },
  },
  required: ["summary"],
};

const actionItemsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      description: "从笔记中提取出的行动项，最多 5 条。",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
            description: "行动项标题，应该简短、可执行。",
          },
          description: {
            type: "string",
            description: "行动项说明；如果没有补充信息，返回空字符串。",
          },
        },
        required: ["title", "description"],
      },
    },
  },
  required: ["items"],
};

function getRequiredApiKey(apiKey: string | undefined) {
  const value = apiKey?.trim();

  if (!value) {
    throw new AppError({
      code: "AI_PROVIDER_ERROR",
      status: 500,
      message: "OPENAI_API_KEY 未配置。请填写密钥，或将 AI_PROVIDER 改为 mock。",
    });
  }

  return value;
}

function extractOutputText(payload: OpenAiResponse) {
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
    message: "OpenAI 响应中没有可用文本。",
  });
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError({
      code: "AI_PROVIDER_ERROR",
      status: 502,
      message: "OpenAI 返回了无法解析的 JSON。",
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
    message: "OpenAI 摘要结果格式不正确。",
  });
}

function normalizeActionItems(value: unknown): ActionItem[] {
  if (!value || typeof value !== "object" || !("items" in value) || !Array.isArray(value.items)) {
    throw new AppError({
      code: "AI_PROVIDER_ERROR",
      status: 502,
      message: "OpenAI 行动项结果格式不正确。",
    });
  }

  return value.items
    .filter(
      (item): item is { title: string; description: string } =>
        typeof item === "object" &&
        item !== null &&
        "title" in item &&
        "description" in item &&
        typeof item.title === "string" &&
        typeof item.description === "string" &&
        Boolean(item.title.trim()),
    )
    .slice(0, 5)
    .map((item) => ({
      title: item.title.trim().slice(0, 120),
      description: item.description.trim() ? item.description.trim().slice(0, 500) : null,
    }));
}

function buildUserInput(input: AiNoteInput) {
  return `标题：${input.title}\n\n正文：\n${input.content}`;
}

export function createOpenAiProvider(config: OpenAiProviderConfig = {}): AiProvider {
  const apiKey = getRequiredApiKey(config.apiKey ?? process.env.OPENAI_API_KEY);
  const model = (config.model ?? process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL).trim() || DEFAULT_OPENAI_MODEL;
  const endpoint = config.endpoint ?? DEFAULT_OPENAI_ENDPOINT;
  const fetcher = config.fetcher ?? fetch;

  async function createResponse(input: {
    instructions: string;
    userInput: string;
    schemaName: string;
    schema: Record<string, unknown>;
  }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetcher(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          instructions: input.instructions,
          input: input.userInput,
          text: {
            format: {
              type: "json_schema",
              name: input.schemaName,
              strict: true,
              schema: input.schema,
            },
          },
        }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => ({}))) as OpenAiResponse;

      if (!response.ok) {
        throw new AppError({
          code: "AI_PROVIDER_ERROR",
          status: response.status >= 500 ? 502 : response.status,
          message: payload.error?.message ?? "OpenAI 请求失败。",
        });
      }

      return extractOutputText(payload);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError({
        code: "AI_PROVIDER_ERROR",
        status: 502,
        message: error instanceof DOMException && error.name === "AbortError" ? "OpenAI 请求超时。" : "OpenAI 请求失败。",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    name: "openai",
    async summarizeNote(input) {
      const text = await createResponse({
        instructions:
          "你是个人知识管理助手。请阅读用户提供的笔记，返回 JSON，字段 summary 为 1 到 3 句中文摘要，不要添加 Markdown。",
        userInput: buildUserInput(input),
        schemaName: "note_summary",
        schema: summarySchema,
      });

      return normalizeSummary(parseJsonObject(text));
    },
    async extractActionItems(input) {
      const text = await createResponse({
        instructions:
          "你是任务拆解助手。请从笔记中提取可执行行动项，返回 JSON。items 最多 5 条；没有明确行动项时，根据正文推断 1 到 2 条合理下一步。",
        userInput: buildUserInput(input),
        schemaName: "action_items",
        schema: actionItemsSchema,
      });

      return normalizeActionItems(parseJsonObject(text));
    },
  };
}
