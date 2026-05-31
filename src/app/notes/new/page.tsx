import { NoteForm } from "@/components/notes/note-form";
import { PageHeader } from "@/components/ui/page-header";
import { listTags } from "@/lib/api/services";

export const dynamic = "force-dynamic";

export default async function NewNotePage() {
  const tags = (await listTags()).map(({ id, name, color }) => ({ id, name, color }));

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="New Note"
        title="新建笔记"
        description="创建笔记会调用 /api/notes，并把标题、正文和标签关联保存到 PostgreSQL。"
      />

      <NoteForm mode="create" tags={tags} />
    </main>
  );
}
