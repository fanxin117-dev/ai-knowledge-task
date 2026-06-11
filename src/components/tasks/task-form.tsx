"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { TagPill } from "@/components/ui/tag-pill";

type TagOption = {
  id: string;
  name: string;
  color: string;
};

type NoteOption = {
  id: string;
  title: string;
};

type ProjectOption = {
  id: string;
  name: string;
};

type TaskFormProps = {
  mode: "create" | "edit";
  tags: TagOption[];
  notes: NoteOption[];
  projects: ProjectOption[];
  initialTask?: {
    id: string;
    title: string;
    description: string | null;
    status: "OPEN" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH";
    dueAt: string | null;
    projectId: string;
    sourceNoteId: string | null;
    tags: TagOption[];
  };
};

type ApiError = {
  error?: {
    message?: string;
    details?: Record<string, string>;
  };
};

export function TaskForm({ mode, tags, notes, projects, initialTask }: TaskFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState(
    () => new Set(initialTask?.tags.map((tag) => tag.id) ?? []),
  );
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
    // App Router 的客户端表单状态可能在历史导航时被保留；恢复页面时清掉旧错误更符合用户预期。
    window.addEventListener("pageshow", clearErrors);
    return () => window.removeEventListener("pageshow", clearErrors);
  }, []);

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) => {
      const next = new Set(current);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const trimmedDescription = description.trim();
    const dueAt = String(formData.get("dueAt") ?? "");
    const projectId = String(formData.get("projectId") ?? "");
    const sourceNoteId = String(formData.get("sourceNoteId") ?? "");
    const nextFieldErrors: Record<string, string> = {};

    if (!title) {
      nextFieldErrors.title = "标题不能为空。";
    }

    if (dueAt && Number.isNaN(new Date(`${dueAt}T00:00:00.000Z`).getTime())) {
      nextFieldErrors.dueAt = "截止日期格式不正确。";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError("请先补全必填项。");
      return;
    }

    setIsSubmitting(true);
    const endpoint = mode === "create" ? "/api/tasks" : `/api/tasks/${initialTask?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title,
        description: trimmedDescription,
        status: String(formData.get("status") ?? TaskStatus.OPEN),
        priority: String(formData.get("priority") ?? TaskPriority.MEDIUM),
        dueAt,
        projectId,
        sourceNoteId,
        tagIds: [...selectedTagIds],
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | (ApiError & { data?: { id: string } })
      | null;

    if (!response.ok || !payload?.data) {
      setError(payload?.error?.message ?? "保存任务失败。");
      setFieldErrors(payload?.error?.details ?? {});
      setIsSubmitting(false);
      return;
    }

    router.replace(`/tasks/${payload.data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={clearErrors}
      className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm"
    >
      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">标题</span>
        <input
          name="title"
          defaultValue={initialTask?.title}
          aria-invalid={Boolean(fieldErrors.title)}
          className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
        />
        {fieldErrors.title ? <span className="text-sm font-bold text-red-700">{fieldErrors.title}</span> : null}
      </label>

      <MarkdownEditor
        name="description"
        label="描述"
        value={description}
        onChange={handleDescriptionChange}
        rows={10}
        minHeightClassName="min-h-[16rem]"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="grid min-w-0 gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">项目</span>
          <select
            name="projectId"
            defaultValue={initialTask?.projectId ?? projects[0]?.id ?? ""}
            className="min-h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">状态</span>
          <select
            name="status"
            defaultValue={initialTask?.status ?? TaskStatus.OPEN}
            className="min-h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
          >
            <option value={TaskStatus.OPEN}>未完成</option>
            <option value={TaskStatus.DONE}>已完成</option>
          </select>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">优先级</span>
          <select
            name="priority"
            defaultValue={initialTask?.priority ?? TaskPriority.MEDIUM}
            className="min-h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
          >
            <option value={TaskPriority.HIGH}>高</option>
            <option value={TaskPriority.MEDIUM}>中</option>
            <option value={TaskPriority.LOW}>低</option>
          </select>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">截止日期</span>
          <input
            type="date"
            name="dueAt"
            defaultValue={initialTask?.dueAt?.slice(0, 10) ?? ""}
            aria-invalid={Boolean(fieldErrors.dueAt)}
            className="min-h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
          />
          {fieldErrors.dueAt ? <span className="text-sm font-bold text-red-700">{fieldErrors.dueAt}</span> : null}
        </label>

        <label className="grid min-w-0 gap-2 md:col-span-2 xl:col-span-1">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">来源笔记</span>
          <select
            name="sourceNoteId"
            defaultValue={initialTask?.sourceNoteId ?? ""}
            className="min-h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
          >
            <option value="">无来源笔记</option>
            {notes.map((note) => (
              <option key={note.id} value={note.id}>
                {note.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-[var(--font-mono)] text-xs font-bold text-slate-500">标签</legend>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <label key={tag.id} className="cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedTagIds.has(tag.id)}
                onChange={() => toggleTag(tag.id)}
              />
              <span className={selectedTagIds.has(tag.id) ? "brightness-100" : "opacity-45"}>
                <TagPill tag={tag} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center rounded-md border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm disabled:opacity-60"
      >
        {isSubmitting ? "保存中..." : mode === "create" ? "创建任务" : "保存任务"}
      </button>
    </form>
  );
}
