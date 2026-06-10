import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { DeleteButton } from "@/components/ui/delete-button";
import { PageHeader } from "@/components/ui/page-header";
import { TagPill } from "@/components/ui/tag-pill";
import { getTask } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type TaskDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const task = await getTask(id).catch(() => null);

  if (!task) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="任务详情"
        title={task.title}
        description="这是来自 PostgreSQL 的任务详情页，用于验证任务状态、来源笔记和标签信息展示。"
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/tasks/${task.id}/edit`}
          className="rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-panel"
        >
          编辑任务
        </Link>
        <DeleteButton endpoint={`/api/tasks/${task.id}`} redirectTo="/tasks" label={task.title} />
      </div>

      <article className="rounded-lg border-2 border-line bg-paper p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-4">
          <div>
            <p className="font-[var(--font-mono)] text-xs font-bold text-muted">
              更新于 / {task.updatedAt.slice(0, 10)}
            </p>
            <p className="mt-2 text-sm font-bold text-blueprint">项目：{task.project.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border-2 border-line bg-paper px-2 py-1 font-[var(--font-mono)] text-xs font-black text-ink">
                优先级：{task.priority === "HIGH" ? "高" : task.priority === "MEDIUM" ? "中" : "低"}
              </span>
              {task.dueAt ? (
                <span className={`rounded-md border-2 border-line px-2 py-1 font-[var(--font-mono)] text-xs font-black ${task.isOverdue ? "bg-ember text-ink" : "bg-paper text-muted"}`}>
                  截止：{task.dueAt.slice(0, 10)}
                </span>
              ) : null}
            </div>
          </div>
          <span className="rounded-md border-2 border-line bg-accent px-3 py-1 font-[var(--font-mono)] text-xs font-black text-ink">
            {task.status === "DONE" ? "已完成" : "未完成"}
          </span>
        </div>

        {task.description ? (
          <MarkdownContent content={task.description} />
        ) : (
          <p className="mt-6 text-base leading-8 text-muted">暂无描述。</p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <TagPill key={tag.id} tag={tag} />
          ))}
        </div>

        {task.sourceNote ? (
          <section className="mt-6 rounded-lg border-2 border-line bg-surface p-4">
            <p className="font-[var(--font-mono)] text-xs font-bold text-copper">来源笔记</p>
            <Link
              href={`/notes/${task.sourceNote.id}`}
              className="mt-2 block font-[var(--font-display)] text-xl font-bold text-blueprint hover:text-ink"
            >
              {task.sourceNote.title}
            </Link>
          </section>
        ) : null}
      </article>

      <Link href="/tasks" className="inline-flex text-sm font-bold text-blueprint hover:text-ink">
        返回任务列表
      </Link>
    </main>
  );
}
