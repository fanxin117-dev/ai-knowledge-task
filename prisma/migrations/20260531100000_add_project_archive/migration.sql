-- 项目归档只需要记录归档时间，不需要把任务迁走。
-- 这样可以保留项目历史上下文，同时让默认项目列表过滤掉已结束项目。
ALTER TABLE "projects" ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE INDEX "projects_archived_at_idx" ON "projects"("archived_at");
