import type { ReactNode } from "react";

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "code"; text: string }
  | { type: "divider" };

type MarkdownContentProps = {
  content: string;
};

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
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

      blocks.push({ type: "code", text: codeLines.join("\n") });
      index += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: "divider" });
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];

      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }

      blocks.push({ type: "unordered-list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }

      blocks.push({ type: "ordered-list", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
  }

  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // 这里用白名单解析少量行内 Markdown：React 默认会转义文本，可避免把用户笔记当成 HTML 执行。
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${match.index}-strong`} className="font-black text-slate-950">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code key={`${match.index}-code`} className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-[var(--font-mono)] text-sm">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link?.[2] ?? "#";
      const isSafeHref = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("/");

      parts.push(
        <a
          key={`${match.index}-link`}
          href={isSafeHref ? href : "#"}
          className="font-bold text-blue-700 underline decoration-2 underline-offset-4 hover:text-slate-950"
          rel="noreferrer"
          target={href.startsWith("http") ? "_blank" : undefined}
        >
          {link?.[1] ?? token}
        </a>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderTextWithBreaks(text: string) {
  return text.split("\n").map((line, index) => (
    <span key={`${line}-${index}`}>
      {index > 0 ? <br /> : null}
      {renderInline(line)}
    </span>
  ));
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const blocks = parseMarkdown(content);

  return (
    <div className="mt-6 space-y-5 text-base leading-8 text-slate-950">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Tag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
          const className =
            block.level === 1
              ? "font-[var(--font-display)] text-3xl font-black leading-tight"
              : block.level === 2
                ? "font-[var(--font-display)] text-2xl font-black leading-tight"
                : "text-lg font-black leading-tight";

          return (
            <Tag key={`${block.type}-${index}`} className={className}>
              {renderInline(block.text)}
            </Tag>
          );
        }

        if (block.type === "blockquote") {
          return (
            <blockquote key={`${block.type}-${index}`} className="border-l-4 border-slate-300 bg-white px-4 py-3 text-slate-500">
              {renderTextWithBreaks(block.text)}
            </blockquote>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={`${block.type}-${index}`} className="list-disc space-y-2 pl-6">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={`${block.type}-${index}`} className="list-decimal space-y-2 pl-6">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "code") {
          return (
            <pre key={`${block.type}-${index}`} className="overflow-x-auto rounded-md border border-slate-200 bg-slate-950 p-4 text-white">
              <code className="font-[var(--font-mono)] text-sm leading-6">{block.text}</code>
            </pre>
          );
        }

        if (block.type === "divider") {
          return <hr key={`${block.type}-${index}`} className="border-slate-200" />;
        }

        return <p key={`${block.type}-${index}`}>{renderTextWithBreaks(block.text)}</p>;
      })}
    </div>
  );
}
