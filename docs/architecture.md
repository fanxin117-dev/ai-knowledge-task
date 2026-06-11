# 项目架构说明

本文档记录当前项目的主要分层和维护边界，方便后续继续扩展功能时保持结构一致。

## 技术栈

- Next.js（React 全栈框架）：负责页面路由、服务端渲染和后端 Route Handler。
- React（用户界面库）：负责把组件状态渲染为页面。
- TypeScript（带类型系统的 JavaScript）：在开发阶段提前发现字段、函数参数和返回值不匹配的问题。
- Prisma（数据库 ORM）：把 PostgreSQL 数据表映射成类型安全的数据库访问代码。
- PostgreSQL（关系型数据库）：保存笔记、任务、项目、标签和 AI 结果。
- Vitest（单元测试框架）：快速验证服务层和 AI provider 的核心行为。
- Playwright（端到端测试框架）：用真实浏览器执行用户流程，验证页面和 API 是否能串起来工作。

## 运行时分层

一次典型请求会经过以下路径：

```text
页面组件
  -> Route Handler
  -> 请求读取与输入校验
  -> 领域服务
  -> Prisma Client
  -> PostgreSQL
```

分层职责：

- `src/app/**/page.tsx`：页面入口，只负责组织数据读取和界面展示。
- `src/app/api/**/route.ts`：HTTP 接口入口，只负责读取请求、调用校验和返回统一 JSON。
- `src/lib/api/validation.ts`：把未知请求体转换成明确的输入结构，并在字段非法时抛出统一错误。
- `src/lib/api/service/`：按领域存放业务规则和数据库操作。
- `src/lib/api/services.ts`：兼容旧导入路径的门面导出文件，不承载具体业务逻辑。
- `src/lib/prisma.ts`：集中初始化 Prisma Client，避免开发热更新时重复创建连接池。

## 服务层模块

服务层已经从单个大文件拆成按领域维护的模块：

```text
src/lib/api/service/
  notes.ts       笔记 CRUD、AI 摘要保存、行动项保存
  tasks.ts       任务 CRUD、状态切换、截止日期筛选、行动项转任务
  projects.ts    项目 CRUD、归档、默认项目保护
  tags.ts        标签 CRUD、使用中标签删除保护
  search.ts      跨笔记、任务、项目、标签的统一搜索
  shared.ts      序列化、通用校验、默认项目和共享 include 配置
```

新增业务时优先放入对应领域文件。只有被多个领域同时使用的稳定逻辑，才放入 `shared.ts`。

## 数据边界

数据库返回的 `Date`、关联表和枚举不直接暴露给前端。服务层统一通过序列化（Serialization）函数转换成 JSON 友好的结构，例如把 `Date` 转为 ISO 字符串，并把 `noteTags`、`taskTags` 展平为 `tags`。

这样做有两个好处：

- 前端不用理解数据库关联表结构。
- API 返回结构更稳定，数据库内部调整时更容易控制影响范围。

## 质量检查

常用质量命令：

```bash
npm run lint
npm run typecheck
npm run test
npm run quality
```

在 Windows PowerShell 如果遇到 `npm.ps1` 执行策略限制，使用：

```powershell
npm.cmd run quality
```

`quality` 会依次执行 lint、类型检查和单元测试，适合提交前快速确认代码质量。端到端测试仍使用单独命令：

```bash
npm run test:e2e
```

## 维护原则

- API Route Handler 保持薄层，不直接写复杂业务规则。
- 服务层函数返回已经序列化的对象，除 `get*ByIdOrThrow` 这类内部 helper 外，不把 Prisma 原始对象暴露到页面。
- 共享 helper 要克制新增，只有跨两个以上领域复用且含义稳定时再抽到 `shared.ts`。
- 删除代码前先跑 `rg` 确认没有调用方，再跑 `npm.cmd run quality` 验证。
