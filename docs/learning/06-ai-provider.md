# 06. AI Provider、配置与模型调用

## 1. AI Provider 是什么

AI Provider 是对不同模型服务商的统一封装。页面不直接知道 OpenAI、DeepSeek、Gemini 或本地模型怎么调用，只调用统一接口。

位置：[src/lib/ai/types.ts](../../src/lib/ai/types.ts)

```ts
export type AiProvider = {
  name: string;
  summarizeNote(input: AiNoteInput): Promise<string>;
  extractActionItems(input: AiNoteInput): Promise<ActionItem[]>;
};
```

Python 类比：

```python
class AiProvider(Protocol):
    name: str
    async def summarize_note(self, input: AiNoteInput) -> str: ...
    async def extract_action_items(self, input: AiNoteInput) -> list[ActionItem]: ...
```

## 2. 为什么先做 mock

位置：[src/lib/ai/mock-ai-service.ts](../../src/lib/ai/mock-ai-service.ts)

mock provider 是本地模拟 AI：

```ts
export async function summarizeNote(input: AiNoteInput) {
  return `《${input.title}》摘要：${core}。`;
}
```

好处：

- 不需要 API Key。
- 不花钱。
- 测试稳定。
- 开发时不用依赖外部网络。

Python 类比：pytest 里用 fake client 或 monkeypatch 代替真实第三方 API。

## 3. 用户手动配置 AI

位置：[src/components/ai/ai-provider-settings.tsx](../../src/components/ai/ai-provider-settings.tsx)

配置保存到浏览器 `localStorage`，不会写入数据库。

位置：[src/lib/ai/client-config.ts](../../src/lib/ai/client-config.ts)

```ts
export const AI_CONFIG_STORAGE_KEY = "knowledge-hub.ai-config.v1";
```

为什么不写数据库：

- 当前项目还没有用户登录。
- API Key 是敏感信息。
- 放在浏览器只适合本地学习，不适合生产。

## 4. OpenAI-compatible provider

位置：[src/lib/ai/configurable-ai-provider.ts](../../src/lib/ai/configurable-ai-provider.ts)

它支持两种接口风格：

- `chat-completions`
- `responses`

OpenAI Responses API 官方文档：https://platform.openai.com/docs/api-reference/responses

请求核心：

```ts
const response = await input.fetcher(input.endpoint, {
  method: "POST",
  headers: buildHeaders(input.apiKey),
  body: JSON.stringify(input.body),
  signal: controller.signal,
});
```

这和 Python requests/aiohttp 很像：

```python
response = requests.post(
    endpoint,
    headers={"Authorization": f"Bearer {api_key}"},
    json=body,
    timeout=30,
)
```

## 5. 为什么强制 JSON 输出

AI 摘要希望返回：

```json
{ "summary": "..." }
```

行动项希望返回：

```json
{
  "items": [
    { "title": "...", "description": "..." }
  ]
}
```

位置：[src/lib/ai/configurable-ai-provider.ts](../../src/lib/ai/configurable-ai-provider.ts)

```ts
function normalizeSummary(value: unknown) {
  if (typeof value === "object" && value !== null && "summary" in value) {
    return value.summary.trim();
  }

  throw new AppError({
    code: "AI_PROVIDER_ERROR",
    message: "AI 摘要结果格式不正确，应返回 { summary: string }。",
  });
}
```

原因：如果让模型自由输出长文本，程序很难稳定解析。结构化 JSON 更适合工程化。

## 6. AI API 路由

摘要接口：[src/app/api/ai/summarize-note/route.ts](../../src/app/api/ai/summarize-note/route.ts)

```ts
const note = await getNoteByIdOrThrow(noteId);
const provider = getAiProvider(aiConfig);
const summary = await provider.summarizeNote({ title: note.title, content: note.content });
const result = await saveNoteSummary(noteId, summary);
```

这个流程：

1. 找到笔记。
2. 根据配置选择 provider。
3. 调用模型生成摘要。
4. 保存到 `ai_results`。
5. 返回给前端。

## 7. 前端 AI 面板

位置：[src/components/notes/ai-note-panel.tsx](../../src/components/notes/ai-note-panel.tsx)

它做了这些事：

- 读取浏览器 AI 配置。
- 生成摘要。
- 提取行动项。
- 把行动项转成任务。
- 显示保存时间。
- 失败后允许重试。
- 刷新页面后回显最近保存的结果。

关键函数：

```ts
async function postJson<T>(endpoint: string, body: unknown) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
```

`<T>` 是 TypeScript 泛型 (Generic)，意思是调用者可以指定返回 data 的类型。

Python 类比：类似给函数返回值加泛型类型提示。

## 8. 常见错误怎么判断

- 400：通常是输入配置不合法，例如 baseUrl 没有 http。
- 401/403：通常是 API Key、权限或模型访问问题。
- 429：通常是额度或限流。
- 502：通常是模型响应格式不符合预期，或外部 provider 请求失败。

本项目会把 provider 的 `httpStatus`、`providerCode`、`providerStatus` 透传给前端，方便排查。

## 练习

打开 [src/lib/ai/client-config.ts](../../src/lib/ai/client-config.ts)，新增一个你常用模型服务商的 preset，只改配置，不改 provider 逻辑。
