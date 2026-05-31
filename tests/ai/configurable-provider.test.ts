import { describe, expect, it, vi } from "vitest";
import { createOpenAiCompatibleProvider } from "../../src/lib/ai/configurable-ai-provider";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("OpenAI-compatible provider", () => {
  it("按 chat-completions 风格调用自定义 baseUrl", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "兼容接口摘要。",
              }),
            },
          },
        ],
      }),
    );
    const provider = createOpenAiCompatibleProvider({
      label: "DeepSeek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      apiStyle: "chat-completions",
      apiKey: "test-key",
      fetcher: fetchMock as unknown as typeof fetch,
    });

    await expect(
      provider.summarizeNote({
        title: "测试",
        content: "需要验证自定义接口。",
      }),
    ).resolves.toBe("兼容接口摘要。");

    const firstCall = fetchMock.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit | undefined];
    const body = JSON.parse(String(firstCall[1]?.body)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
      response_format: { type: string };
    };

    expect(firstCall[0]).toBe("https://api.deepseek.com/chat/completions");
    expect(firstCall[1]?.headers).toEqual(
      expect.objectContaining({
        authorization: "Bearer test-key",
      }),
    );
    expect(body.model).toBe("deepseek-chat");
    expect(body.response_format.type).toBe("json_object");
    expect(body.messages.map((message) => message.role)).toEqual(["system", "user"]);
  });

  it("按 responses 风格调用自定义 baseUrl", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        output_text: JSON.stringify({
          items: [
            {
              title: "验证本地模型",
              description: "通过 Responses API 兼容入口返回 JSON。",
            },
          ],
        }),
      }),
    );
    const provider = createOpenAiCompatibleProvider({
      label: "Local Responses",
      baseUrl: "http://localhost:11434/v1/",
      model: "llama3.2",
      apiStyle: "responses",
      fetcher: fetchMock as unknown as typeof fetch,
    });

    await expect(
      provider.extractActionItems({
        title: "测试",
        content: "下一步需要验证本地模型。",
      }),
    ).resolves.toEqual([
      {
        title: "验证本地模型",
        description: "通过 Responses API 兼容入口返回 JSON。",
      },
    ]);

    const firstCall = fetchMock.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit | undefined];

    expect(firstCall[0]).toBe("http://localhost:11434/v1/responses");
  });

  it("拒绝无效 baseUrl 和空 model", () => {
    expect(() =>
      createOpenAiCompatibleProvider({
        baseUrl: "api.example.com",
        model: "",
        apiStyle: "chat-completions",
      }),
    ).toThrow("AI baseUrl 必须以 http:// 或 https:// 开头。");
  });
});
