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
    <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">更新于 / {project.updatedAt.slice(0, 10)}</p>
          <h2 className="mt-1 break-words text-lg font-semibold leading-snug text-slate-950">
            {project.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.isArchived ? (
            <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              已归档
            </span>
          ) : null}
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex min-h-10 items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
          >
            查看
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
          未完成 {project.openTaskCount}
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
          总数 {project.taskCount}
        </span>
        {project.archivedAt ? (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
            归档于 {project.archivedAt.slice(0, 10)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
