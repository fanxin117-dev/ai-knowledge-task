# 03. TypeScript、React 与 Next.js 前端

## 1. Next.js App Router 是什么

Next.js 是 React 全栈框架。App Router 是 Next.js 的目录路由系统：文件夹路径决定 URL。

官方文档：https://nextjs.org/docs/app

本项目示例：

| 文件 | URL | 功能 |
| --- | --- | --- |
| `src/app/page.tsx` | `/` | 首页工作台 |
| `src/app/notes/page.tsx` | `/notes` | 笔记列表 |
| `src/app/notes/[id]/page.tsx` | `/notes/:id` | 笔记详情 |
| `src/app/tasks/new/page.tsx` | `/tasks/new` | 新建任务 |
| `src/app/api/tasks/route.ts` | `/api/tasks` | 任务 API |

Python 类比：Next.js 文件路由类似 FastAPI 里手写路由表，只是路由由目录自动推导。

## 2. React 组件是什么

React 组件是返回 UI 的函数。最简单的组件：

```tsx
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
```

位置：[src/components/ui/empty-state.tsx](../../src/components/ui/empty-state.tsx)

`tsx` 是 TypeScript + JSX。JSX 是一种在 JavaScript/TypeScript 里写 HTML 结构的语法。

Python 类比：组件像一个返回 HTML 的函数，但 React 会管理它的状态和更新。

## 3. Props 类型

Props 是父组件传给子组件的数据。

示例：[src/components/tasks/task-card.tsx](../../src/components/tasks/task-card.tsx)

```tsx
type TaskCardProps = {
  task: {
    id: string;
    title: string;
    status: "OPEN" | "DONE";
  };
};

export function TaskCard({ task }: TaskCardProps) {
  return <article>{task.title}</article>;
}
```

Python 类比：

```python
from dataclasses import dataclass

@dataclass
class Task:
    id: str
    title: str
    status: str

def render_task_card(task: Task):
    return task.title
```

TypeScript 的好处是，如果你访问 `task.not_exists`，编辑器和 `npm run typecheck` 会报错。

## 4. Server Component 和 Client Component

Next.js 默认组件是 Server Component。Server Component 在服务器执行，可以直接读数据库或调用服务层。

示例：[src/app/tasks/page.tsx](../../src/app/tasks/page.tsx)

```tsx
export default async function TasksPage({ searchParams }: TasksPageProps) {
  const tasks = await listTasks({ query, tagId, status });
  return <main>{tasks.map((task) => <TaskCard key={task.id} task={task} />)}</main>;
}
```

Client Component 需要在文件顶部写：

```tsx
"use client";
```

它可以使用浏览器状态、点击事件、`useState`、`useEffect`。

示例：[src/components/tasks/task-form.tsx](../../src/components/tasks/task-form.tsx)

```tsx
"use client";

const [isSubmitting, setIsSubmitting] = useState(false);
```

Python 类比：Server Component 像后端模板渲染，Client Component 像浏览器里的交互脚本。

## 5. useState 和 useEffect

`useState` 保存组件内部状态。

```tsx
const [error, setError] = useState<string | null>(null);
```

意思是：`error` 可以是字符串，也可以是 `null`。

`useEffect` 在组件挂载、依赖变化时执行副作用。

示例：[src/components/notes/ai-note-panel.tsx](../../src/components/notes/ai-note-panel.tsx)

```tsx
useEffect(() => {
  function refreshConfig() {
    setAiConfig(readStoredAiConfig());
  }

  refreshConfig();
  window.addEventListener("storage", refreshConfig);
  return () => window.removeEventListener("storage", refreshConfig);
}, []);
```

功能：页面加载时读取浏览器里的 AI 配置，并监听配置变化。

## 6. 表单提交

示例：[src/components/tasks/task-form.tsx](../../src/components/tasks/task-form.tsx)

```tsx
async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: String(formData.get("title") ?? ""),
      priority: String(formData.get("priority") ?? "MEDIUM"),
    }),
  });
}
```

关键点：

- `preventDefault()` 阻止浏览器默认刷新页面。
- `FormData` 读取表单字段。
- `fetch` 调用后端 API。
- `JSON.stringify` 把对象转成 JSON 字符串。

Python 类比：类似 requests.post：

```python
requests.post("/api/tasks", json={"title": title})
```

## 7. Tailwind CSS 怎么写

Tailwind CSS 是原子化 CSS 框架。它不是写 `.card { ... }`，而是在 HTML class 里组合样式。

示例：

```tsx
<article className="rounded-lg border-2 border-line bg-surface p-4 shadow-panel">
```

含义：

- `rounded-lg`: 圆角
- `border-2`: 2px 边框
- `border-line`: 使用自定义颜色 line
- `bg-surface`: 背景色
- `p-4`: padding
- `shadow-panel`: 自定义阴影

自定义颜色位置：[tailwind.config.ts](../../tailwind.config.ts)

## 8. 本项目前端核心文件

| 文件 | 学什么 |
| --- | --- |
| `src/app/layout.tsx` | 全局布局 |
| `src/components/layout/app-shell.tsx` | 应用外壳 |
| `src/components/layout/sidebar-nav.tsx` | 导航 |
| `src/app/tasks/page.tsx` | 列表页、搜索参数、筛选 |
| `src/components/tasks/task-form.tsx` | 表单、状态、fetch |
| `src/components/projects/project-task-board.tsx` | 看板、排序、批量操作 |
| `src/components/notes/ai-note-panel.tsx` | AI 交互、错误提示、历史结果回显 |

## 练习

把 [src/components/tasks/task-card.tsx](../../src/components/tasks/task-card.tsx) 里的 `HIGH` 优先级显示文案改成 `紧急`，然后运行 `npm.cmd run typecheck`。
