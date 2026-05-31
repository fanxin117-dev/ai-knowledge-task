# 08. Git、GitHub 与工程化管理

## 1. 当前 Git 状态

本项目已经初始化 Git，并推送到：

```text
git@github.com:fanxin117-dev/ai-knowledge-task.git
```

Git 是版本控制系统。GitHub 是托管 Git 仓库的平台。

## 2. 常用 Git 命令

查看状态：

```powershell
git status --short --branch
```

查看最近提交：

```powershell
git log --oneline --decorate -5
```

添加文件：

```powershell
git add .
```

提交：

```powershell
git commit -m "feat: add task reminder"
```

推送：

```powershell
git push
```

Python 项目也一样使用这些 Git 命令。

## 3. 提交信息规范

推荐使用 Conventional Commits：

| 类型 | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 修 bug |
| `docs` | 文档 |
| `test` | 测试 |
| `refactor` | 重构 |
| `chore` | 工程杂项 |

例子：

```text
feat: add task due date filter
fix: preserve selected project on task search
docs: add learning guide for prisma
test: cover project archive flow
```

## 4. .gitignore

位置：[.gitignore](../../.gitignore)

重要规则：

```text
.env
.next/
node_modules/
src/generated/prisma/
test-results/
*.tsbuildinfo
```

这些不提交：

- `.env`: 可能有密码和 API Key。
- `node_modules`: 依赖可以用 `npm install` 还原。
- `.next`: 构建产物。
- `src/generated/prisma`: 可由 `npm run db:generate` 生成。
- `test-results`: 测试产物。

## 5. GitHub Actions CI

CI (Continuous Integration，持续集成) 是推送代码后自动运行检查。

位置：[.github/workflows/ci.yml](../../.github/workflows/ci.yml)

核心流程：

```yaml
- name: Install dependencies
  run: npm ci

- name: Apply database migrations
  run: npm run db:deploy

- name: Generate Prisma client
  run: npm run db:generate

- name: Type check
  run: npm run typecheck

- name: Lint
  run: npm run lint

- name: Unit tests
  run: npm run test

- name: Build
  run: npm run build
```

官方文档：https://docs.github.com/actions

## 6. 为什么 CI 里启动 PostgreSQL

本项目 API 测试依赖数据库，所以 CI 需要一个临时 PostgreSQL 服务。

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_DB: knowledge
      POSTGRES_USER: fxyan
      POSTGRES_PASSWORD: qwe123
```

Python 类比：GitHub Actions 里给 pytest 启一个 PostgreSQL service container。

## 7. npm ci 和 npm install 区别

- `npm install`: 开发时安装依赖，可能更新 lock file。
- `npm ci`: CI 环境使用，根据 `package-lock.json` 精确安装。

CI 里用 `npm ci`，保证每次依赖一致。

## 8. 标准开发流程

推荐以后这样做：

```text
1. git status
2. 修改代码
3. npm.cmd run typecheck
4. npm.cmd run lint
5. npm.cmd run test
6. 必要时 npm.cmd run test:e2e
7. git add .
8. git commit -m "feat: ..."
9. git push
```

## 9. 小白最容易犯的 Git 错误

- 把 `.env` 提交上去：会泄露密钥。
- 没跑测试就提交：后面回滚成本高。
- 一个提交塞太多无关修改：以后不好定位问题。
- 忘记 pull/push：本地和 GitHub 不一致。

## 练习

运行：

```powershell
git status --short --branch
git log --oneline --decorate -3
```

确认当前分支和最新提交是否符合预期。
