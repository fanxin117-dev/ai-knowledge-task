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
          className="inline-flex min-h-11 items-center rounded-md border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm"
        >
          编辑任务
        </Link>
        <DeleteButton endpoint={`/api/tasks/${task.id}`} redirectTo="/tasks" label={task.title} />
      </div>

      <article className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 pb-4">
          <div>
            <p className="font-[var(--font-mono)] text-xs font-bold text-slate-500">
              更新于 / {task.updatedAt.slice(0, 10)}
            </p>
            <p className="mt-2 text-sm font-bold text-blue-700">项目：{task.project.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-[var(--font-mono)] text-xs font-black text-slate-950">
                优先级：{task.priority === "HIGH" ? "高" : task.priority === "MEDIUM" ? "中" : "低"}
              </span>
              {task.dueAt ? (
                <span className={`rounded-md border border-slate-200 px-2 py-1 font-[var(--font-mono)] text-xs font-black ${task.isOverdue ? "bg-red-50 text-slate-950" : "bg-slate-50 text-slate-500"}`}>
                  截止：{task.dueAt.slice(0, 10)}
                </span>
              ) : null}
            </div>
          </div>
          <span className="rounded-md border border-slate-200 bg-blue-50 px-3 py-1 font-[var(--font-mono)] text-xs font-black text-slate-950">
            {task.status === "DONE" ? "已完成" : "未完成"}
          </span>
        </div>

        {task.description ? (
          <MarkdownContent content={task.description} />
        ) : (
          <p className="mt-6 text-base leading-8 text-slate-500">暂无描述。</p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <TagPill key={tag.id} tag={tag} />
          ))}
        </div>

        {task.sourceNote ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-[var(--font-mono)] text-xs font-bold text-slate-500">来源笔记</p>
            <Link
              href={`/notes/${task.sourceNote.id}`}
              className="mt-2 block font-[var(--font-display)] text-xl font-bold text-blue-700 hover:text-slate-950"
            >
              {task.sourceNote.title}
            </Link>
          </section>
        ) : null}
      </article>

      <Link href="/tasks" className="inline-flex min-h-11 items-center text-sm font-bold text-blue-700 hover:text-slate-950">
        返回任务列表
      </Link>
    </main>
  );
}
