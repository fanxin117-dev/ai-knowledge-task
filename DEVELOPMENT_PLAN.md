# AI Knowledge Task Hub MVP 开发计划

## 1. 项目目标

AI Knowledge Task Hub 是一个用于学习 vibe coding 的个人知识任务系统。MVP（Minimum Viable Product，最小可用产品）阶段的目标不是做完整生产级系统，而是做出一个结构清晰、可运行、可测试、可迭代的小型全栈应用。

本项目要覆盖以下工程能力：

- 需求拆解与任务规划
- 前端页面与组件开发
- 后端接口设计
- 数据模型设计
- AI mock service 设计
- 本地开发、测试与调试
- 文档、配置和后续部署准备

## 2. 技术栈

### 2.1 核心技术

- Next.js：React 全栈框架，可同时承载页面渲染和后端 API，适合快速构建 MVP。
- React：用于构建交互式用户界面，核心思想是把页面拆成可复用组件。
- TypeScript：JavaScript 的类型增强版本，可以在开发阶段发现大量类型错误，提升可维护性。
- Tailwind CSS：原子化 CSS 框架，通过组合类名快速实现界面样式，适合快速迭代 UI。
- PostgreSQL：关系型数据库，适合从 MVP 阶段就练习真实 Web 应用的数据建模、迁移、索引和部署配置。
- Prisma：ORM（Object-Relational Mapping，对象关系映射）工具，用类型安全的方式操作数据库，减少手写 SQL 的错误。
- Vitest：单元测试框架，用于测试工具函数、业务逻辑和 mock service。
- Playwright：端到端测试（End-to-End Testing, E2E）工具，用真实浏览器模拟用户操作，验证关键流程是否可用。

### 2.2 版本建议

- Node.js：20 LTS 或更高版本
- Next.js：使用当前稳定版本
- TypeScript：5.x
- Prisma：使用当前稳定版本
- PostgreSQL：15 或更高版本，本地可使用 Docker 或本机安装

## 3. MVP 功能范围

### 3.1 笔记管理

- 新建笔记
- 编辑笔记
- 删除笔记
- 查看笔记列表
- 查看笔记详情
- 按标题和正文搜索笔记
- 给笔记添加标签

### 3.2 任务管理

- 新建任务
- 编辑任务
- 删除任务
- 标记任务完成或未完成
- 按状态筛选任务
- 按标题搜索任务
- 给任务添加标签
- 将任务归属到项目
- 设置优先级和截止日期
- 标记逾期任务并支持逾期筛选

### 3.3 项目管理

- 新建项目
- 编辑项目
- 归档和恢复项目
- 在项目详情页按待办、已完成两列管理任务
- 在项目看板内排序任务，并对选中任务做批量完成或批量重开

### 3.4 标签管理

- 创建标签
- 将标签关联到笔记
- 将标签关联到任务
- 按标签筛选笔记和任务

### 3.5 AI 功能

MVP 阶段先使用 mock AI provider。mock provider 是模拟实现，用固定规则生成看起来像 AI 的结果，目的是先打通前后端流程，避免一开始就被真实模型、密钥、费用和网络问题阻塞。

- 对单篇笔记生成摘要
- 从单篇笔记中提取行动项
- 将行动项转换为任务
- 展示 AI 结果是否已保存、最近保存时间、空结果提示和失败后的重试入口

真实 AI API 已通过 provider 方式接入。API（Application Programming Interface，应用程序编程接口）是系统之间通信的约定；当前前端和业务路由只依赖统一 provider 接口，因此 mock、OpenAI、Google Gemini、DeepSeek、本地 Ollama/LM Studio 等 OpenAI-compatible 服务可以通过页面配置切换。

## 4. 页面结构

### 4.1 路由规划

```text
/
  仪表盘首页

/notes
  笔记列表页

/notes/new
  新建笔记页

/notes/[id]
  笔记详情页

/notes/[id]/edit
  编辑笔记页

/tasks
  任务列表页

/tasks/new
  新建任务页

/tasks/[id]/edit
  编辑任务页

/projects
  项目列表页

/projects/new
  新建项目页

/projects/[id]
  项目详情和任务看板页

/projects/[id]/edit
  编辑项目页

/tags
  标签管理页
```

### 4.2 首页内容

首页只做工作台，不做营销页。

首页展示：

- 最近笔记
- 待完成任务
- 常用标签
- 最近一次 AI 摘要结果
- 快捷入口：新建笔记、新建任务

## 5. 数据模型

### 5.1 实体关系

```text
Note
  一篇笔记，可以有多个标签，可以有多个 AI 结果。

Task
  一个任务，可以有多个标签，也可以从 AI 行动项生成。

Project
  一个项目承载一组任务，项目可以归档；归档后保留历史任务，但默认列表不再显示。

Tag
  标签，可同时关联笔记和任务。

AiResult
  AI 处理结果，例如摘要或行动项提取。
```

### 5.2 Prisma 模型草案

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Note {
  id        String   @id @default(cuid())
  title     String
  content   String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tags      Tag[]    @relation("NoteTags")
  aiResults AiResult[]

  @@map("notes")
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  sourceNoteId String?  @map("source_note_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tags        Tag[]    @relation("TaskTags")

  @@map("tasks")
}

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now()) @map("created_at")

  notes     Note[]   @relation("NoteTags")
  tasks     Task[]   @relation("TaskTags")

  @@map("tags")
}

model AiResult {
  id        String   @id @default(cuid())
  noteId    String   @map("note_id")
  type      String
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  note      Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@map("ai_results")
}
```

### 5.3 设计说明

- Note 和 Task 分开建模，避免笔记和任务的字段互相污染。
- Tag 使用多对多关系，便于同一个标签同时服务笔记和任务。
- AiResult 单独建表，便于保留历史 AI 输出，也便于后续比较不同模型或提示词版本。
- Task.sourceNoteId 暂时使用普通字符串字段，MVP 阶段只记录来源，不强制建立复杂外键关系。
- Project.archivedAt 使用归档时间而不是布尔值，可以同时表达“是否归档”和“什么时候归档”。
- PostgreSQL 连接统一通过 `DATABASE_URL` 环境变量配置，避免把本地账号、密码和端口写死在代码里。
- 数据库实际表名和列名统一使用下划线命名，例如 `notes`、`note_tags`、`created_at`、`source_note_id`；Prisma 代码层字段可以通过 `@map` / `@@map` 保持类型可读性。

## 6. API 设计

### 6.1 笔记接口

```text
GET    /api/notes
POST   /api/notes
GET    /api/notes/:id
PATCH  /api/notes/:id
DELETE /api/notes/:id
```

查询参数：

```text
GET /api/notes?q=keyword&tag=tagId
```

### 6.2 任务接口

```text
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

查询参数：

```text
GET /api/tasks?q=keyword&status=open&tag=tagId
```

### 6.3 标签接口

```text
GET  /api/tags
POST /api/tags
```

MVP 阶段可以先不做删除标签，避免处理已关联内容的级联影响。后续需要删除时，应明确是禁止删除已使用标签，还是解除所有关联后删除。

### 6.4 AI 接口

```text
POST /api/ai/summarize-note
POST /api/ai/extract-actions
POST /api/ai/actions-to-tasks
```

请求和响应示例：

```json
{
  "noteId": "note_123"
}
```

```json
{
  "summary": "这篇笔记主要讨论 MVP 的功能边界和开发顺序。"
}
```

## 7. 前端组件拆分

### 7.1 通用布局组件

- AppShell：应用整体框架，包含侧边栏、顶部栏和主内容区。
- SidebarNav：侧边导航。
- PageHeader：页面标题、说明和主要操作按钮。
- EmptyState：空状态展示。
- ConfirmDialog：删除前确认弹窗。

### 7.2 表单组件

- NoteForm：笔记新建和编辑表单。
- TaskForm：任务新建和编辑表单。
- TagInput：标签输入和选择组件。
- SearchInput：搜索输入框。

### 7.3 业务组件

- NoteList：笔记列表。
- NoteCard：单条笔记卡片。
- NoteDetail：笔记详情。
- TaskList：任务列表。
- TaskItem：单条任务。
- TaskStatusFilter：任务状态筛选。
- AiSummaryPanel：AI 摘要结果面板。
- ActionItemsPanel：AI 行动项面板。

## 8. AI Provider 设计

### 8.1 服务边界

AI 相关逻辑统一放在 provider 层，例如：

```text
src/lib/ai/provider.ts
src/lib/ai/configurable-ai-provider.ts
src/lib/ai/mock-ai-service.ts
src/lib/ai/openai-ai-provider.ts
src/lib/ai/types.ts
```

前端和 API route 不直接写 mock 规则或某个厂商的请求细节，而是调用统一 provider 接口。这样后续更换模型、增加本地模型或调整提示词时，页面和 CRUD 业务不用跟着改。

### 8.2 方法设计

```ts
type ActionItem = {
  title: string;
  description?: string;
};

interface AiProvider {
  name: string;
  summarizeNote(input: { title: string; content: string }): Promise<string>;
  extractActionItems(input: { title: string; content: string }): Promise<ActionItem[]>;
}
```

### 8.3 Mock 规则

- 摘要：截取正文前若干句，并加上固定前缀。
- 行动项：按换行、列表符号或关键词提取候选句子。
- 如果正文过短，返回明确的空结果提示。

### 8.4 OpenAI 规则

- 使用 OpenAI Responses API 生成文本。
- 使用 JSON Schema 结构化输出，摘要返回 `{ "summary": string }`，行动项返回 `{ "items": [...] }`。
- 缺少 `OPENAI_API_KEY`、请求超时、OpenAI 返回错误、JSON 解析失败时，统一转换成 `AI_PROVIDER_ERROR`。

### 8.5 手动配置规则

- `/settings/ai` 页面提供预设模板，但所有字段都允许用户按自己的账号和模型修改。
- 配置保存在浏览器 `localStorage`，不写入数据库，避免把个人 API Key 持久化到 PostgreSQL。
- 支持 `chat-completions` 和 `responses` 两种 OpenAI-compatible 风格。
- 前端调用 AI 时把当前配置作为 `aiConfig` 随请求发送；后端校验 `baseUrl`、`model`、`apiStyle` 后再创建 provider。
- 自动测试和端到端测试固定使用 mock provider，避免真实接口费用和网络波动影响回归。

## 9. 错误处理策略

### 9.1 API 错误格式

所有接口统一返回以下错误结构：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "标题不能为空"
  }
}
```

### 9.2 常见错误场景

- 表单字段为空
- 查询的笔记或任务不存在
- 删除不存在的数据
- AI 处理空正文
- 数据库写入失败

### 9.3 前端展示策略

- 表单校验错误显示在字段附近。
- 接口错误使用 toast 或页面内提示。
- 删除操作必须二次确认。
- 加载中、空状态、错误状态都要有明确 UI。

## 10. 测试计划

### 10.1 单元测试

使用 Vitest 覆盖：

- mock AI 摘要逻辑
- 行动项提取逻辑
- 搜索参数解析
- 表单校验函数

### 10.2 API 测试

覆盖以下场景：

- 创建笔记成功
- 创建空标题笔记失败
- 搜索笔记成功
- 创建任务成功
- 切换任务完成状态成功
- AI 摘要空正文失败

### 10.3 端到端测试

使用 Playwright 覆盖：

- 用户新建一篇笔记
- 用户搜索笔记
- 用户对笔记生成摘要
- 用户从行动项生成任务
- 用户查看生成任务
- 用户编辑任务优先级、截止日期和标签
- 用户使用标签筛选和逾期筛选验证任务可检索
- 用户在项目看板内排序任务并批量完成选中任务
- 用户编辑笔记

当前仓库通过 `npm run test:e2e` 运行端到端测试。脚本会自动启动本地 Next.js 开发服务器，运行 Playwright，并在结束后关闭服务器。

## 11. 分阶段开发顺序

### 阶段 1：项目骨架

目标：

- 初始化 Next.js + TypeScript + Tailwind CSS 项目
- 建立基础目录结构
- 实现 AppShell、导航、首页空状态
- 添加 README 和 .env.example

验收标准：

- 本地开发服务器可以启动
- 首页、笔记页、任务页、标签页可以访问
- 页面没有运行时错误

### 阶段 2：无数据库前端原型

目标：

- 使用内存 mock 数据展示笔记和任务
- 实现列表、详情、空状态、搜索框和筛选控件
- 明确组件边界

验收标准：

- 可以看到笔记列表和任务列表
- 搜索和筛选在 mock 数据上可用
- 组件结构稳定，后续可接 API

### 阶段 3：数据库和 Prisma

目标：

- 安装并配置 Prisma + PostgreSQL
- 建立 Note、Task、Tag、AiResult 数据模型
- 创建数据库迁移
- 添加 seed 数据

验收标准：

- `prisma migrate` 可以成功执行
- 本地 PostgreSQL 数据库包含示例数据
- Prisma Client 可以正常查询数据

### 阶段 4：基础 API

目标：

- 实现 notes、tasks、tags 的基础 CRUD API
- 统一错误返回格式
- 添加输入校验

验收标准：

- 可以通过 API 创建、读取、更新和删除笔记与任务
- 非法输入返回明确错误
- 不存在的数据返回 404

### 阶段 5：前后端联调

目标：

- 前端页面改为调用真实 API
- 实现创建、编辑、删除、状态切换
- 接入加载态和错误态

验收标准：

- 用户可在界面完成笔记和任务的完整管理流程
- 刷新页面后数据仍然存在
- 常见错误能被用户看见并理解

### 阶段 6：AI Mock 功能

目标：

- 实现 mock AI service
- 实现摘要生成接口
- 实现行动项提取接口
- 实现行动项转换任务

验收标准：

- 用户可以在笔记详情页生成摘要
- 用户可以从笔记中提取行动项
- 用户可以将行动项保存为任务
- AI 结果会保存到 AiResult 表

### 阶段 7：测试和文档

目标：

- 添加 Vitest 单元测试
- 添加 Playwright 端到端测试
- 完善 README
- 补充开发、测试、数据库迁移说明

验收标准：

- 单元测试可运行
- 关键用户流程的端到端测试可运行
- 新开发者可以按 README 启动项目

当前状态：

- `npm run test` 已覆盖核心 CRUD API 和 AI mock API。
- `tests/ai/openai-provider.test.ts` 已覆盖 OpenAI provider 的请求构造、响应解析、错误转换和密钥缺失场景。
- `tests/ai/configurable-provider.test.ts` 已覆盖 OpenAI-compatible provider 的 `chat/completions`、`responses`、非法配置场景。
- `npm run test:e2e` 已覆盖笔记创建、AI 摘要、行动项提取、行动项转任务、任务检索和笔记编辑。
- AI 调用已抽象为 provider，`AI_PROVIDER=mock` 为当前默认实现；页面手动配置可覆盖运行时 provider。
- 任务已增加项目归属，`projects`、`tasks.project_id` 使用下划线命名；AI 行动项转任务会按项目和标题去重。

## 12. 建议目录结构

```text
src/
  app/
    page.tsx
    notes/
    tasks/
    tags/
    api/
  components/
    layout/
    notes/
    tasks/
    tags/
    ai/
    ui/
  lib/
    prisma.ts
    validation.ts
    ai/
      configurable-ai-provider.ts
      provider.ts
      mock-ai-service.ts
      openai-ai-provider.ts
      client-config.ts
      types.ts
  tests/
    unit/
    e2e/

prisma/
  schema.prisma
  seed.ts

docs/
  DEVELOPMENT_PLAN.md

.env.example
README.md
```

`.env.example` 至少需要包含：

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_task_hub?schema=public"
AI_PROVIDER="mock"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.2"
```

这里的账号、密码、端口和数据库名只作为本地开发示例。实际项目中应根据本机 PostgreSQL 配置调整。

## 13. 工程风险与处理方案

### 13.1 一次性生成过多代码

风险：AI 可能生成大量看似完整但难以运行和维护的代码。

处理：每次只实现一个小功能，完成后立即运行、测试和审查。

### 13.2 数据模型过早复杂化

风险：一开始加入用户系统、权限、文件上传、向量数据库，会导致 MVP 失控。

处理：MVP 阶段只做单用户本地系统，不做登录，不做文件上传，不做真实向量搜索。

### 13.3 AI 接口耦合业务逻辑

风险：如果前端或 API route 直接写 OpenAI 调用，后续替换模型会很痛苦。

处理：统一通过 AiService 接口调用 AI 能力，mock 和真实服务都实现同一个接口。

### 13.4 测试滞后

风险：功能能跑但缺少回归保障，后续修改容易破坏已有流程。

处理：从 mock AI 和核心 API 开始补测试，再补关键端到端流程。

### 13.5 搜索能力预期过高

风险：用户可能期待语义搜索，但 MVP 只实现标题和正文全文搜索。

处理：明确 MVP 搜索是关键词搜索。语义搜索和向量嵌入放到后续版本。

## 14. MVP 不做范围

以下内容暂不进入 MVP：

- 用户注册和登录
- 多用户权限
- 文件上传
- 向量数据库
- 复杂提醒系统
- 团队协作
- 移动端 App
- 生产环境监控

这些能力都可以作为后续阶段扩展，但不应阻塞 MVP 学习目标。

## 15. 后续扩展路线

MVP 完成后可以按以下顺序扩展：

1. 用真实 OpenAI API Key 做端到端验收，并记录可用模型与额度限制。
2. 增加语义搜索和向量嵌入。
3. 增加文件上传和文档解析。
4. 增加用户登录和权限。
5. 增加提醒和日程视图。
6. 使用 Docker 打包部署。
7. 添加 CI（Continuous Integration，持续集成）自动运行测试。

## 16. 推荐执行方式

每个阶段都按以下节奏执行：

```text
明确目标
  -> 让 AI 生成最小改动
  -> 本地运行
  -> 记录错误
  -> 让 AI 根据真实错误修复
  -> 补测试
  -> 人工审查
  -> 更新文档
```

这个节奏比一次性生成完整项目更适合学习 vibe coding，因为它会暴露真实开发中的反馈循环：需求是否清楚、代码是否可运行、错误是否可定位、测试是否覆盖核心行为、重构是否会破坏已有功能。
