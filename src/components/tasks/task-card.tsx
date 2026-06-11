import Link from "next/link";
import { TagPill } from "@/components/ui/tag-pill";

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: "OPEN" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH";
    dueAt: string | null;
    isOverdue: boolean;
    updatedAt: string;
    project: {
      id: string;
      name: string;
    };
    tags: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
};

export function TaskCard({ task }: TaskCardProps) {
  const isDone = task.status === "DONE";
  const updatedDate = task.updatedAt.slice(0, 10);
  const priorityClassName =
    task.priority === "HIGH" ? "bg-red-50 text-red-700" : task.priority === "MEDIUM" ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-500";
  const priorityLabel = task.priority === "HIGH" ? "高" : task.priority === "MEDIUM" ? "中" : "低";

  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">
            {updatedDate} / {task.project.name}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${priorityClassName}`}>
              优先级：{priorityLabel}
            </span>
            {task.dueAt ? (
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${task.isOverdue ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"}`}>
                截止：{task.dueAt.slice(0, 10)}
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-lg font-semibold leading-snug text-slate-950">
            {task.title}
          </h2>
        </div>
        <span
          className={[
            "rounded-md px-3 py-1.5 text-xs font-semibold",
            isDone ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {isDone ? "已完成" : "未完成"}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{task.description ?? "暂无描述。"}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          {task.tags.map((tag) => (
            <TagPill key={tag.id} tag={tag} />
          ))}
        </div>

        <Link
          href={`/tasks/${task.id}`}
          className="inline-flex min-h-10 items-center rounded-md px-2 text-sm font-semibold text-blue-700 hover:text-slate-950"
        >
          查看详情
        </Link>
      </div>
    </article>
  );
}
