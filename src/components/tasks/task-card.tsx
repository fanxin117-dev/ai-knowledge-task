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
    task.priority === "HIGH" ? "bg-ember" : task.priority === "MEDIUM" ? "bg-accent" : "bg-paper";

  return (
    <article className="rounded-lg border-2 border-line bg-surface p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-line pb-3">
        <div>
          <p className="font-[var(--font-mono)] text-xs font-bold text-copper">
            {updatedDate} / {task.project.name}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`rounded-md border-2 border-line px-2 py-1 font-[var(--font-mono)] text-xs font-black text-ink ${priorityClassName}`}>
              {task.priority}
            </span>
            {task.dueAt ? (
              <span className={`rounded-md border-2 border-line px-2 py-1 font-[var(--font-mono)] text-xs font-black ${task.isOverdue ? "bg-ember text-ink" : "bg-paper text-muted"}`}>
                DUE {task.dueAt.slice(0, 10)}
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-lg font-black leading-tight text-ink">
            {task.title}
          </h2>
        </div>
        <span
          className={[
            "rounded-md border-2 border-line px-3 py-1.5 font-[var(--font-mono)] text-xs font-black",
            isDone ? "bg-accent text-ink" : "bg-ember text-ink",
          ].join(" ")}
        >
          {isDone ? "DONE" : "OPEN"}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{task.description ?? "暂无描述。"}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <TagPill key={tag.id} tag={tag} />
          ))}
        </div>

        <Link href={`/tasks/${task.id}`} className="text-sm font-bold text-blueprint hover:text-ink">
          查看详情
        </Link>
      </div>
    </article>
  );
}
