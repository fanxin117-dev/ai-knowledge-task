"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type SlashCommand = {
  id: string;
  label: string;
  hint: string;
  marker: string;
  replacement: string;
  caretOffset: number;
};

type SlashMenuState = {
  query: string;
  lineStart: number;
  cursor: number;
};

type MarkdownEditorProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows?: number;
  minHeightClassName?: string;
};

const slashCommands: SlashCommand[] = [
  { id: "h1", label: "标题 1", hint: "大标题", marker: "#", replacement: "# 标题", caretOffset: 4 },
  { id: "h2", label: "标题 2", hint: "章节标题", marker: "##", replacement: "## 标题", caretOffset: 5 },
  { id: "h3", label: "标题 3", hint: "小节标题", marker: "###", replacement: "### 标题", caretOffset: 6 },
  { id: "bullet", label: "项目列表", hint: "无序要点", marker: "-", replacement: "- 列表项", caretOffset: 4 },
  { id: "number", label: "编号列表", hint: "有序步骤", marker: "1.", replacement: "1. 步骤", caretOffset: 4 },
  { id: "todo", label: "待办项", hint: "任务复选框", marker: "- [ ]", replacement: "- [ ] 待办", caretOffset: 6 },
  { id: "quote", label: "引用", hint: "摘录或观点", marker: ">", replacement: "> 引用内容", caretOffset: 3 },
  {
    id: "code",
    label: "代码块",
    hint: "多行代码",
    marker: "```",
    replacement: "```\n代码\n```",
    caretOffset: 4,
  },
  { id: "divider", label: "分隔线", hint: "分隔上下文", marker: "---", replacement: "---", caretOffset: 3 },
];

const toolbarActions = [
  { label: "B", title: "加粗", prefix: "**", suffix: "**", fallback: "重点" },
  { label: "I", title: "斜体", prefix: "*", suffix: "*", fallback: "强调" },
  { label: "`", title: "行内代码", prefix: "`", suffix: "`", fallback: "code" },
  { label: "[]", title: "链接", prefix: "[", suffix: "](https://)", fallback: "链接文本" },
];

function findSlashMenu(text: string, cursor: number): SlashMenuState | null {
  const lineStart = text.lastIndexOf("\n", cursor - 1) + 1;
  const currentLineBeforeCursor = text.slice(lineStart, cursor);
  const match = currentLineBeforeCursor.match(/^\/([^\s/]*)$/);

  if (!match) {
    return null;
  }

  return {
    query: match[1].toLowerCase(),
    lineStart,
    cursor,
  };
}

export function MarkdownEditor({
  name,
  label,
  value,
  onChange,
  error,
  rows = 12,
  minHeightClassName = "min-h-[20rem]",
}: MarkdownEditorProps) {
  const editorId = useId();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    if (!slashMenu?.query) {
      return slashCommands;
    }

    return slashCommands.filter((command) => {
      const searchableText = `${command.label} ${command.hint} ${command.marker}`.toLowerCase();
      return searchableText.includes(slashMenu.query);
    });
  }, [slashMenu]);

  useEffect(() => {
    setActiveCommandIndex(0);
  }, [slashMenu?.query]);

  function focusContentAt(index: number) {
    requestAnimationFrame(() => {
      const textarea = contentRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(index, index);
    });
  }

  function updateSlashMenuForCursor(nextContent: string, cursor: number) {
    setSlashMenu(findSlashMenu(nextContent, cursor));
  }

  function insertSlashCommand(command: SlashCommand) {
    if (!slashMenu) {
      return;
    }

    // Slash 命令只替换当前行里从 "/" 到光标的部分，保留光标后的正文，避免误删用户已经写好的内容。
    const beforeSlash = value.slice(0, slashMenu.lineStart);
    const afterCursor = value.slice(slashMenu.cursor);
    const needsTrailingBreak = afterCursor.startsWith("\n") || afterCursor.length === 0 ? "" : "\n";
    const nextContent = `${beforeSlash}${command.replacement}${needsTrailingBreak}${afterCursor}`;
    const nextCaret = beforeSlash.length + command.caretOffset;

    onChange(nextContent);
    setSlashMenu(null);
    focusContentAt(nextCaret);
  }

  function wrapSelection(prefix: string, suffix: string, fallback: string) {
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const selectedText = value.slice(start, end) || fallback;
    const nextContent = `${value.slice(0, start)}${prefix}${selectedText}${suffix}${value.slice(end)}`;
    const selectionStart = start + prefix.length;
    const selectionEnd = selectionStart + selectedText.length;

    onChange(nextContent);
    setSlashMenu(null);
    requestAnimationFrame(() => {
      const nextTextarea = contentRef.current;

      if (!nextTextarea) {
        return;
      }

      nextTextarea.focus();
      nextTextarea.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function handleContentChange(nextContent: string, cursor: number) {
    onChange(nextContent);
    updateSlashMenuForCursor(nextContent, cursor);
  }

  function handleContentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!slashMenu || filteredCommands.length === 0) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSlashMenu(null);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveCommandIndex((current) => (current + 1) % filteredCommands.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCommandIndex((current) => (current - 1 + filteredCommands.length) % filteredCommands.length);
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      insertSlashCommand(filteredCommands[activeCommandIndex] ?? filteredCommands[0]);
    }
  }

  return (
    <div className="grid gap-3">
      <label htmlFor={editorId} className="font-[var(--font-mono)] text-xs font-bold text-muted">
        {label}
      </label>
      <div className="overflow-hidden rounded-lg border-2 border-line bg-surface shadow-panel">
        <div className="flex flex-wrap items-center gap-2 border-b-2 border-line bg-paper px-3 py-2">
          {toolbarActions.map((action) => (
            <button
              key={action.title}
              type="button"
              title={action.title}
              aria-label={action.title}
              onClick={() => wrapSelection(action.prefix, action.suffix, action.fallback)}
              className="inline-flex size-9 items-center justify-center rounded-md border-2 border-line bg-surface font-[var(--font-mono)] text-sm font-black text-ink shadow-control hover:bg-accent"
            >
              {action.label}
            </button>
          ))}
          <span className="ml-auto hidden font-[var(--font-mono)] text-xs font-bold text-muted md:inline">
            Markdown
          </span>
        </div>

        <div className="relative">
          <textarea
            id={editorId}
            ref={contentRef}
            name={name}
            rows={rows}
            value={value}
            placeholder="输入内容，按 / 插入样式"
            aria-invalid={Boolean(error)}
            onChange={(event) => handleContentChange(event.currentTarget.value, event.currentTarget.selectionStart)}
            onClick={(event) => updateSlashMenuForCursor(value, event.currentTarget.selectionStart)}
            onKeyDown={handleContentKeyDown}
            className={`block w-full resize-y border-0 bg-surface px-4 py-4 font-[var(--font-body)] text-base leading-8 text-ink shadow-none focus:ring-0 ${minHeightClassName}`}
          />

          {slashMenu && filteredCommands.length > 0 ? (
            <div className="absolute left-3 top-3 z-10 w-[min(22rem,calc(100%-1.5rem))] rounded-lg border-2 border-line bg-paper p-2 shadow-panel">
              <div className="grid gap-1" role="listbox" aria-label="Markdown 样式选项">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    type="button"
                    role="option"
                    aria-selected={index === activeCommandIndex}
                    onMouseDown={(event) => {
                      // 阻止 textarea 在按钮点击前失焦，否则浏览器会丢失当前光标位置。
                      event.preventDefault();
                      insertSlashCommand(command);
                    }}
                    className={[
                      "grid min-h-12 grid-cols-[3.75rem_1fr] items-center gap-3 rounded-md border px-3 py-2 text-left",
                      index === activeCommandIndex
                        ? "border-line bg-selected"
                        : "border-transparent bg-surface hover:border-line hover:bg-accent",
                    ].join(" ")}
                  >
                    <span className="font-[var(--font-mono)] text-xs font-black text-copper">{command.marker}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-ink">{command.label}</span>
                      <span className="block text-xs leading-5 text-muted">{command.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {error ? <span className="text-sm font-bold text-ember">{error}</span> : null}
    </div>
  );
}
