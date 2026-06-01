# AI Knowledge Task Hub

AI Knowledge Task Hub 是一个用于学习 vibe coding 的个人知识任务系统。当前仓库已进入第十阶段：任务优先级、截止日期、逾期提示、项目看板排序和批量操作已经接入，页面数据来自 PostgreSQL。

## 当前阶段范围

已完成：

- Next.js + React + TypeScript 项目基础配置
- Tailwind CSS 样式配置
- 全局布局 AppShell
- 桌面端和移动端导航
- 工作台、笔记、任务、标签、AI 助手页面
- 笔记列表、笔记详情、任务列表、任务详情
- 笔记关键词搜索和标签筛选
- 任务标题搜索、状态筛选和标签筛选
- 任务优先级、截止日期和逾期筛选
- 项目维度的任务归属和筛选
- 项目新建、编辑、归档、恢复和项目详情任务看板
- 项目看板支持任务排序和批量完成 / 批量重开
- PostgreSQL + Prisma 表设计和迁移
- notes、tasks、tags 基础 CRUD API
- 笔记、任务、标签的创建、编辑、删除表单
- AI mock service 摘要生成、行动项提取、行动项转任务
- AI provider 环境变量开关，支持 mock provider 和 OpenAI provider
- AI 配置页，支持 OpenAI-compatible baseUrl、model、apiKey、apiStyle 手动配置
- OpenAI、Google Gemini、DeepSeek、Ollama、LM Studio 预设模板
- OpenAI-compatible provider 支持 `chat/completions` 和 `responses` 两种接口风格
- AI 摘要和行动项支持保存状态提示、失败重试、空结果提示和刷新后回显
- 统一 API 错误格式和输入校验
- 核心 API 测试
- OpenAI provider 单元测试
- OpenAI-compatible provider 单元测试
- Playwright 端到端测试，覆盖笔记到 AI 行动项、任务落库、AI 结果回显、任务编辑、标签筛选、逾期筛选和项目看板批量操作
- AI 行动项转任务按项目和标题去重，避免重复创建
- 任务状态支持在项目看板中快速切换
- 数据库 seed SQL 示例数据
- `.env.example` 环境变量示例

暂未实现：

- 用户认证和权限
- 真实 OpenAI 调用的端到端验收脚本

## 运行环境

- Node.js 20 LTS 或更高版本
- npm
- PostgreSQL 15 或更高版本

Node.js 是 JavaScript 的服务端运行环境，用来执行 Next.js 开发服务器。npm（Node Package Manager，Node 包管理器）用于安装依赖和运行项目脚本。

## 数据库配置

本地 PostgreSQL 连接信息：

```text
DATABASE_URL="postgresql://fxyan:qwe123@localhost:5432/knowledge?schema=public"
AI_PROVIDER="mock"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.2"
```

`AI_PROVIDER` 当前支持 `mock` 和 `openai` 两个值。`mock` 是本地模拟实现，适合开发和测试；`openai` 会调用 OpenAI Responses API。没有密钥时请保持 `AI_PROVIDER="mock"`。

环境变量只是后端默认值。实际使用时可以打开：

```text
http://localhost:3000/settings/ai
```

在页面里手动配置 AI 服务。配置会保存到当前浏览器的 `localStorage`，不会写入 PostgreSQL。

启用真实 OpenAI：

```text
AI_PROVIDER="openai"
OPENAI_API_KEY="你的 OpenAI API Key"
OPENAI_MODEL="gpt-5.2"
```

页面配置示例：

```text
OpenAI:
baseUrl = https://api.openai.com/v1
apiStyle = responses

Google Gemini:
baseUrl = https://generativelanguage.googleapis.com/v1beta/openai
apiStyle = chat-completions

DeepSeek:
baseUrl = https://api.deepseek.com
apiStyle = chat-completions

Ollama:
baseUrl = http://localhost:11434/v1
apiStyle = chat-completions

LM Studio:
baseUrl = http://localhost:1234/v1
apiStyle = chat-completions
```

模型名和密钥按自己的账号或本地服务实际情况填写。

生成 Prisma Client：

```bash
npm run db:generate
```

执行开发迁移：

```bash
npm run db:migrate
```

如果数据库用户没有创建 shadow database 的权限，可以使用当前仓库已生成的迁移文件，并执行：

```bash
npm run db:deploy
```

写入示例数据：

```bash
npm run db:seed
```

## 本地启动

第一次运行需要先安装依赖：

```bash
npm install
```

启动本地开发服务器：

```bash
npm run dev
```

启动后访问：

```text
http://localhost:3000
```

如果你在 Windows PowerShell 遇到 `npm.ps1` 执行策略错误，可以改用：

```powershell
npm.cmd install
npm.cmd run dev
```

## 测试

运行核心 API 测试：

```bash
npm run test
```

测试会创建临时标签、笔记和任务，并在结束后清理测试数据。

运行端到端测试：

```bash
npm run test:e2e
```

端到端测试会启动本地 Next.js 开发服务器，使用本机 Edge 浏览器执行主流程，并在结束后清理测试数据。Playwright 专用浏览器下载失败时，本项目默认复用系统 Edge，避免受浏览器二进制下载网络影响。

## 项目结构

```text
src/
  app/
    page.tsx
    notes/page.tsx
    notes/[id]/page.tsx
    notes/[id]/edit/page.tsx
    notes/new/page.tsx
    tasks/page.tsx
    tasks/[id]/page.tsx
    tasks/[id]/edit/page.tsx
    tasks/new/page.tsx
    tags/page.tsx
    tags/[id]/edit/page.tsx
    tags/new/page.tsx
    projects/page.tsx
    projects/[id]/page.tsx
    projects/[id]/edit/page.tsx
    projects/new/page.tsx
    ai/page.tsx
    settings/ai/page.tsx
    api/ai/summarize-note/route.ts
    api/ai/extract-actions/route.ts
    api/ai/actions-to-tasks/route.ts
    api/notes/route.ts
    api/notes/[id]/route.ts
    api/tasks/route.ts
    api/tasks/[id]/route.ts
    api/projects/route.ts
    api/projects/[id]/route.ts
    api/tags/route.ts
    api/tags/[id]/route.ts
    layout.tsx
    globals.css
  components/
    layout/
    notes/
    tags/
    tasks/
    ui/
  lib/
    ai/
    api/
    prisma.ts
    search-params.ts
scripts/
  run-e2e.mjs
prisma/
  schema.prisma
  seed.sql
  migrations/
tests/
  api/
  e2e/
```

## 学习文档

如果你是初学者，建议从这里开始系统学习本项目：

- [学习文档索引](./docs/learning/README.md)
- [项目总览与学习路线](./docs/learning/01-project-overview.md)
- [环境、命令与项目启动](./docs/learning/02-environment-and-commands.md)
- [TypeScript、React 与 Next.js 前端](./docs/learning/03-frontend-next-react-typescript.md)
- [Next.js API 与服务层设计](./docs/learning/04-api-and-service-layer.md)
- [PostgreSQL、Prisma 与数据建模](./docs/learning/05-database-prisma-postgresql.md)
- [AI Provider、配置与模型调用](./docs/learning/06-ai-provider.md)
- [测试体系：Vitest、Playwright 与回归测试](./docs/learning/07-testing.md)
- [Git、GitHub 与工程化管理](./docs/learning/08-git-github-ci.md)

## 下一阶段

下一阶段建议继续做“任务管理效率和真实使用体验打磨”：

- 用你自己的 OpenAI、Google Gemini、DeepSeek 或本地模型配置各做一次手工验收
- 补充删除、项目归档、批量重开等更多 Playwright 回归用例
- 给项目看板增加拖拽移动或持久化排序
- 增加任务提醒、日历视图和按周计划视图
- 继续保持数据库表名、列名使用下划线命名

## 前端体验优化状态

2026-06-01 已根据设计审查报告完成一轮 UI/UX 优化。UI/UX 是 User Interface / User Experience 的缩写，分别指用户界面和用户体验；本轮重点是让移动端更可用、让工具型页面更清晰，并降低视觉噪音。

已完成：

- 移动端导航支持横向滚动、当前页高亮和更稳定的触控目标。
- 核心页面在 390px 移动端视口下已验证无横向溢出，覆盖工作台、笔记、任务、项目、AI 助手和 AI 配置页。
- 页头已压缩，主操作已移入页头，用户界面不再展示 `SKELETON READY` 和 `DB: OFFLINE` 这类开发状态。
- 任务和笔记筛选在移动端改为折叠摘要，避免首屏被筛选项占满。
- 卡片、面板、搜索框和统计卡已做视觉减重，新增更细的阴影层级和语义颜色。
- AI 配置页改为配置优先，支持预设快速选择、字段级校验、API Key 显示/隐藏、保存反馈和测试连接反馈。
- 新增 `src/app/icon.svg`，修复首页静态资源 404。

已验证：

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- Playwright 390px 移动端横向溢出检查

待实施：

- 补充 375px、414px、横屏和平板断点截图回归。
- 为当前页高亮、筛选折叠、字段级错误和 AI 测试反馈补端到端断言。
- 将项目详情页、编辑页、表单页纳入同等深度的移动端视觉检查。
- 筛选组件后续可升级为带“已选数量”和“清除全部”的抽屉式筛选。
- 暗色模式暂不建议立即实施，需等当前浅色设计令牌进一步稳定。

完整设计审查和前端优化建议见：

- [.gstack/design-reports/design-audit-local-20260601/design-audit-local.md](./.gstack/design-reports/design-audit-local-20260601/design-audit-local.md)
- [.gstack/design-reports/design-audit-local-20260601/frontend-optimization-suggestions.md](./.gstack/design-reports/design-audit-local-20260601/frontend-optimization-suggestions.md)
