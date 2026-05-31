-- 任务优先级使用枚举，避免自由文本带来的排序和筛选歧义。
CREATE TYPE "task_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- due_at 使用时间戳字段；表单先按日期填写，后续可扩展到精确时间提醒。
ALTER TABLE "tasks"
ADD COLUMN "priority" "task_priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "due_at" TIMESTAMP(3);

CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");
CREATE INDEX "tasks_due_at_idx" ON "tasks"("due_at");
