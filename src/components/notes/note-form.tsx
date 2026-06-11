"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
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
  const [content, setContent] = useState(initialNote?.content ?? "");
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

  function handleContentChange(nextContent: string) {
    setContent(nextContent);
    clearErrors();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const trimmedContent = content.trim();
    const nextFieldErrors: Record<string, string> = {};

    if (!title) {
      nextFieldErrors.title = "标题不能为空。";
    }

    if (!trimmedContent) {
      nextFieldErrors.content = "正文不能为空。";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError("请先补全必填项。");
      return;
    }

    setIsSubmitting(true);
    const endpoint = mode === "create" ? "/api/notes" : `/api/notes/${initialNote?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title,
        content: trimmedContent,
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
      className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm md:p-6"
    >
      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">标题</span>
        <input
          name="title"
          defaultValue={initialNote?.title}
          aria-invalid={Boolean(fieldErrors.title)}
          className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
        />
        {fieldErrors.title ? <span className="text-sm font-bold text-red-700">{fieldErrors.title}</span> : null}
      </label>

      <MarkdownEditor
        name="content"
        label="正文"
        value={content}
        onChange={handleContentChange}
        error={fieldErrors.content}
        rows={16}
        minHeightClassName="min-h-[26rem]"
      />

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
        {isSubmitting ? "保存中..." : mode === "create" ? "创建笔记" : "保存笔记"}
      </button>
    </form>
  );
}
