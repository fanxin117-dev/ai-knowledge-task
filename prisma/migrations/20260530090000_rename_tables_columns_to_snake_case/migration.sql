ALTER TYPE "TaskStatus" RENAME TO "task_status";
ALTER TYPE "AiResultType" RENAME TO "ai_result_type";

ALTER TABLE "Note" RENAME TO "notes";
ALTER TABLE "Task" RENAME TO "tasks";
ALTER TABLE "Tag" RENAME TO "tags";
ALTER TABLE "NoteTag" RENAME TO "note_tags";
ALTER TABLE "TaskTag" RENAME TO "task_tags";
ALTER TABLE "AiResult" RENAME TO "ai_results";

ALTER TABLE "notes" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "notes" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "tasks" RENAME COLUMN "sourceNoteId" TO "source_note_id";
ALTER TABLE "tasks" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "tasks" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "tags" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "note_tags" RENAME COLUMN "noteId" TO "note_id";
ALTER TABLE "note_tags" RENAME COLUMN "tagId" TO "tag_id";
ALTER TABLE "note_tags" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "task_tags" RENAME COLUMN "taskId" TO "task_id";
ALTER TABLE "task_tags" RENAME COLUMN "tagId" TO "tag_id";
ALTER TABLE "task_tags" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "ai_results" RENAME COLUMN "noteId" TO "note_id";
ALTER TABLE "ai_results" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "notes" RENAME CONSTRAINT "Note_pkey" TO "notes_pkey";
ALTER TABLE "tasks" RENAME CONSTRAINT "Task_pkey" TO "tasks_pkey";
ALTER TABLE "tags" RENAME CONSTRAINT "Tag_pkey" TO "tags_pkey";
ALTER TABLE "note_tags" RENAME CONSTRAINT "NoteTag_pkey" TO "note_tags_pkey";
ALTER TABLE "task_tags" RENAME CONSTRAINT "TaskTag_pkey" TO "task_tags_pkey";
ALTER TABLE "ai_results" RENAME CONSTRAINT "AiResult_pkey" TO "ai_results_pkey";

ALTER TABLE "tasks" RENAME CONSTRAINT "Task_sourceNoteId_fkey" TO "tasks_source_note_id_fkey";
ALTER TABLE "note_tags" RENAME CONSTRAINT "NoteTag_noteId_fkey" TO "note_tags_note_id_fkey";
ALTER TABLE "note_tags" RENAME CONSTRAINT "NoteTag_tagId_fkey" TO "note_tags_tag_id_fkey";
ALTER TABLE "task_tags" RENAME CONSTRAINT "TaskTag_taskId_fkey" TO "task_tags_task_id_fkey";
ALTER TABLE "task_tags" RENAME CONSTRAINT "TaskTag_tagId_fkey" TO "task_tags_tag_id_fkey";
ALTER TABLE "ai_results" RENAME CONSTRAINT "AiResult_noteId_fkey" TO "ai_results_note_id_fkey";

ALTER INDEX "Note_createdAt_idx" RENAME TO "notes_created_at_idx";
ALTER INDEX "Note_updatedAt_idx" RENAME TO "notes_updated_at_idx";
ALTER INDEX "Task_status_idx" RENAME TO "tasks_status_idx";
ALTER INDEX "Task_sourceNoteId_idx" RENAME TO "tasks_source_note_id_idx";
ALTER INDEX "Task_createdAt_idx" RENAME TO "tasks_created_at_idx";
ALTER INDEX "Tag_name_key" RENAME TO "tags_name_key";
ALTER INDEX "Tag_createdAt_idx" RENAME TO "tags_created_at_idx";
ALTER INDEX "NoteTag_tagId_idx" RENAME TO "note_tags_tag_id_idx";
ALTER INDEX "TaskTag_tagId_idx" RENAME TO "task_tags_tag_id_idx";
ALTER INDEX "AiResult_noteId_idx" RENAME TO "ai_results_note_id_idx";
ALTER INDEX "AiResult_type_idx" RENAME TO "ai_results_type_idx";
ALTER INDEX "AiResult_createdAt_idx" RENAME TO "ai_results_created_at_idx";
