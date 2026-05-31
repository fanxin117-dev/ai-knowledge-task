# 07. 测试体系：Vitest、Playwright 与回归测试

## 1. 为什么要测试

AI 辅助编码很容易生成“看起来能跑”的代码，但边界条件可能坏掉。测试的作用是把关键行为固定下来。

本项目有三类测试：

- AI provider 单元测试
- 核心 API 回归测试
- 浏览器端到端测试

## 2. Vitest

Vitest 是 JavaScript/TypeScript 测试框架，类似 Python 的 pytest。

官方文档：https://vitest.dev/guide/

运行：

```powershell
npm.cmd run test
```

配置位置：[vitest.config.ts](../../vitest.config.ts)

## 3. API 测试

位置：[tests/api/core-api.test.ts](../../tests/api/core-api.test.ts)

示例：

```ts
it("返回统一的输入校验错误", async () => {
  const response = await postNote(jsonRequest("http://localhost/api/notes", { title: "", content: "" }));
  const payload = await readJson(response);

  expect(response.status).toBe(400);
  expect(payload.error?.code).toBe("VALIDATION_ERROR");
});
```

Python pytest 类比：

```python
def test_validation_error(client):
    response = client.post("/api/notes", json={"title": "", "content": ""})
    assert response.status_code == 400
```

本项目 API 测试不需要浏览器，直接调用 route handler。

## 4. Provider 测试

位置：

- [tests/ai/openai-provider.test.ts](../../tests/ai/openai-provider.test.ts)
- [tests/ai/configurable-provider.test.ts](../../tests/ai/configurable-provider.test.ts)

它们验证：

- 没有 API Key 时错误清楚。
- 外部 provider 返回错误时能转成统一 AppError。
- 模型返回 JSON 时能正确解析。
- 模型返回坏格式时能报错。

重点：测试里不会真的调用 OpenAI，使用 fake fetcher 模拟响应。

## 5. Playwright 端到端测试

Playwright 是浏览器自动化测试工具。它会打开真实浏览器，模拟用户点击、输入、跳转。

官方文档：https://playwright.dev/docs/intro

运行：

```powershell
npm.cmd run test:e2e
```

测试位置：[tests/e2e/knowledge-flow.spec.ts](../../tests/e2e/knowledge-flow.spec.ts)

它覆盖：

- 新建标签
- 新建笔记
- 生成 AI 摘要
- 提取行动项
- 行动项转任务
- 刷新后 AI 结果回显
- 编辑任务优先级、截止日期、标签
- 标签筛选
- 逾期筛选
- 项目看板排序
- 批量完成
- 编辑笔记
- 清理测试数据

## 6. Playwright 语法

```ts
await page.goto("/notes/new");
await page.getByLabel("TITLE").fill(noteTitle);
await page.getByRole("button", { name: "创建笔记" }).click();
await expect(page.getByRole("heading", { name: noteTitle })).toBeVisible();
```

解释：

- `page.goto`: 打开页面。
- `getByLabel`: 按表单 label 找输入框。
- `getByRole`: 按可访问性角色找按钮、标题等。
- `expect(...).toBeVisible()`: 断言元素可见。

Python Playwright 类比：

```python
page.goto("/notes/new")
page.get_by_label("TITLE").fill(note_title)
page.get_by_role("button", name="创建笔记").click()
expect(page.get_by_role("heading", name=note_title)).to_be_visible()
```

## 7. E2E 启动脚本

位置：[scripts/run-e2e.mjs](../../scripts/run-e2e.mjs)

它会：

1. 找一个测试端口。
2. 启动 Next.js dev server。
3. 运行 Playwright。
4. 结束后关闭服务。

这样你不用手动先开 `npm run dev`。

## 8. 测试数据清理

E2E 测试会创建临时数据，名字包含 `e2e-时间戳`。最后用 API 删除。

示例：

```ts
async function deleteCreatedTasks(request: APIRequestContext, runId: string) {
  const response = await request.get(`/api/tasks?q=${encodeURIComponent(runId)}`);
  const payload = await response.json();
  for (const task of payload.data ?? []) {
    await request.delete(`/api/tasks/${task.id}`);
  }
}
```

为什么要清理：

- 避免测试数据污染页面。
- 保证下一次测试结果稳定。
- 不让数据库越来越脏。

## 9. 如何新增测试

新增功能时，建议按这个顺序：

1. 先加 API 测试，验证数据行为。
2. 再加 Playwright 测试，验证用户流程。
3. 如果是 AI provider，优先 fake fetch，不要真实扣费。

## 练习

在 [tests/e2e/knowledge-flow.spec.ts](../../tests/e2e/knowledge-flow.spec.ts) 里增加一步：进入任务详情后点击“返回任务列表”，断言回到 `/tasks` 页面。
