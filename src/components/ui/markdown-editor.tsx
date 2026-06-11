"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";

type BlockType = "paragraph" | "h1" | "h2" | "h3" | "bullet" | "number" | "todo" | "quote" | "code" | "divider";

type EditorBlock = {
  id: string;
  type: BlockType;
  text: string;
};

type SlashCommand = {
  id: BlockType;
  label: string;
  hint: string;
  marker: string;
  aliases: string[];
};

type SlashMenuState = {
  blockId: string;
  query: string;
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
  { id: "h1", label: "标题 1", hint: "大标题", marker: "#", aliases: ["h1", "title", "heading"] },
  { id: "h2", label: "标题 2", hint: "章节标题", marker: "##", aliases: ["h2", "subtitle"] },
  { id: "h3", label: "标题 3", hint: "小节标题", marker: "###", aliases: ["h3"] },
  { id: "bullet", label: "项目列表", hint: "无序要点", marker: "-", aliases: ["ul", "list", "bullet"] },
  { id: "number", label: "编号列表", hint: "有序步骤", marker: "1.", aliases: ["ol", "number"] },
  { id: "todo", label: "待办项", hint: "任务复选框", marker: "☐", aliases: ["todo", "task"] },
  { id: "quote", label: "引用", hint: "摘录或观点", marker: "❝", aliases: ["quote"] },
  { id: "code", label: "代码块", hint: "多行代码", marker: "{ }", aliases: ["code"] },
  { id: "divider", label: "分隔线", hint: "分隔上下文", marker: "—", aliases: ["divider", "hr"] },
];

function createBlock(type: BlockType = "paragraph", text = ""): EditorBlock {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type,
    text,
  };
}

function parseMarkdown(value: string): EditorBlock[] {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const blocks: EditorBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push(createBlock("code", codeLines.join("\n")));
      index += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push(createBlock("divider"));
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const type = heading[1].length === 1 ? "h1" : heading[1].length === 2 ? "h2" : "h3";
      blocks.push(createBlock(type, heading[2]));
      index += 1;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      blocks.push(createBlock("quote", trimmed.replace(/^>\s?/, "")));
      index += 1;
      continue;
    }

    if (/^-\s+\[\s?\]\s+/.test(trimmed)) {
      blocks.push(createBlock("todo", trimmed.replace(/^-\s+\[\s?\]\s+/, "")));
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      blocks.push(createBlock("bullet", trimmed.replace(/^[-*]\s+/, "")));
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      blocks.push(createBlock("number", trimmed.replace(/^\d+\.\s+/, "")));
      index += 1;
      continue;
    }

    blocks.push(createBlock("paragraph", line));
    index += 1;
  }

  return blocks.length > 0 ? blocks : [createBlock()];
}

function serializeBlocks(blocks: EditorBlock[]) {
  return blocks
    .map((block, index) => {
      const text = block.text.trim();

      if (block.type !== "divider" && !text) {
        return "";
      }

      if (block.type === "h1") {
        return `# ${text}`;
      }

      if (block.type === "h2") {
        return `## ${text}`;
      }

      if (block.type === "h3") {
        return `### ${text}`;
      }

      if (block.type === "bullet") {
        return `- ${text}`;
      }

      if (block.type === "number") {
        return `${index + 1}. ${text}`;
      }

      if (block.type === "todo") {
        return `- [ ] ${text}`;
      }

      if (block.type === "quote") {
        return text
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n");
      }

      if (block.type === "code") {
        return `\`\`\`\n${block.text.replace(/\s+$/g, "")}\n\`\`\``;
      }

      if (block.type === "divider") {
        return "---";
      }

      return text;
    })
    .filter(Boolean)
    .join("\n\n");
}

function getBlockPlaceholder(type: BlockType) {
  if (type === "h1") {
    return "输入大标题";
  }

  if (type === "h2") {
    return "输入章节标题";
  }

  if (type === "h3") {
    return "输入小节标题";
  }

  if (type === "bullet") {
    return "列表项";
  }

  if (type === "number") {
    return "步骤";
  }

  if (type === "todo") {
    return "待办事项";
  }

  if (type === "quote") {
    return "引用内容";
  }

  if (type === "code") {
    return "输入代码";
  }

  return "输入内容，或按 / 选择格式";
}

function getEditableClassName(type: BlockType) {
  const base =
    "min-h-8 flex-1 whitespace-pre-wrap break-words border-0 bg-transparent px-1 py-1 text-slate-950 outline-none empty:before:text-slate-500 empty:before:content-[attr(data-placeholder)]";

  if (type === "h1") {
    return `${base} font-[var(--font-display)] text-3xl font-black leading-tight`;
  }

  if (type === "h2") {
    return `${base} font-[var(--font-display)] text-2xl font-black leading-tight`;
  }

  if (type === "h3") {
    return `${base} text-xl font-black leading-tight`;
  }

  if (type === "quote") {
    return `${base} border-l-4 border-slate-300 pl-4 text-slate-500`;
  }

  if (type === "code") {
    return `${base} rounded-md bg-slate-950 px-3 py-2 font-[var(--font-mono)] text-sm leading-6 text-white empty:before:text-white/55`;
  }

  return `${base} text-base leading-8`;
}

function getMarker(block: EditorBlock, index: number) {
  if (block.type === "bullet") {
    return "•";
  }

  if (block.type === "number") {
    return `${index + 1}.`;
  }

  if (block.type === "todo") {
    return "☐";
  }

  return "";
}

export function MarkdownEditor({
  name,
  label,
  value,
  onChange,
  error,
  minHeightClassName = "min-h-[20rem]",
}: MarkdownEditorProps) {
  const labelId = useId();
  const blockRefs = useRef(new Map<string, HTMLDivElement>());
  const blocksRef = useRef<EditorBlock[]>(parseMarkdown(value));
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => blocksRef.current);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [pendingFocusBlockId, setPendingFocusBlockId] = useState<string | null>(null);

  const filteredCommands = useMemo(() => {
    if (!slashMenu?.query) {
      return slashCommands;
    }

    return slashCommands.filter((command) => {
      const searchableText = `${command.label} ${command.hint} ${command.marker} ${command.aliases.join(" ")}`.toLowerCase();
      return searchableText.includes(slashMenu.query);
    });
  }, [slashMenu]);

  useEffect(() => {
    setActiveCommandIndex(0);
  }, [slashMenu?.query]);

  useEffect(() => {
    if (!pendingFocusBlockId) {
      return;
    }

    const element = blockRefs.current.get(pendingFocusBlockId);
    const pendingBlock = blocksRef.current.find((block) => block.id === pendingFocusBlockId);

    if (!element || !pendingBlock) {
      return;
    }

    if (element.textContent !== pendingBlock.text) {
      element.textContent = pendingBlock.text;
    }

    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    setPendingFocusBlockId(null);
  }, [blocks, pendingFocusBlockId]);

  function updateBlocks(nextBlocks: EditorBlock[]) {
    const normalizedBlocks = nextBlocks.length > 0 ? nextBlocks : [createBlock()];
    blocksRef.current = normalizedBlocks;
    setBlocks(normalizedBlocks);
    onChange(serializeBlocks(normalizedBlocks));
  }

  function updateBlockText(blockId: string, text: string) {
    const query = text.match(/^\/([^\s/]*)$/)?.[1] ?? null;
    const nextBlocks = blocksRef.current.map((block) => (block.id === blockId ? { ...block, text } : block));

    blocksRef.current = nextBlocks;
    onChange(serializeBlocks(nextBlocks));
    setSlashMenu(query === null ? null : { blockId, query: query.toLowerCase() });
  }

  function applyCommand(command: SlashCommand) {
    if (!slashMenu) {
      return;
    }

    const currentBlocks = blocksRef.current;
    const targetIndex = currentBlocks.findIndex((block) => block.id === slashMenu.blockId);

    if (targetIndex === -1) {
      return;
    }

    if (command.id === "divider") {
      const nextBlock = createBlock();
      const nextBlocks = [...currentBlocks];
      nextBlocks.splice(targetIndex, 1, createBlock("divider"), nextBlock);
      updateBlocks(nextBlocks);
      setSlashMenu(null);
      setPendingFocusBlockId(nextBlock.id);
      return;
    }

    const nextBlocks = currentBlocks.map((block) =>
      block.id === slashMenu.blockId ? { ...block, type: command.id, text: "" } : block,
    );
    updateBlocks(nextBlocks);
    setSlashMenu(null);
    setPendingFocusBlockId(slashMenu.blockId);
  }

  function splitBlock(blockId: string) {
    const currentBlocks = blocksRef.current;
    const currentIndex = currentBlocks.findIndex((block) => block.id === blockId);

    if (currentIndex === -1) {
      return;
    }

    const current = currentBlocks[currentIndex];
    const nextBlock = createBlock(current.type === "code" ? "code" : "paragraph");
    const nextBlocks = [...currentBlocks];
    nextBlocks.splice(currentIndex + 1, 0, nextBlock);
    updateBlocks(nextBlocks);
    setSlashMenu(null);
    setPendingFocusBlockId(nextBlock.id);
  }

  function removeEmptyBlock(blockId: string) {
    const currentBlocks = blocksRef.current;

    if (currentBlocks.length === 1) {
      const [onlyBlock] = currentBlocks;
      updateBlocks([{ ...onlyBlock, type: "paragraph", text: "" }]);
      return;
    }

    const currentIndex = currentBlocks.findIndex((block) => block.id === blockId);
    const previousBlock = currentBlocks[currentIndex - 1] ?? currentBlocks[currentIndex + 1];
    updateBlocks(currentBlocks.filter((block) => block.id !== blockId));
    setPendingFocusBlockId(previousBlock.id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>, block: EditorBlock) {
    if (slashMenu && slashMenu.blockId === block.id && filteredCommands.length > 0) {
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
        applyCommand(filteredCommands[activeCommandIndex] ?? filteredCommands[0]);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      splitBlock(block.id);
      return;
    }

    const currentText = blocksRef.current.find((currentBlock) => currentBlock.id === block.id)?.text ?? "";

    if (event.key === "Backspace" && !currentText) {
      event.preventDefault();
      removeEmptyBlock(block.id);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>, blockId: string) {
    event.preventDefault();
    updateBlockText(blockId, event.clipboardData.getData("text/plain"));
  }

  function handleInput(event: FormEvent<HTMLDivElement>, blockId: string) {
    updateBlockText(blockId, event.currentTarget.textContent ?? "");
  }

  return (
    <div className="grid gap-3">
      <span id={labelId} className="font-[var(--font-mono)] text-xs font-bold text-slate-500">
        {label}
      </span>
      <textarea name={name} value={value} readOnly className="sr-only" tabIndex={-1} aria-hidden />
      <div
        aria-invalid={Boolean(error)}
        className={`overflow-y-auto rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm ${minHeightClassName}`}
      >
        <div className="space-y-2" role="group">
          {blocks.map((block, index) => {
            const marker = getMarker(block, index);

            if (block.type === "divider") {
              return (
                <div key={block.id} className="group relative py-3">
                  <hr className="border-slate-200" />
                </div>
              );
            }

            return (
              <div key={block.id} className="relative">
                <div className="flex items-start gap-3">
                  {marker ? (
                    <span className="w-6 shrink-0 pt-1.5 text-right font-[var(--font-mono)] text-sm font-black text-slate-500">
                      {marker}
                    </span>
                  ) : null}
                  <div
                    ref={(element) => {
                      if (element) {
                        if (element.dataset.initialized !== "true") {
                          element.textContent = block.text;
                          element.dataset.initialized = "true";
                        }
                        blockRefs.current.set(block.id, element);
                      } else {
                        blockRefs.current.delete(block.id);
                      }
                    }}
                    role="textbox"
                    aria-label={label}
                    aria-multiline="true"
                    data-editor-block
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder={getBlockPlaceholder(block.type)}
                    onInput={(event) => handleInput(event, block.id)}
                    onKeyDown={(event) => handleKeyDown(event, block)}
                    onPaste={(event) => handlePaste(event, block.id)}
                    className={getEditableClassName(block.type)}
                  />
                </div>

                {slashMenu?.blockId === block.id && filteredCommands.length > 0 ? (
                  <div className="absolute left-0 top-full z-10 mt-2 w-[min(22rem,calc(100vw-4rem))] rounded-lg border border-slate-200 bg-slate-50 p-2 shadow-sm">
                    <div className="grid gap-1" role="listbox" aria-label="样式选项">
                      {filteredCommands.map((command, commandIndex) => (
                        <button
                          key={command.id}
                          type="button"
                          role="option"
                          aria-selected={commandIndex === activeCommandIndex}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            applyCommand(command);
                          }}
                          className={[
                            "grid min-h-14 grid-cols-[3.75rem_1fr] items-center gap-3 rounded-md border px-3 py-2 text-left",
                            commandIndex === activeCommandIndex
                              ? "border-slate-200 bg-blue-50"
                              : "border-transparent bg-white hover:border-slate-200 hover:bg-blue-50",
                          ].join(" ")}
                        >
                          <span className="font-[var(--font-mono)] text-xs font-black text-slate-500">{command.marker}</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-black text-slate-950">{command.label}</span>
                            <span className="block text-xs leading-5 text-slate-500">{command.hint}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      {error ? <span className="text-sm font-bold text-red-700">{error}</span> : null}
    </div>
  );
}
