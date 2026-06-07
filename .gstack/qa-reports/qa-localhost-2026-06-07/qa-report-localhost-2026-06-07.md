# QA Report: localhost

- 测试日期：2026-06-07
- 测试目标：http://localhost:3000/
- 测试方式：自动化单元/类型/端到端测试 + Playwright 浏览器巡检 + 移动端专项交互验证
- 浏览器视口：Desktop 1440x900，Mobile 390x844
- 报告产物：
  - `route-audit.json`：11 个核心路由的状态码、控制台错误、横向溢出、触控目标和输入标注扫描
  - `interaction-audit.json`：表单负向路径、AI 配置、移动导航、任务筛选、标签编辑触控专项验证
  - `screenshots/`：30 张页面和交互截图

## 结论

当前项目没有发现 P0/P1 级阻塞问题。核心页面可访问，主要 CRUD 流程、AI 配置页、移动端任务筛选和导航均可用；类型检查、Lint、单元测试和端到端测试全部通过。

需要优先改进的是移动端触控目标、表单即时校验和移动导航发现性。这些问题不影响基础功能，但会影响手机端可用性、可访问性和长期维护一致性。

## 实施更新

- 2026-06-07：已实施报告中的前端 P2/P3 优化项，包括标签编辑入口按钮化、表单控件触控尺寸统一、四类新建表单客户端必填校验、移动端导航滚动提示增强、任务新建页响应式网格优化。
- 2026-06-07：已新增端到端回归测试 `tests/e2e/frontend-qa-regression.spec.ts`，覆盖空表单本地校验、防止 API 400、标签编辑入口触控尺寸。
- 仍需跟踪：`pg@9` 弃用提示属于数据访问层技术债，本轮未修改数据库查询逻辑。

## 已执行验证

| 类别 | 命令/范围 | 结果 |
| --- | --- | --- |
| 类型检查 | `npm.cmd run typecheck` | 通过 |
| 静态检查 | `npm.cmd run lint` | 通过 |
| 单元/接口测试 | `npm.cmd run test` | 通过，3 个测试文件、11 个测试 |
| 端到端测试 | `npm.cmd run test:e2e` | 通过，3 个测试；主流程、空表单本地校验、标签编辑触控尺寸均可用 |
| 页面巡检 | `/`, `/notes`, `/tasks`, `/projects`, `/tags`, `/ai`, `/settings/ai`, `*/new` | 22 个桌面/移动页面均 200，无页面级横向滚动，无真实控制台异常 |
| 负向表单 | `/notes/new`, `/tasks/new`, `/projects/new`, `/tags/new` 空提交 | 均停留表单页并显示字段错误 |
| AI 配置 | 无效 Base URL + 空 Model | 保存/测试按钮禁用，字段错误可见 |
| 移动筛选 | `/tasks` 5 组折叠筛选 | 可展开、可点击、URL 正常更新 |
| 移动导航 | 顶部导航全部链接 | 均可达 |

说明：负向表单测试会触发 API 400，这是接口校验的预期结果；浏览器网络面板会记录 400，但不是运行时崩溃。

## 确认问题

### P2: 标签页编辑入口触控目标过小

- 位置：`src/app/tags/page.tsx`
- 复现：移动端打开 `/tags`，每个标签卡片右侧的“编辑”链接只有约 28x20 px。
- 证据：`screenshots/tags-mobile-edit-targets.png`，`interaction-audit.json > tags edit touch targets`
- 影响：低于常见 44x44 px 移动触控目标，手指点击容错低，也不利于可访问性。
- 建议：把编辑链接改为按钮式链接，例如 `inline-flex min-h-11 items-center rounded-md border-2 px-3 py-2`；同时补充 hover/focus-visible 状态，与任务/笔记卡片详情入口保持一致。
- 状态：已实施并通过端到端回归。

### P2: 新建表单控件高度不一致，移动端触控面积偏小

- 位置：
  - `src/components/notes/note-form.tsx`
  - `src/components/tasks/task-form.tsx`
  - `src/components/projects/project-form.tsx`
  - `src/components/tags/tag-form.tsx`
- 复现：打开 `/notes/new`, `/tasks/new`, `/projects/new`, `/tags/new`，输入框、选择框、提交按钮多数为 40 px 高；AI 配置页已经统一到 `min-h-11`。
- 证据：`route-audit.json` 中多个 `smallTargets` 记录。
- 影响：同一产品内表单体验不一致；移动端可点区域偏小。
- 建议：抽取或统一表单控件类名，把输入框、选择框、主要按钮统一为 `min-h-11`，并保持 `text-base md:text-sm`，避免移动端输入时缩放和误触。
- 状态：已实施并通过端到端回归。

### P2: 表单主要依赖服务端校验，空提交会产生 400 网络噪音

- 位置：
  - `src/components/notes/note-form.tsx`
  - `src/components/tasks/task-form.tsx`
  - `src/components/projects/project-form.tsx`
  - `src/components/tags/tag-form.tsx`
- 复现：四个新建页空提交时，页面能显示错误，但请求仍会发到 API 并返回 400。
- 证据：`interaction-audit.json > empty submit */new`，控制台记录 `Failed to load resource: the server responded with a status of 400`。
- 影响：用户反馈速度依赖网络；调试时 console 会被预期失败请求污染；后续接入监控时可能误判为前端错误率。
- 建议：保留服务端校验作为最终防线，同时在客户端提交前做最小必填校验；失败时不发请求，直接设置字段错误。
- 状态：已实施并通过端到端回归。

### P3: 移动端顶部导航可发现性不足

- 位置：`src/components/layout/sidebar-nav.tsx`
- 复现：移动端顶部导航横向滚动，右侧 “AI” 入口只露出一部分；虽然有渐隐层，但没有明确滚动提示或更多菜单。
- 证据：`screenshots/tags-mobile-edit-targets.png`, `screenshots/ai-settings-invalid-mobile.png`
- 影响：AI 助手、AI 配置入口在小屏上发现成本偏高。
- 建议：短期可以增强右侧渐隐宽度并增加末端 padding；中期建议改成两行 wrap、分段菜单或 “更多” 菜单，避免关键入口完全依赖横向滑动。
- 状态：已实施短期优化，长期仍可评估两行 wrap 或 “更多” 菜单。

### P3: 任务新建页桌面端五列网格局部拥挤

- 位置：`src/components/tasks/task-form.tsx`
- 复现：桌面端 `/tasks/new` 的 `md:grid-cols-5` 中，Source Note 下拉框内容较长，局部 `scrollWidth` 大于容器宽度。
- 证据：`route-audit.json > /tasks/new desktop > overflowing`
- 影响：当前没有造成页面级横向滚动，但长项目名/长笔记标题会让布局更容易拥挤。
- 建议：改为 `md:grid-cols-2 xl:grid-cols-5` 或让 `SOURCE NOTE` 跨两列；下拉内容可配合 `min-w-0` 和更宽列宽。
- 状态：已实施并通过端到端回归。

## 误报/无需修复

- `line-clamp-3` 段落的 `scrollWidth > clientWidth` 是截断布局的正常表现，没有页面横向滚动，不作为问题。
- 标签/任务表单里 1x1 的 checkbox 来自 `sr-only` 隐藏控件，真实可点击区域是外层标签胶囊，不作为输入未标注问题。
- AI 配置页的 API Key 显示/隐藏按钮单独复核可从 `password` 切换到 `text`，功能正常。

## 建议实施顺序

1. 已修 P2 触控目标：标签编辑链接 + 四类表单控件统一 `min-h-11`。
2. 已补客户端必填校验，减少空提交 400。
3. 已做移动导航短期优化，让右侧还有更多入口的提示更明显。
4. 已调整任务新建页桌面网格，降低长标题内容导致的拥挤风险。

## 后续回归重点

- 回归 `/tags` 移动端编辑链接，确认每个编辑入口至少 44x44 px。
- 回归四个新建表单空提交，确认不发 API 请求也能显示字段错误。
- 回归 `/settings/ai` 无效配置、Mock 预设、OpenAI-compatible 预设、API Key 显隐。
- 回归 `/tasks` 移动端 PROJECT/STATUS/PRIORITY/DUE/TAG 筛选。
- 继续保留 `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run test:e2e` 作为提交前检查。

## 观察到的技术债

- `npm.cmd run test` 和 `npm.cmd run test:e2e` 均出现 `pg@9` 兼容性弃用提示：`Calling client.query() when the client is already executing a query is deprecated`。当前不影响测试通过，但建议后续检查数据库连接/查询并发用法，避免升级 PostgreSQL 客户端后变成失败。
