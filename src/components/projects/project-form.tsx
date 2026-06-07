"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type ProjectFormProps = {
  mode: "create" | "edit";
  initialProject?: {
    id: string;
    name: string;
    description: string | null;
  };
};

type ApiError = {
  error?: {
    message?: string;
    details?: Record<string, string>;
  };
};

export function ProjectForm({ mode, initialProject }: ProjectFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearErrors() {
    setError(null);
    setFieldErrors({});
  }

  useEffect(() => {
    window.addEventListener("pageshow", clearErrors);
    return () => window.removeEventListener("pageshow", clearErrors);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "");
    const nextFieldErrors: Record<string, string> = {};

    if (!name) {
      nextFieldErrors.name = "项目名不能为空。";
    } else if (name.length > 80) {
      nextFieldErrors.name = "项目名不能超过 80 个字符。";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError("请先补全必填项。");
      return;
    }

    setIsSubmitting(true);
    const endpoint = mode === "create" ? "/api/projects" : `/api/projects/${initialProject?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | (ApiError & { data?: { id: string } })
      | null;

    if (!response.ok || !payload?.data) {
      setError(payload?.error?.message ?? "保存项目失败。");
      setFieldErrors(payload?.error?.details ?? {});
      setIsSubmitting(false);
      return;
    }

    router.replace(`/projects/${payload.data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={clearErrors}
      className="space-y-5 rounded-lg border-2 border-line bg-paper p-6 shadow-panel"
    >
      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-muted">项目名</span>
        <input
          name="name"
          defaultValue={initialProject?.name}
          aria-invalid={Boolean(fieldErrors.name)}
          className="min-h-11 rounded-md border-2 border-line bg-surface px-3 py-2 text-base font-semibold text-ink shadow-panel md:text-sm"
        />
        {fieldErrors.name ? <span className="text-sm font-bold text-ember">{fieldErrors.name}</span> : null}
      </label>

      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-muted">描述</span>
        <textarea
          name="description"
          rows={5}
          defaultValue={initialProject?.description ?? ""}
          className="min-h-11 rounded-md border-2 border-line bg-surface px-3 py-2 text-base leading-6 text-ink shadow-panel md:text-sm"
        />
      </label>

      {error ? <p className="text-sm font-bold text-ember">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-panel disabled:opacity-60"
      >
        {isSubmitting ? "保存中..." : mode === "create" ? "创建项目" : "保存项目"}
      </button>
    </form>
  );
}
