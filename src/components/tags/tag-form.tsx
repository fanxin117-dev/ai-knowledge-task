"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type TagFormProps = {
  mode: "create" | "edit";
  initialTag?: {
    id: string;
    name: string;
    color: string;
  };
};

type ApiError = {
  error?: {
    message?: string;
    details?: Record<string, string>;
  };
};

export function TagForm({ mode, initialTag }: TagFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearErrors() {
    setError(null);
    setFieldErrors({});
  }

  useEffect(() => {
    // 历史后退恢复页面时，不保留已经过期的提交错误。
    window.addEventListener("pageshow", clearErrors);
    return () => window.removeEventListener("pageshow", clearErrors);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    clearErrors();

    const formData = new FormData(event.currentTarget);
    const endpoint = mode === "create" ? "/api/tags" : `/api/tags/${initialTag?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        color: String(formData.get("color") ?? ""),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | (ApiError & { data?: { id: string } })
      | null;

    if (!response.ok || !payload?.data) {
      setError(payload?.error?.message ?? "保存标签失败。");
      setFieldErrors(payload?.error?.details ?? {});
      setIsSubmitting(false);
      return;
    }

    router.replace("/tags");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={clearErrors}
      className="space-y-5 rounded-lg border-2 border-line bg-paper p-6 shadow-panel"
    >
      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-muted">NAME</span>
        <input
          name="name"
          defaultValue={initialTag?.name}
          className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
        />
        {fieldErrors.name ? <span className="text-sm font-bold text-ember">{fieldErrors.name}</span> : null}
      </label>

      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-muted">COLOR</span>
        <input
          name="color"
          type="color"
          defaultValue={initialTag?.color ?? "#d7ff37"}
          className="h-12 w-24 rounded-md border-2 border-line bg-surface p-1 shadow-panel"
        />
        {fieldErrors.color ? <span className="text-sm font-bold text-ember">{fieldErrors.color}</span> : null}
      </label>

      {error ? <p className="text-sm font-bold text-ember">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-panel disabled:opacity-60"
      >
        {isSubmitting ? "保存中..." : mode === "create" ? "创建标签" : "保存标签"}
      </button>
    </form>
  );
}
