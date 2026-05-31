import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/lib/api/error";
import { createOpenAiProvider } from "../../src/lib/ai/openai-ai-provider";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("OpenAI provider", () => {
  it("缺少 OPENAI_API_KEY 时返回明确配置错误", () => {
    expect(() => createOpenAiProvider({ apiKey: "" })).toThrow(AppError);
    expect(() => createOpenAiProvider({ apiKey: "" })).toThrow("OPENAI_API_KEY 未配置");
  });

  it("使用 Responses API 和 JSON Schema 生成摘要", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        output_text: JSON.stringify({
          summary: "这是一段结构化摘要。",
        }),
      }),
    );
    const fetcher = fetchMock as unknown as typeof fetch;
    const provider = createOpenAiProvider({
      apiKey: "test-key",
      model: "test-model",
      endpoint: "https://example.test/v1/responses",
      fetcher,
    });

    const summary = await provider.summarizeNote({
      title: "测试笔记",
      content: "需要完成 provider 测试。",
    });
    const firstCall = fetchMock.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit | undefined];
    const requestBody = JSON.parse(String(firstCall[1]?.body)) as {
      model: string;
      text: {
        format: {
          type: string;
          name: string;
          strict: boolean;
        };
      };
    };

    expect(summary).toBe("这是一段结构化摘要。");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer test-key",
        }),
      }),
    );
    expect(requestBody.model).toBe("test-model");
    expect(requestBody.text.format).toEqual(
      expect.objectContaining({
        type: "json_schema",
        name: "note_summary",
        strict: true,
      }),
    );
  });

  it("解析行动项并把空描述规范化为 null", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  items: [
                    {
                      title: "完成 E2E 回归",
                      description: "",
                    },
                  ],
                }),
              },
            ],
          },
        ],
      }),
    );
    const fetcher = fetchMock as unknown as typeof fetch;
    const provider = createOpenAiProvider({
      apiKey: "test-key",
      model: "test-model",
      fetcher,
    });

    await expect(
      provider.extractActionItems({
        title: "测试笔记",
        content: "下一步需要完成 E2E 回归。",
      }),
    ).resolves.toEqual([
      {
        title: "完成 E2E 回归",
        description: null,
      },
    ]);
  });

  it("OpenAI 返回错误时转换为统一 AppError", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            message: "invalid api key",
          },
        },
        { status: 401 },
      ),
    );
    const fetcher = fetchMock as unknown as typeof fetch;
    const provider = createOpenAiProvider({
      apiKey: "bad-key",
      fetcher,
    });

    await expect(
      provider.summarizeNote({
        title: "测试笔记",
        content: "正文",
      }),
    ).rejects.toMatchObject({
      code: "AI_PROVIDER_ERROR",
      status: 401,
      message: "invalid api key",
    });
  });
});
