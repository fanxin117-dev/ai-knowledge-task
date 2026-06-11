import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { ProjectArchiveButton } from "@/components/projects/project-archive-button";
import { ProjectTaskBoard } from "@/components/projects/project-task-board";
import { DeleteButton } from "@/components/ui/delete-button";
import { PageHeader } from "@/components/ui/page-header";
import { getProject } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await getProject(id).catch(() => null);

  if (!project) {
    notFound();
  }

  const openTasks = project.tasks.filter((task) => task.status === "OPEN");
  const doneTasks = project.tasks.filter((task) => task.status === "DONE");

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="项目详情"
        title={project.name}
        description={
          project.isArchived
            ? `已归档于 ${project.archivedAt?.slice(0, 10)}。项目描述和任务看板如下。`
            : "项目描述和任务看板如下。"
        }
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/projects/${project.id}/edit`}
          className="rounded-md border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm"
        >
          编辑项目
        </Link>
        <Link
          href={`/tasks?project=${project.id}`}
          className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-950 shadow-sm"
        >
          查看任务筛选
        </Link>
        <ProjectArchiveButton projectId={project.id} isArchived={project.isArchived} />
        {project.taskCount === 0 ? (
          <DeleteButton endpoint={`/api/projects/${project.id}`} redirectTo="/projects" label={project.name} />
        ) : null}
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-[var(--font-mono)] text-xs font-bold text-slate-500">未完成任务</p>
          <p className="mt-2 font-[var(--font-display)] text-5xl font-black text-slate-950">{project.openTaskCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-[var(--font-mono)] text-xs font-bold text-slate-500">任务总数</p>
          <p className="mt-2 font-[var(--font-display)] text-5xl font-black text-slate-950">{project.taskCount}</p>
        </div>
      </section>

      <article className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <p className="font-[var(--font-mono)] text-xs font-bold text-slate-500">项目描述</p>
        {project.description ? (
          <MarkdownContent content={project.description} />
        ) : (
          <p className="mt-4 text-base leading-8 text-slate-500">这个项目还没有描述。</p>
        )}
      </article>

      <ProjectTaskBoard openTasks={openTasks} doneTasks={doneTasks} />
    </main>
  );
}
