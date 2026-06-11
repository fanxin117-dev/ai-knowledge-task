"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteButtonProps = {
  endpoint: string;
  redirectTo: string;
  label: string;
};

export function DeleteButton({ endpoint, redirectTo, label }: DeleteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    // 浏览器原生 confirm 足够覆盖当前 MVP；后续做设计打磨时可替换为自定义弹窗。
    if (!window.confirm(`确认删除「${label}」吗？此操作不可撤销。`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const response = await fetch(endpoint, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      setError(payload?.error?.message ?? "删除失败。");
      setIsDeleting(false);
      return;
    }

    // 删除后不保留当前详情页在历史栈顶部，避免后退回到一个已经不存在的资源页面。
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="min-h-11 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
      >
        {isDeleting ? "删除中..." : "删除"}
      </button>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
