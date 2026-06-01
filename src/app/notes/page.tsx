import { EmptyState } from "@/components/ui/empty-state";
import { FilterRail } from "@/components/ui/filter-rail";
import { ModulePanel } from "@/components/ui/module-panel";
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
        eyebrow="Notes"
        title="笔记"
        description="笔记列表已切换到 PostgreSQL 数据源，并支持标题、正文关键词搜索和标签筛选。"
        actions={
          <Link
            href="/notes/new"
            className="inline-flex min-h-11 items-center rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-control hover:bg-blueprint"
          >
            新建笔记
          </Link>
        }
      />

      <SearchForm
        action="/notes"
        placeholder="搜索标题或正文"
        defaultQuery={query}
        hiddenFields={{ tag: tagId }}
      />

      <FilterRail label="TAG" items={tagFilters} />

      <ModulePanel
        code="NOTE-SPEC"
        title="笔记页当前能力"
        items={["列表和详情已分离，避免单页承载过多状态。", "搜索由服务层转换成数据库查询，后续 API 可复用同一逻辑。", "AI 摘要入口只出现在笔记详情页，减少误触。"]}
      />

      {notes.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2" aria-label="笔记列表">
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
    </main>
  );
}
