"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
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
    setIsSubmitting(true);
    clearErrors();

    const formData = new FormData(event.currentTarget);
    const endpoint = mode === "create" ? "/api/tasks" : `/api/tasks/${initialTask?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        status: String(formData.get("status") ?? TaskStatus.OPEN),
        priority: String(formData.get("priority") ?? TaskPriority.MEDIUM),
        dueAt: String(formData.get("dueAt") ?? ""),
        projectId: String(formData.get("projectId") ?? ""),
        sourceNoteId: String(formData.get("sourceNoteId") ?? ""),
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
      className="space-y-5 rounded-lg border-2 border-line bg-paper p-6 shadow-panel"
    >
      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-muted">TITLE</span>
        <input
          name="title"
          defaultValue={initialTask?.title}
          className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
        />
        {fieldErrors.title ? <span className="text-sm font-bold text-ember">{fieldErrors.title}</span> : null}
      </label>

      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-muted">DESCRIPTION</span>
        <textarea
          name="description"
          rows={5}
          defaultValue={initialTask?.description ?? ""}
          className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm leading-6 text-ink shadow-panel"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-5">
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">PROJECT</span>
          <select
            name="projectId"
            defaultValue={initialTask?.projectId ?? projects[0]?.id ?? ""}
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">STATUS</span>
          <select
            name="status"
            defaultValue={initialTask?.status ?? TaskStatus.OPEN}
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
          >
            <option value={TaskStatus.OPEN}>OPEN</option>
            <option value={TaskStatus.DONE}>DONE</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">PRIORITY</span>
          <select
            name="priority"
            defaultValue={initialTask?.priority ?? TaskPriority.MEDIUM}
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
          >
            <option value={TaskPriority.HIGH}>HIGH</option>
            <option value={TaskPriority.MEDIUM}>MEDIUM</option>
            <option value={TaskPriority.LOW}>LOW</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">DUE DATE</span>
          <input
            type="date"
            name="dueAt"
            defaultValue={initialTask?.dueAt?.slice(0, 10) ?? ""}
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
          />
          {fieldErrors.dueAt ? <span className="text-sm font-bold text-ember">{fieldErrors.dueAt}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">SOURCE NOTE</span>
          <select
            name="sourceNoteId"
            defaultValue={initialTask?.sourceNoteId ?? ""}
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
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
        <legend className="font-[var(--font-mono)] text-xs font-bold text-muted">TAGS</legend>
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

      {error ? <p className="text-sm font-bold text-ember">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-panel disabled:opacity-60"
      >
        {isSubmitting ? "保存中..." : mode === "create" ? "创建任务" : "保存任务"}
      </button>
    </form>
  );
}
