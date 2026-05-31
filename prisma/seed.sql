INSERT INTO "tags" ("id", "name", "color")
VALUES
  ('ai', 'AI', '#d7ff37'),
  ('product', '产品', '#ff6b35'),
  ('engineering', '工程', '#2457d6'),
  ('research', '研究', '#b66a2c'),
  ('writing', '写作', '#16130d')
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "color" = EXCLUDED."color";

INSERT INTO "notes" ("id", "title", "content", "created_at", "updated_at")
VALUES
  (
    'note-vibe-coding-flow',
    'vibe coding 学习节奏',
    '先让 AI 拆解需求，再让它生成最小代码。每一步都要运行、观察错误、补测试、再重构。重点不是一次生成完整项目，而是练习人和 AI 的反馈循环。',
    NOW(),
    NOW()
  ),
  (
    'note-knowledge-schema',
    '知识任务系统数据模型',
    '核心实体包括 Note、Task、Tag 和 AiResult。Note 和 Task 分开建模，Tag 通过关联表复用，AiResult 保存摘要和行动项提取结果。',
    NOW(),
    NOW()
  ),
  (
    'note-product-scope',
    'MVP 范围控制',
    '第一阶段只做骨架，第二阶段只做 mock 数据，第三阶段再接数据库和 API。不要提前加入登录、文件上传、向量数据库或复杂提醒。',
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "content" = EXCLUDED."content",
  "updated_at" = NOW();

INSERT INTO "tasks" ("id", "title", "description", "status", "source_note_id", "created_at", "updated_at")
VALUES
  (
    'task-create-api-list',
    '完成笔记和任务 API 列表',
    '用 PostgreSQL 数据验证列表、搜索和筛选体验，替换前端 mock 数据。',
    'DONE',
    'note-product-scope',
    NOW(),
    NOW()
  ),
  (
    'task-design-ai-service',
    '设计 AI mock service 接口',
    '先定义摘要和行动项提取的服务边界，后续再替换真实 OpenAI API。',
    'OPEN',
    'note-vibe-coding-flow',
    NOW(),
    NOW()
  ),
  (
    'task-write-api-tests',
    '补充核心 API 测试',
    '覆盖 CRUD、输入校验、404 和标签筛选等关键路径。',
    'OPEN',
    'note-knowledge-schema',
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "status" = EXCLUDED."status",
  "source_note_id" = EXCLUDED."source_note_id",
  "updated_at" = NOW();

DELETE FROM "note_tags"
WHERE "note_id" IN ('note-vibe-coding-flow', 'note-knowledge-schema', 'note-product-scope');

INSERT INTO "note_tags" ("note_id", "tag_id")
VALUES
  ('note-vibe-coding-flow', 'ai'),
  ('note-vibe-coding-flow', 'engineering'),
  ('note-knowledge-schema', 'engineering'),
  ('note-knowledge-schema', 'research'),
  ('note-product-scope', 'product'),
  ('note-product-scope', 'writing')
ON CONFLICT ("note_id", "tag_id") DO NOTHING;

DELETE FROM "task_tags"
WHERE "task_id" IN ('task-create-api-list', 'task-design-ai-service', 'task-write-api-tests');

INSERT INTO "task_tags" ("task_id", "tag_id")
VALUES
  ('task-create-api-list', 'engineering'),
  ('task-design-ai-service', 'ai'),
  ('task-design-ai-service', 'engineering'),
  ('task-write-api-tests', 'writing'),
  ('task-write-api-tests', 'research')
ON CONFLICT ("task_id", "tag_id") DO NOTHING;
