# 04. Next.js API 与服务层设计

## 1. API Route Handler 是什么

Next.js Route Handler 用来写后端接口。文件名固定为 `route.ts`。

示例：

```text
src/app/api/tasks/route.ts
```

对应 URL：

```text
/api/tasks
```

官方文档：https://nextjs.org/docs/app/building-your-application/routing/route-handlers

Python 类比：

```python
@app.post("/api/tasks")
def create_task(payload: dict):
    ...
```

## 2. 本项目 API 分层

一次请求通常经过 4 层：

1. Route Handler：接收 HTTP 请求。
2. Request helper：读取 JSON。
3. Validation：校验输入。
4. Service：真正执行业务和数据库操作。

以创建任务为例：

```text
src/app/api/tasks/route.ts
  -> readJsonBody
  -> parseTaskInput
  -> createTask
  -> prisma.task.create
```

## 3. Route Handler 示例

位置：[src/app/api/tasks/route.ts](../../src/app/api/tasks/route.ts)

```ts
export async function POST(request: Request) {
  try {
    const input = parseTaskInput(await readJsonBody(request));
    const task = await createTask(input);

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
```

这段代码的功能：

- `POST` 函数处理 HTTP POST 请求。
- `readJsonBody` 读取请求体。
- `parseTaskInput` 校验并整理字段。
- `createTask` 调服务层创建任务。
- `NextResponse.json` 返回 JSON。
- `apiErrorResponse` 把异常转换成统一错误格式。

## 4. 统一错误格式

位置：[src/lib/api/error.ts](../../src/lib/api/error.ts)

统一响应类似：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数不合法。",
    "details": {
      "title": "标题不能为空。"
    }
  }
}
```

为什么要统一错误格式：

- 前端不用猜错误结构。
- 测试更稳定。
- 后续接 toast 或错误面板更容易。

Python 类比：FastAPI 里统一 `HTTPException` 和异常处理器。

## 5. 输入校验

位置：[src/lib/api/validation.ts](../../src/lib/api/validation.ts)

示例：

```ts
export function parseTaskInput(body: unknown): TaskInput {
  if (!isRecord(body)) {
    throw validationError({ body: "请求体必须是 JSON 对象。" });
  }

  const title = readString(body.title);
  const rawPriority = readString(body.priority);
  const priority =
    rawPriority === TaskPriority.LOW || rawPriority === TaskPriority.HIGH
      ? rawPriority
      : TaskPriority.MEDIUM;

  if (!title) {
    details.title = "标题不能为空。";
  }
}
```

关键概念：

- `unknown` 表示“我还不知道这个值是什么类型”。
- 先判断是不是对象，再读取字段。
- 校验失败就抛 `AppError`。

Python 类比：

```python
def parse_task_input(body: dict) -> TaskInput:
    title = str(body.get("title", "")).strip()
    if not title:
        raise ValidationError({"title": "标题不能为空"})
```

## 6. 服务层为什么存在

位置：[src/lib/api/services.ts](../../src/lib/api/services.ts)

服务层负责业务规则，不直接属于页面，也不直接属于 API。

例如：

```ts
async function ensureProjectExists(projectId: string | null) {
  if (!projectId) {
    return ensureDefaultProject();
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (project?.archivedAt) {
    throw new AppError({
      code: "CONFLICT",
      message: "项目已归档，不能继续添加任务。请先恢复项目。",
      status: 409,
    });
  }

  return project;
}
```

业务含义：

- 没传项目时使用默认项目。
- 项目不存在时返回 404。
- 项目已归档时禁止新增任务。

如果把这些逻辑散落在每个 API 文件里，后续会很难维护。

## 7. 序列化是什么

数据库返回的是 Date、关联表等复杂结构。API 应该返回前端好用的 JSON。

示例：

```ts
export function serializeTask(task) {
  return {
    id: task.id,
    title: task.title,
    dueAt: task.dueAt?.toISOString() ?? null,
    isOverdue,
    tags: task.taskTags.map((taskTag) => serializeTag(taskTag.tag)),
  };
}
```

序列化 (Serialization) 就是把内部对象转换成适合传输和展示的数据。

Python 类比：Pydantic model 的 `model_dump()`。

## 8. GET 查询参数

位置：[src/app/api/tasks/route.ts](../../src/app/api/tasks/route.ts)

```ts
const url = new URL(request.url);
const tasks = await listTasks({
  query: url.searchParams.get("q") ?? undefined,
  status: readTaskStatus(url.searchParams.get("status")),
  priority: readTaskPriority(url.searchParams.get("priority")),
  overdue: url.searchParams.get("overdue") === "true",
});
```

对应 URL：

```text
/api/tasks?q=test&status=OPEN&priority=HIGH&overdue=true
```

Python 类比：FastAPI 查询参数：

```python
def list_tasks(q: str | None = None, status: str | None = None):
    ...
```

## 练习

打开 [src/app/api/projects/[id]/route.ts](../../src/app/api/projects/[id]/route.ts)，解释 `PATCH` 为什么可以同时支持“编辑项目”和“归档项目”。
