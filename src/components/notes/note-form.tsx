"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { TagPill } from "@/components/ui/tag-pill";

type TagOption = {
  id: string;
  name: string;
  color: string;
};

type NoteFormProps = {
  mode: "create" | "edit";
  tags: TagOption[];
  initialNote?: {
    id: string;
    title: string;
    content: string;
    tags: TagOption[];
  };
};

type ApiError = {
  error?: {
    message?: string;
    details?: Record<string, string>;
  };
};

export function NoteForm({ mode, tags, initialNote }: NoteFormProps) {
  const router = useRouter();
  const [selectedTagIds, setSelectedTagIds] = useState(
    () => new Set(initialNote?.tags.map((tag) => tag.id) ?? []),
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearErrors() {
    setError(null);
    setFieldErrors({});
  }

  useEffect(() => {
    // 浏览器历史恢复时可能保留客户端组件状态；清理旧错误可以避免用户后退后看到已经过期的报错。
    window.addEventListener("pageshow", clearErrors);
    return () => window.removeEventListener("pageshow", clearErrors);
  }, []);

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) => {
      // Set 本身是可变对象，所以这里复制一份再改，确保 React 能识别状态变化并重新渲染。
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
    const endpoint = mode === "create" ? "/api/notes" : `/api/notes/${initialNote?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        tagIds: [...selectedTagIds],
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | (ApiError & { data?: { id: string } })
      | null;

    if (!response.ok || !payload?.data) {
      setError(payload?.error?.message ?? "保存笔记失败。");
      setFieldErrors(payload?.error?.details ?? {});
      setIsSubmitting(false);
      return;
    }

    // 保存成功后使用 replace，避免浏览器后退回到带旧错误状态的表单页。
    router.replace(`/notes/${payload.data.id}`);
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
          defaultValue={initialNote?.title}
          className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
        />
        {fieldErrors.title ? <span className="text-sm font-bold text-ember">{fieldErrors.title}</span> : null}
      </label>

      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-muted">CONTENT</span>
        <textarea
          name="content"
          rows={8}
          defaultValue={initialNote?.content}
          className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm leading-6 text-ink shadow-panel"
        />
        {fieldErrors.content ? (
          <span className="text-sm font-bold text-ember">{fieldErrors.content}</span>
        ) : null}
      </label>

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
        {isSubmitting ? "保存中..." : mode === "create" ? "创建笔记" : "保存笔记"}
      </button>
    </form>
  );
}
