import { notFound } from "next/navigation";
import { NoteForm } from "@/components/notes/note-form";
import { PageHeader } from "@/components/ui/page-header";
import { getNote, listTags } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type EditNotePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditNotePage({ params }: EditNotePageProps) {
  const { id } = await params;
  const [note, tags] = await Promise.all([
    getNote(id).catch(() => null),
    listTags(),
  ]);

  if (!note) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Edit Note"
        title="编辑笔记"
        description="保存会调用 /api/notes/:id，并整体替换当前笔记的标签关联。"
      />

      <NoteForm
        mode="edit"
        initialNote={note}
        tags={tags.map(({ id: tagId, name, color }) => ({ id: tagId, name, color }))}
      />
    </main>
  );
}
