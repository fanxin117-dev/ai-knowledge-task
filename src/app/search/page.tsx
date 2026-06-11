import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchForm } from "@/components/ui/search-form";
import { TagPill } from "@/components/ui/tag-pill";
import { NoteCard } from "@/components/notes/note-card";
import { TaskCard } from "@/components/tasks/task-card";
import { readSearchParam, type PageSearchParams } from "@/lib/search-params";
import { searchKnowledge } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: PageSearchParams;
};

function ResultSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = readSearchParam(params, "q") ?? "";
  const results = await searchKnowledge({ query });

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="全局搜索"
        title="搜索知识工作台"
        description="一次检索笔记、任务、项目和标签。当前版本使用 PostgreSQL 关键词搜索，先保证结果可解释、可点击、可回到原始内容。"
      />

      <SearchForm action="/search" placeholder="搜索标题、正文、项目或标签" defaultQuery={query} />

      {!query.trim() ? null : results.totalCount === 0 ? (
        <EmptyState
          title="没有匹配结果"
          description="换一个更短的关键词，或先到笔记、任务、项目和标签页确认内容是否已经保存。"
          actionLabel="返回工作台"
          actionHref="/"
        />
      ) : (
        <div className="space-y-8">
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-500 shadow-sm">
            “{results.query}” 共找到 {results.totalCount} 条结果。
          </p>

          {results.notes.length > 0 ? (
            <ResultSection title="笔记" count={results.notes.length}>
              <div className="grid gap-3 md:grid-cols-2">
                {results.notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </ResultSection>
          ) : null}

          {results.tasks.length > 0 ? (
            <ResultSection title="任务" count={results.tasks.length}>
              <div className="grid gap-3">
                {results.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </ResultSection>
          ) : null}

          {results.projects.length > 0 ? (
            <ResultSection title="项目" count={results.projects.length}>
              <div className="grid gap-3 md:grid-cols-2">
                {results.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
                  >
                    <p className="text-xs font-medium text-slate-500">
                      {project.isArchived ? "已归档" : "进行中"} / {project.openTaskCount}/{project.taskCount}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">{project.name}</h2>
                  </Link>
                ))}
              </div>
            </ResultSection>
          ) : null}

          {results.tags.length > 0 ? (
            <ResultSection title="标签" count={results.tags.length}>
              <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                {results.tags.map((tag) => (
                  <TagPill key={tag.id} tag={tag} />
                ))}
              </div>
            </ResultSection>
          ) : null}
        </div>
      )}
    </main>
  );
}
