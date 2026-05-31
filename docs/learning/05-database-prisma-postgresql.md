# 05. PostgreSQL、Prisma 与数据建模

## 1. PostgreSQL 是什么

PostgreSQL 是关系型数据库。关系型数据库用表、行、列、主键、外键表达数据关系。

官方文档：https://www.postgresql.org/docs/

本项目使用 PostgreSQL 存：

- 笔记 `notes`
- 任务 `tasks`
- 标签 `tags`
- 项目 `projects`
- AI 结果 `ai_results`
- 多对多关联表 `note_tags`、`task_tags`

## 2. Prisma 是什么

Prisma 是 ORM (Object-Relational Mapping，对象关系映射) 工具。它让你用 TypeScript 操作数据库，而不是到处手写 SQL。

官方文档：https://www.prisma.io/docs

Python 类比：

| Prisma | Python |
| --- | --- |
| Prisma schema | SQLAlchemy model |
| Prisma Client | SQLAlchemy Session |
| Prisma migration | Alembic migration |

## 3. Prisma schema

位置：[prisma/schema.prisma](../../prisma/schema.prisma)

示例：

```prisma
model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      TaskStatus   @default(OPEN)
  priority    TaskPriority @default(MEDIUM)
  dueAt       DateTime?    @map("due_at")
  projectId   String       @map("project_id")

  project     Project      @relation(fields: [projectId], references: [id], onDelete: Restrict)

  @@map("tasks")
}
```

解释：

- `String` 对应文本。
- `String?` 表示可以为空。
- `DateTime?` 表示可空时间。
- `@id` 表示主键。
- `@default(cuid())` 表示默认生成 ID。
- `@map("due_at")` 表示代码字段叫 `dueAt`，数据库列名叫 `due_at`。
- `@@map("tasks")` 表示数据库表名叫 `tasks`。

为什么代码用驼峰、数据库用下划线：

- TypeScript 里 `dueAt` 更符合 JS 习惯。
- 数据库里 `due_at` 更符合 SQL 习惯。
- Prisma 的 `@map` 同时满足两边。

## 4. 枚举

```prisma
enum TaskPriority {
  LOW
  MEDIUM
  HIGH

  @@map("task_priority")
}
```

枚举 (Enum) 用来限制字段只能取固定值。优先级不能随便写成 `urgent`、`High`、`高`，这样筛选和排序更稳定。

Python 类比：

```python
from enum import Enum

class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
```

## 5. 多对多关系

一篇笔记可以有多个标签，一个标签也可以属于多篇笔记，所以需要中间表。

```prisma
model NoteTag {
  noteId String @map("note_id")
  tagId  String @map("tag_id")

  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([noteId, tagId])
  @@map("note_tags")
}
```

Python/SQL 类比：

```sql
create table note_tags (
  note_id text references notes(id),
  tag_id text references tags(id),
  primary key (note_id, tag_id)
);
```

## 6. 迁移文件

迁移 (Migration) 是数据库结构变更记录。

本项目迁移：

```text
prisma/migrations/
  20260529150000_init_knowledge_schema/
  20260530090000_rename_tables_columns_to_snake_case/
  20260530163000_add_projects/
  20260531100000_add_project_archive/
  20260531110000_add_task_priority_due_date/
```

每个目录里的 `migration.sql` 是实际执行的 SQL。

应用迁移：

```powershell
npm.cmd run db:deploy
```

生成 Prisma Client：

```powershell
npm.cmd run db:generate
```

## 7. 查询示例

位置：[src/lib/api/services.ts](../../src/lib/api/services.ts)

```ts
const tasks = await prisma.task.findMany({
  where: {
    AND: [
      input.status ? { status: input.status } : {},
      input.priority ? { priority: input.priority } : {},
      input.overdue
        ? {
            status: TaskStatus.OPEN,
            dueAt: { lt: new Date() },
          }
        : {},
    ],
  },
  include: taskInclude,
  orderBy: { updatedAt: "desc" },
});
```

含义：

- `findMany` 查询多条。
- `where` 是筛选条件。
- `AND` 表示条件同时满足。
- `include` 表示把关联数据也查出来。
- `orderBy` 表示排序。

Python SQLAlchemy 类比：

```python
query = session.query(Task)
if status:
    query = query.filter(Task.status == status)
if overdue:
    query = query.filter(Task.status == "OPEN", Task.due_at < datetime.utcnow())
tasks = query.order_by(Task.updated_at.desc()).all()
```

## 8. 本项目重要数据规则

- 任务必须属于项目。
- 默认项目是 `project-inbox`，名称是“收件箱”。
- 已归档项目不能继续写入任务。
- 同一项目下任务标题唯一，避免 AI 重复生成大量任务。
- 删除项目前必须先清空任务。
- AI 结果单独存在 `ai_results`，方便保留历史。

## 练习

打开 [prisma/migrations/20260531110000_add_task_priority_due_date/migration.sql](../../prisma/migrations/20260531110000_add_task_priority_due_date/migration.sql)，对照 [prisma/schema.prisma](../../prisma/schema.prisma)，找出 `priority` 和 `due_at` 是如何从模型变成数据库列的。
