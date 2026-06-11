"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

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
  const [description, setDescription] = useState(initialProject?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearErrors() {
    setError(null);
    setFieldErrors({});
  }

  function handleDescriptionChange(nextDescription: string) {
    setDescription(nextDescription);
    clearErrors();
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
    const trimmedDescription = description.trim();
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
        description: trimmedDescription,
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
      className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm"
    >
      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">项目名</span>
        <input
          name="name"
          defaultValue={initialProject?.name}
          aria-invalid={Boolean(fieldErrors.name)}
          className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
        />
        {fieldErrors.name ? <span className="text-sm font-bold text-red-700">{fieldErrors.name}</span> : null}
      </label>

      <MarkdownEditor
        name="description"
        label="描述"
        value={description}
        onChange={handleDescriptionChange}
        rows={10}
        minHeightClassName="min-h-[16rem]"
      />

      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center rounded-md border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm disabled:opacity-60"
      >
        {isSubmitting ? "保存中..." : mode === "create" ? "创建项目" : "保存项目"}
      </button>
    </form>
  );
}
