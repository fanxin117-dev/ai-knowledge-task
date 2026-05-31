"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TaskStatusButtonProps = {
  taskId: string;
  nextStatus: "OPEN" | "DONE";
};

export function TaskStatusButton({ taskId, nextStatus }: TaskStatusButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;

    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload?.error?.message ?? "更新任务状态失败。");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        className="rounded-md border-2 border-line bg-ink px-3 py-1.5 text-xs font-black text-surface shadow-panel disabled:opacity-60"
      >
        {isSubmitting ? "保存中..." : nextStatus === "DONE" ? "标记完成" : "重新打开"}
      </button>
      {error ? <p className="text-xs font-bold text-ember">{error}</p> : null}
    </div>
  );
}
