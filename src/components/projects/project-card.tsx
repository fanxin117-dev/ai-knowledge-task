import Link from "next/link";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    description: string | null;
    isArchived: boolean;
    archivedAt: string | null;
    updatedAt: string;
    taskCount: number;
    openTaskCount: number;
  };
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="min-w-0 rounded-lg border-2 border-line bg-surface p-4 shadow-soft md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-line pb-4">
        <div className="min-w-0 flex-1">
          <p className="font-[var(--font-mono)] text-xs font-bold text-copper">
            更新于 / {project.updatedAt.slice(0, 10)}
          </p>
          <h2 className="mt-2 break-words font-[var(--font-display)] text-2xl font-black leading-tight text-ink">
            {project.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.isArchived ? (
            <span className="rounded-md border-2 border-line bg-paper px-3 py-1.5 font-[var(--font-mono)] text-xs font-black text-muted">
              已归档
            </span>
          ) : null}
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex min-h-11 items-center rounded-md border-2 border-line bg-ink px-3 py-2 text-sm font-bold text-surface shadow-control hover:bg-blueprint"
          >
            查看
          </Link>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">{project.description ?? "暂无描述。"}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-md border-2 border-line bg-accent px-2 py-1 font-[var(--font-mono)] text-xs font-black text-ink">
          未完成 {project.openTaskCount}
        </span>
        <span className="rounded-md border-2 border-line bg-paper px-2 py-1 font-[var(--font-mono)] text-xs font-black text-ink">
          总数 {project.taskCount}
        </span>
        {project.archivedAt ? (
          <span className="rounded-md border-2 border-line bg-paper px-2 py-1 font-[var(--font-mono)] text-xs font-black text-muted">
            归档于 {project.archivedAt.slice(0, 10)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
