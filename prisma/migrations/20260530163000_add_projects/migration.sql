CREATE TABLE "projects" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "projects_name_key" ON "projects"("name");
CREATE INDEX "projects_updated_at_idx" ON "projects"("updated_at");

INSERT INTO "projects" ("id", "name", "description")
VALUES ('project-inbox', '收件箱', '未归属到具体项目的默认任务集合。')
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "tasks" ADD COLUMN "project_id" TEXT;
UPDATE "tasks" SET "project_id" = 'project-inbox' WHERE "project_id" IS NULL;
ALTER TABLE "tasks" ALTER COLUMN "project_id" SET NOT NULL;

DELETE FROM "tasks" duplicate_task
USING "tasks" kept_task
WHERE duplicate_task."project_id" = kept_task."project_id"
  AND duplicate_task."title" = kept_task."title"
  AND duplicate_task."id" > kept_task."id";

CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");
CREATE UNIQUE INDEX "tasks_project_id_title_key" ON "tasks"("project_id", "title");

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
