# 02. 环境、命令与项目启动

## 1. 运行环境

本项目需要：

- Node.js 20 或更高版本
- npm
- PostgreSQL 15 或更高版本

Node.js 是 JavaScript 的服务端运行环境。npm (Node Package Manager) 是 Node.js 的包管理器，负责安装依赖和运行脚本。

Python 类比：

| JavaScript 世界 | Python 世界 |
| --- | --- |
| Node.js | Python 解释器 |
| npm | pip / uv / poetry |
| package.json | pyproject.toml / requirements.txt |
| node_modules | .venv/site-packages |

## 2. package.json 是什么

位置：[package.json](../../package.json)

核心片段：

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "node scripts/run-e2e.mjs",
  "db:generate": "prisma generate",
  "db:deploy": "prisma migrate deploy"
}
```

这些脚本就是项目命令。运行方式：

```powershell
npm.cmd run dev
```

为什么 Windows 用 `npm.cmd`：PowerShell 可能因为执行策略阻止 `npm.ps1`，`npm.cmd` 可以避开这个问题。

## 3. 常用命令

安装依赖：

```powershell
npm.cmd install
```

启动开发服务器：

```powershell
npm.cmd run dev
```

类型检查：

```powershell
npm.cmd run typecheck
```

TypeScript 类型检查类似 Python 里的 `mypy`，它不运行代码，只检查类型是否合理。

运行静态检查：

```powershell
npm.cmd run lint
```

ESLint 是 JavaScript/TypeScript 的静态检查工具，类似 Python 的 ruff 或 flake8。

运行单元测试：

```powershell
npm.cmd run test
```

运行端到端测试：

```powershell
npm.cmd run test:e2e
```

生产构建：

```powershell
npm.cmd run build
```

## 4. 环境变量

示例文件：[.env.example](../../.env.example)

本地真实文件 `.env` 被 `.gitignore` 忽略，不能提交。原因是里面可能有数据库密码和 API Key。

核心变量：

```text
DATABASE_URL="postgresql://fxyan:qwe123@localhost:5432/knowledge?schema=public"
AI_PROVIDER="mock"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.2"
```

Python 类比：相当于在 FastAPI 项目里用 `.env` 存 `DATABASE_URL`，再用 pydantic-settings 或 os.environ 读取。

## 5. 数据库命令

生成 Prisma Client：

```powershell
npm.cmd run db:generate
```

Prisma Client 是 Prisma 根据 schema 自动生成的数据库访问代码，类似 SQLAlchemy 根据模型提供 ORM 查询能力。

应用迁移：

```powershell
npm.cmd run db:deploy
```

写入示例数据：

```powershell
npm.cmd run db:seed
```

## 6. 开发时的推荐检查顺序

每次改完代码后，建议这样跑：

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

如果改了浏览器交互，再跑：

```powershell
npm.cmd run test:e2e
```

## 练习

运行 `npm.cmd run typecheck`，观察它只输出成功或错误，不会启动服务。再打开 [tsconfig.json](../../tsconfig.json)，看看 TypeScript 如何配置。
