"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskStatusButton } from "@/components/tasks/task-status-button";
import { EmptyState } from "@/components/ui/empty-state";
import { TagPill } from "@/components/ui/tag-pill";

type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueAt: string | null;
  isOverdue: boolean;
  updatedAt: string;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
};

type ProjectTaskBoardProps = {
  openTasks: BoardTask[];
  doneTasks: BoardTask[];
};

type SortMode = "smart" | "due" | "priority" | "updated";

const priorityWeight = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function compareTasks(a: BoardTask, b: BoardTask, sortMode: SortMode) {
  if (sortMode === "due" || sortMode === "smart") {
    const dueA = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const dueB = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
    if (dueA !== dueB) {
      return dueA - dueB;
    }
  }

  if (sortMode === "priority" || sortMode === "smart") {
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
  }

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function BoardColumn({
  title,
  tone,
  tasks,
  selectedTaskIds,
  onToggleTask,
  sortMode,
}: {
  title: string;
  tone: "open" | "done";
  tasks: BoardTask[];
  selectedTaskIds: Set<string>;
  onToggleTask: (taskId: string) => void;
  sortMode: SortMode;
}) {
  const nextStatus = tone === "open" ? "DONE" : "OPEN";
  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => compareTasks(a, b, sortMode)), [tasks, sortMode]);

  return (
    <section className="min-h-96 rounded-lg border-2 border-line bg-surface p-4 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-3 border-b-2 border-line pb-3">
        <h2 className="text-lg font-black text-ink">{title}</h2>
        <span
          className={[
            "rounded-md border-2 border-line px-2 py-1 font-[var(--font-mono)] text-xs font-black text-ink",
            tone === "open" ? "bg-ember" : "bg-accent",
          ].join(" ")}
        >
          {sortedTasks.length}
        </span>
      </div>

      {sortedTasks.length > 0 ? (
        <div className="grid gap-3">
          {sortedTasks.map((task) => (
            <article key={task.id} className="rounded-md border-2 border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.has(task.id)}
                    onChange={() => onToggleTask(task.id)}
                    className="mt-1 rounded border-2 border-line text-blueprint"
                  />
                  <div className="min-w-0">
                  <p className="font-[var(--font-mono)] text-xs font-bold text-copper">
                    UPDATED / {task.updatedAt.slice(0, 10)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md border-2 border-line bg-paper px-2 py-1 font-[var(--font-mono)] text-xs font-black text-ink">
                      {task.priority}
                    </span>
                    {task.dueAt ? (
                      <span className={`rounded-md border-2 border-line px-2 py-1 font-[var(--font-mono)] text-xs font-black ${task.isOverdue ? "bg-ember text-ink" : "bg-surface text-muted"}`}>
                        DUE {task.dueAt.slice(0, 10)}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-base font-black leading-tight text-ink">{task.title}</h3>
                  </div>
                </label>
                <TaskStatusButton taskId={task.id} nextStatus={nextStatus} />
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{task.description ?? "暂无描述。"}</p>

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
          ))}
        </div>
      ) : (
        <EmptyState
          title={tone === "open" ? "没有待办任务" : "没有已完成任务"}
          description={tone === "open" ? "这个项目当前没有需要推进的任务。" : "完成任务后会出现在这里。"}
        />
      )}
    </section>
  );
}

export function ProjectTaskBoard({ openTasks, doneTasks }: ProjectTaskBoardProps) {
  const router = useRouter();
  const [sortMode, setSortMode] = useState<SortMode>("smart");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(() => new Set());
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  function toggleTask(taskId: string) {
    setSelectedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  async function bulkUpdate(status: "OPEN" | "DONE") {
    if (selectedTaskIds.size === 0) {
      setBulkMessage("请先选择要批量处理的任务。");
      return;
    }

    setBulkMessage(null);
    setIsBulkUpdating(true);
    const taskIds = [...selectedTaskIds];
    const responses = await Promise.all(
      taskIds.map((taskId) =>
        fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ status }),
        }),
      ),
    );

    setIsBulkUpdating(false);

    if (responses.some((response) => !response.ok)) {
      setBulkMessage("部分任务更新失败，请刷新后重试。");
      return;
    }

    setSelectedTaskIds(new Set());
    setBulkMessage(`已批量更新 ${taskIds.length} 个任务。`);
    router.refresh();
  }

  return (
    <section className="space-y-4" aria-label="项目任务看板">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-line bg-paper p-4 shadow-panel">
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">SORT</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
          >
            <option value="smart">截止日期优先，再按优先级</option>
            <option value="due">截止日期</option>
            <option value="priority">优先级</option>
            <option value="updated">最近更新</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">
            SELECTED {selectedTaskIds.size}
          </span>
          <button
            type="button"
            disabled={isBulkUpdating}
            onClick={() => void bulkUpdate("DONE")}
            className="rounded-md border-2 border-line bg-ink px-3 py-2 text-sm font-black text-surface shadow-panel disabled:opacity-60"
          >
            批量完成
          </button>
          <button
            type="button"
            disabled={isBulkUpdating}
            onClick={() => void bulkUpdate("OPEN")}
            className="rounded-md border-2 border-line bg-paper px-3 py-2 text-sm font-black text-ink shadow-panel disabled:opacity-60"
          >
            批量重开
          </button>
        </div>
        {bulkMessage ? <p className="basis-full text-sm font-bold text-blueprint">{bulkMessage}</p> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <BoardColumn
          title="待办"
          tone="open"
          tasks={openTasks}
          selectedTaskIds={selectedTaskIds}
          onToggleTask={toggleTask}
          sortMode={sortMode}
        />
        <BoardColumn
          title="已完成"
          tone="done"
          tasks={doneTasks}
          selectedTaskIds={selectedTaskIds}
          onToggleTask={toggleTask}
          sortMode={sortMode}
        />
      </div>
    </section>
  );
}
