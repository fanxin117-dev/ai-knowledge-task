# 01. 项目总览与学习路线

## 1. 这个项目是什么

AI Knowledge Task Hub 是一个个人知识任务系统。用户可以创建笔记、管理任务和标签，把 AI 从笔记中提取的行动项转换成任务，并按项目管理任务。

本项目是一个全栈 Web 应用。全栈 (Full Stack) 指前端页面、后端接口、数据库、测试和部署配置都在同一个项目中协作。

## 2. 技术栈地图

| 层级 | 技术 | 本项目作用 | Python 类比 |
| --- | --- | --- | --- |
| 页面 | Next.js + React | 渲染页面、组织路由和组件 | FastAPI/Jinja 或 Streamlit 的页面层，但更适合复杂交互 |
| 语言 | TypeScript | 给 JavaScript 加类型检查 | Python + type hints + mypy 的感觉 |
| 样式 | Tailwind CSS | 用 class 直接写样式 | 类似给 HTML 写一组预定义样式函数 |
| API | Next.js Route Handlers | 提供 `/api/...` 接口 | FastAPI 的 `@app.get()` / `@app.post()` |
| 数据库 | PostgreSQL | 存储笔记、任务、标签、项目、AI 结果 | Python 常用 PostgreSQL 完全一样 |
| ORM | Prisma | 用类型安全 API 操作数据库 | SQLAlchemy ORM |
| 单元测试 | Vitest | 测服务层、AI provider、API 行为 | pytest |
| 端到端测试 | Playwright | 用真实浏览器模拟用户流程 | Selenium / Playwright Python |
| CI | GitHub Actions | 推送后自动检查项目 | GitHub Actions + pytest/mypy/ruff |

## 3. 代码结构怎么读

```text
src/app/
  页面和 API 路由。Next.js App Router 根据目录自动生成路由。

src/components/
  可复用 UI 组件，例如表单、卡片、看板。

src/lib/
  业务逻辑、数据库连接、AI provider、输入校验。

prisma/
  数据库模型和迁移文件。

tests/
  单元测试、API 测试、端到端测试。
```

## 4. 一次“新建任务”的完整链路

1. 页面：`src/app/tasks/new/page.tsx`
2. 表单组件：`src/components/tasks/task-form.tsx`
3. API：`src/app/api/tasks/route.ts`
4. 输入校验：`src/lib/api/validation.ts`
5. 服务层：`src/lib/api/services.ts`
6. 数据库：`prisma/schema.prisma` 中的 `Task`
7. 页面跳转：任务创建成功后进入 `/tasks/[id]`

Python 类比：

```python
@app.post("/api/tasks")
def create_task(payload: TaskInput):
    validated = validate(payload)
    task = task_service.create(validated)
    return {"data": task}
```

本项目对应 TypeScript：

```ts
export async function POST(request: Request) {
  const input = parseTaskInput(await readJsonBody(request));
  const task = await createTask(input);
  return NextResponse.json({ data: task }, { status: 201 });
}
```

位置：[src/app/api/tasks/route.ts](../../src/app/api/tasks/route.ts)

## 5. 本项目分阶段考虑了什么

1. 先做页面骨架：让应用有可见结构。
2. 再接 PostgreSQL：让数据真实持久化。
3. 再补 CRUD API：把页面从 mock 数据切到接口数据。
4. 再接 AI provider：先 mock，再支持用户手动配置不同模型。
5. 再补项目管理：避免任务散落在全局列表。
6. 再补任务效率：优先级、截止日期、逾期筛选、看板批量操作。
7. 最后补测试和 CI：避免功能越多越不敢改。

## 6. 学习目标

读完这套文档后，你应该能做到：

- 能解释 Next.js 页面和 API 路由怎么映射 URL。
- 能读懂 TypeScript 类型、React 组件和服务层函数。
- 能修改 Prisma 模型并生成迁移。
- 能新增一个 API 字段并让页面、测试一起通过。
- 能看懂 Playwright 测试如何模拟真实用户。

## 练习

打开 [src/app/tasks/page.tsx](../../src/app/tasks/page.tsx)，用自己的话写出“任务列表页读取了哪些查询参数，它们分别影响什么”。
