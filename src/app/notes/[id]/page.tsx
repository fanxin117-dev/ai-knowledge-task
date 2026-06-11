import Link from "next/link";
import { notFound } from "next/navigation";
import { AiNotePanel } from "@/components/notes/ai-note-panel";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { DeleteButton } from "@/components/ui/delete-button";
import { PageHeader } from "@/components/ui/page-header";
import { TagPill } from "@/components/ui/tag-pill";
import { getNote, listProjects } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type NoteDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = await params;
  const [note, projects] = await Promise.all([getNote(id).catch(() => null), listProjects()]);

  if (!note) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="笔记详情"
        title={note.title}
        description="这是来自 PostgreSQL 的笔记详情页，用于验证信息层级和后续 AI 摘要入口位置。"
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/notes/${note.id}/edit`}
          className="rounded-md border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm"
        >
          编辑笔记
        </Link>
        <DeleteButton endpoint={`/api/notes/${note.id}`} redirectTo="/notes" label={note.title} />
      </div>

      <article className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 pb-4">
          <p className="font-[var(--font-mono)] text-xs font-bold text-slate-500">
            更新于 / {note.updatedAt.slice(0, 10)}
          </p>
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <TagPill key={tag.id} tag={tag} />
            ))}
          </div>
        </div>

        <MarkdownContent content={note.content} />
      </article>

      <AiNotePanel
        noteId={note.id}
        noteTitle={note.title}
        aiResults={note.aiResults}
        projects={projects.map((project) => ({ id: project.id, name: project.name }))}
      />

      <Link href="/notes" className="inline-flex text-sm font-bold text-blue-700 hover:text-slate-950">
        返回笔记列表
      </Link>
    </main>
  );
}
