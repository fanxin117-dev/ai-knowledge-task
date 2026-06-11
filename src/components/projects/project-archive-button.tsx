"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProjectArchiveButtonProps = {
  projectId: string;
  isArchived: boolean;
};

export function ProjectArchiveButton({ projectId, isArchived }: ProjectArchiveButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ archived: !isArchived }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;

    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload?.error?.message ?? "更新项目状态失败。");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
      >
        {isSubmitting ? "处理中..." : isArchived ? "恢复项目" : "归档项目"}
      </button>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
