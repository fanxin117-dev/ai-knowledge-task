import { EmptyState } from "@/components/ui/empty-state";
import { FilterRail } from "@/components/ui/filter-rail";
import { NoteCard } from "@/components/notes/note-card";
import { PageHeader } from "@/components/ui/page-header";
import { SearchForm } from "@/components/ui/search-form";
import Link from "next/link";
import { buildQueryPath, readSearchParam, type PageSearchParams } from "@/lib/search-params";
import { listNotes, listTags } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type NotesPageProps = {
  searchParams: PageSearchParams;
};

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const params = await searchParams;
  const query = readSearchParam(params, "q");
  const tagId = readSearchParam(params, "tag");
  const [notes, tags] = await Promise.all([listNotes({ query, tagId }), listTags()]);

  const tagFilters = [
    { label: "全部", href: buildQueryPath("/notes", { q: query }), active: !tagId },
    ...tags.map((tag) => ({
      label: tag.name,
      href: buildQueryPath("/notes", { q: query, tag: tag.id }),
      active: tagId === tag.id,
    })),
  ];

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="笔记"
        title="笔记"
        description="笔记列表已切换到 PostgreSQL 数据源，并支持标题、正文关键词搜索和标签筛选。"
        actions={
          <Link
            href="/notes/new"
            className="inline-flex min-h-10 items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
          >
            新建笔记
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-3 xl:sticky xl:top-8 xl:self-start">
          <SearchForm
            action="/notes"
            placeholder="搜索标题或正文"
            defaultQuery={query}
            hiddenFields={{ tag: tagId }}
          />
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <FilterRail label="标签" items={tagFilters} />
          </div>
        </aside>

        {notes.length > 0 ? (
          <section className="grid min-w-0 gap-3 lg:grid-cols-2 2xl:grid-cols-3" aria-label="笔记列表">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </section>
        ) : (
          <EmptyState
            title="没有匹配的笔记"
            description="换一个关键词或清除标签筛选后再试。"
            actionLabel="清除筛选"
            actionHref="/notes"
          />
        )}
      </section>
    </main>
  );
}
