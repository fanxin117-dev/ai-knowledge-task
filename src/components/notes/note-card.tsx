import Link from "next/link";
import { TagPill } from "@/components/ui/tag-pill";

type NoteCardProps = {
  note: {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
    tags: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
};

export function NoteCard({ note }: NoteCardProps) {
  const updatedDate = note.updatedAt.slice(0, 10);

  return (
    <article className="flex min-h-64 flex-col rounded-lg border-2 border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-line pb-4">
        <div className="min-w-0 flex-1">
          <p className="font-[var(--font-mono)] text-xs font-bold text-copper">{updatedDate}</p>
          <h2 className="mt-2 line-clamp-2 font-[var(--font-display)] text-2xl font-black leading-tight text-ink">
            {note.title}
          </h2>
        </div>
        <Link
          href={`/notes/${note.id}`}
          className="rounded-md border-2 border-line bg-ink px-3 py-1.5 text-sm font-bold text-surface hover:bg-blueprint"
        >
          查看
        </Link>
      </div>

      <p className="mt-4 max-h-36 overflow-hidden text-sm leading-6 text-muted">{note.content}</p>

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {note.tags.map((tag) => (
          <TagPill key={tag.id} tag={tag} />
        ))}
      </div>
    </article>
  );
}
