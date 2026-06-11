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
    <article className="flex min-h-48 min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">{updatedDate}</p>
          <h2 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug text-slate-950">
            {note.title}
          </h2>
        </div>
        <Link
          href={`/notes/${note.id}`}
          className="inline-flex min-h-11 items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
        >
          查看
        </Link>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{note.content}</p>

      <div className="mt-auto flex min-w-0 flex-wrap gap-2 pt-4">
        {note.tags.map((tag) => (
          <TagPill key={tag.id} tag={tag} />
        ))}
      </div>
    </article>
  );
}
