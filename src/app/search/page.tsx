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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-3">
        <h2 className="font-[var(--font-display)] text-2xl font-black text-ink">{title}</h2>
        <span className="rounded-md border-2 border-line bg-paper px-2 py-1 font-[var(--font-mono)] text-xs font-black text-ink">
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

      {!query.trim() ? (
        <EmptyState
          title="输入关键词开始搜索"
          description="例如搜索一个项目名、任务标题、笔记片段或标签名称，结果会按内容类型分组展示。"
        />
      ) : results.totalCount === 0 ? (
        <EmptyState
          title="没有匹配结果"
          description="换一个更短的关键词，或先到笔记、任务、项目和标签页确认内容是否已经保存。"
          actionLabel="返回工作台"
          actionHref="/"
        />
      ) : (
        <div className="space-y-8">
          <p className="rounded-lg border-2 border-line bg-paper p-4 text-sm font-bold text-muted shadow-soft">
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
                    className="rounded-lg border-2 border-line bg-surface p-4 shadow-soft hover:bg-paper"
                  >
                    <p className="font-[var(--font-mono)] text-xs font-bold text-copper">
                      {project.isArchived ? "已归档" : "进行中"} / {project.openTaskCount}/{project.taskCount}
                    </p>
                    <h2 className="mt-2 text-xl font-black text-ink">{project.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                      {project.description ?? "这个项目还没有描述。"}
                    </p>
                  </Link>
                ))}
              </div>
            </ResultSection>
          ) : null}

          {results.tags.length > 0 ? (
            <ResultSection title="标签" count={results.tags.length}>
              <div className="flex flex-wrap gap-2 rounded-lg border-2 border-line bg-surface p-4 shadow-soft">
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
