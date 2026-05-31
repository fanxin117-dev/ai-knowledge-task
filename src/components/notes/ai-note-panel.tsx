"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readStoredAiConfig } from "@/lib/ai/client-config";
import type { AiRuntimeConfig } from "@/lib/ai/types";

type ActionItem = {
  title: string;
  description: string | null;
};

type AiResultRecord = {
  id: string;
  type: "SUMMARY" | "ACTION_ITEMS";
  content: string;
  createdAt: string;
};

type AiNotePanelProps = {
  noteId: string;
  noteTitle: string;
  aiResults: AiResultRecord[];
  projects: Array<{
    id: string;
    name: string;
  }>;
};

type Operation = "summary" | "actions" | "tasks";

type PanelNotice = {
  kind: "success" | "error" | "info";
  text: string;
};

function parseSavedActions(result: AiResultRecord | undefined) {
  if (!result) {
    return [];
  }

  try {
    const parsed = JSON.parse(result.content) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        title: typeof item.title === "string" ? item.title : "",
        description: typeof item.description === "string" ? item.description : null,
      }))
      .filter((item) => item.title.length > 0);
  } catch {
    return [];
  }
}

export function AiNotePanel({ noteId, noteTitle, aiResults, projects }: AiNotePanelProps) {
  const latestSummary = aiResults.find((result) => result.type === "SUMMARY");
  const latestActions = aiResults.find((result) => result.type === "ACTION_ITEMS");
  const [summary, setSummary] = useState<string | null>(latestSummary?.content ?? null);
  const [items, setItems] = useState<ActionItem[]>(() => parseSavedActions(latestActions));
  const [notice, setNotice] = useState<PanelNotice | null>(
    latestSummary || latestActions ? { kind: "info", text: "已载入最近一次保存的 AI 结果。" } : null,
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    latestSummary?.createdAt ?? latestActions?.createdAt ?? null,
  );
  const [lastOperation, setLastOperation] = useState<Operation | null>(null);
  const [aiConfig, setAiConfig] = useState<AiRuntimeConfig>({ mode: "mock", label: "Mock" });
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState(noteTitle);
  const [activeOperation, setActiveOperation] = useState<Operation | null>(null);

  useEffect(() => {
    const nextSummary = aiResults.find((result) => result.type === "SUMMARY");
    const nextActions = aiResults.find((result) => result.type === "ACTION_ITEMS");
    setSummary(nextSummary?.content ?? null);
    setItems(parseSavedActions(nextActions));
    setNotice(nextSummary || nextActions ? { kind: "info", text: "已载入最近一次保存的 AI 结果。" } : null);
    setLastSavedAt(nextSummary?.createdAt ?? nextActions?.createdAt ?? null);
    setLastOperation(null);
    setProjectName(noteTitle);
  }, [noteId, noteTitle, aiResults]);

  useEffect(() => {
    function refreshConfig() {
      setAiConfig(readStoredAiConfig());
    }

    refreshConfig();
    window.addEventListener("storage", refreshConfig);
    window.addEventListener("knowledge-hub:ai-config-change", refreshConfig);

    return () => {
      window.removeEventListener("storage", refreshConfig);
      window.removeEventListener("knowledge-hub:ai-config-change", refreshConfig);
    };
  }, []);

  async function postJson<T>(endpoint: string, body: unknown) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as
      | { data: T }
      | { error: { message: string; details?: Record<string, string | number> } };

    if (!response.ok || !("data" in payload)) {
      const detailText =
        "error" in payload && payload.error.details
          ? Object.entries(payload.error.details)
              .map(([key, value]) => `${key}: ${value}`)
              .join("；")
          : "";
      throw new Error("error" in payload ? [payload.error.message, detailText].filter(Boolean).join(" ") : "AI 请求失败。");
    }

    return payload.data;
  }

  async function summarize() {
    setActiveOperation("summary");
    setNotice({ kind: "info", text: "正在生成摘要..." });
    setLastOperation("summary");
    try {
      const data = await postJson<{ summary: string; result: { id: string; createdAt: string }; provider: string }>(
        "/api/ai/summarize-note",
        { noteId, aiConfig },
      );
      if (!data.summary.trim()) {
        setSummary(null);
        setNotice({ kind: "info", text: "AI 返回了空摘要，没有保存可展示内容。" });
        return;
      }

      setSummary(data.summary);
      setLastSavedAt(data.result.createdAt);
      setNotice({ kind: "success", text: `摘要已由 ${data.provider} 生成并保存。` });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "生成摘要失败。" });
    } finally {
      setActiveOperation(null);
    }
  }

  async function extractActions() {
    setActiveOperation("actions");
    setNotice({ kind: "info", text: "正在提取行动项..." });
    setLastOperation("actions");
    try {
      const data = await postJson<{ items: ActionItem[]; result: { id: string; createdAt: string }; provider: string }>(
        "/api/ai/extract-actions",
        { noteId, aiConfig },
      );
      if (data.items.length === 0) {
        setItems([]);
        setNotice({ kind: "info", text: "没有提取到行动项。可以补充更明确的 TODO、下一步或验证事项后重试。" });
        return;
      }

      setItems(data.items);
      setLastSavedAt(data.result.createdAt);
      setNotice({ kind: "success", text: `已由 ${data.provider} 提取并保存 ${data.items.length} 个行动项。` });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "提取行动项失败。" });
    } finally {
      setActiveOperation(null);
    }
  }

  async function createTasks() {
    if (items.length === 0) {
      setNotice({ kind: "info", text: "当前没有行动项可转换，请先提取行动项。" });
      return;
    }

    setActiveOperation("tasks");
    setNotice({ kind: "info", text: "正在同步行动项到任务..." });
    setLastOperation("tasks");
    try {
      const tasks = await postJson<Array<{ id: string }>>("/api/ai/actions-to-tasks", {
        noteId,
        projectId,
        projectName,
        items,
      });
      const targetProjectName = projectId ? projects.find((project) => project.id === projectId)?.name : projectName;
      setNotice({ kind: "success", text: `已同步 ${tasks.length} 个任务到项目「${targetProjectName}」。重复任务会复用已有记录。` });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "创建任务失败。" });
    } finally {
      setActiveOperation(null);
    }
  }

  function retryLastOperation() {
    if (lastOperation === "summary") {
      void summarize();
    } else if (lastOperation === "actions") {
      void extractActions();
    } else if (lastOperation === "tasks") {
      void createTasks();
    }
  }

  const isBusy = activeOperation !== null;
  const noticeClassName =
    notice?.kind === "error"
      ? "border-ember bg-paper text-ember"
      : notice?.kind === "success"
        ? "border-line bg-accent text-ink"
        : "border-line bg-paper text-blueprint";

  return (
    <section className="rounded-lg border-2 border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-3">
        <h2 className="font-[var(--font-display)] text-2xl font-black text-ink">AI provider workspace</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border-2 border-line bg-accent px-2 py-1 font-[var(--font-mono)] text-xs font-black text-ink">
            {aiConfig.mode === "mock" ? "MOCK" : aiConfig.label || "CUSTOM"}
          </span>
          <Link href="/settings/ai" className="text-sm font-bold text-blueprint hover:text-ink">
            配置
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isBusy}
          onClick={summarize}
          className="rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-panel disabled:opacity-60"
        >
          {activeOperation === "summary" ? "生成中..." : "生成摘要"}
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={extractActions}
          className="rounded-md border-2 border-line bg-paper px-4 py-2 text-sm font-black text-ink shadow-panel disabled:opacity-60"
        >
          {activeOperation === "actions" ? "提取中..." : "提取行动项"}
        </button>
        <button
          type="button"
          disabled={isBusy || items.length === 0}
          onClick={createTasks}
          className="rounded-md border-2 border-line bg-ember px-4 py-2 text-sm font-black text-ink shadow-panel disabled:opacity-60"
        >
          {activeOperation === "tasks" ? "同步中..." : "行动项转任务"}
        </button>
      </div>

      {lastSavedAt ? (
        <p className="mt-4 font-[var(--font-mono)] text-xs font-bold text-muted">
          LAST SAVED / {lastSavedAt.slice(0, 19).replace("T", " ")}
        </p>
      ) : null}

      {summary ? (
        <div className="mt-4 rounded-md border-2 border-line bg-paper p-4">
          <p className="font-[var(--font-mono)] text-xs font-bold text-copper">SAVED SUMMARY</p>
          <p className="mt-2 text-sm leading-6 text-muted">{summary}</p>
        </div>
      ) : (
        <p className="mt-4 rounded-md border-2 border-line bg-paper p-4 text-sm font-bold text-muted">
          暂无摘要。点击“生成摘要”后，结果会保存到数据库并在这里展示。
        </p>
      )}

      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.title} className="rounded-md border-2 border-line bg-paper p-3">
              <p className="font-bold text-ink">{item.title}</p>
              {item.description ? <p className="mt-1 text-sm text-muted">{item.description}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 grid gap-3 rounded-lg border-2 border-line bg-paper p-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">目标项目</span>
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
          >
            <option value="">按下方名称创建或复用项目</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">新项目名称</span>
          <input
            value={projectName}
            disabled={Boolean(projectId)}
            onChange={(event) => setProjectName(event.target.value)}
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel disabled:opacity-50"
          />
        </label>
      </div>

      {notice ? (
        <div className={`mt-4 rounded-md border-2 p-3 text-sm font-bold ${noticeClassName}`}>
          <p>{notice.text}</p>
          {notice.kind === "error" && lastOperation ? (
            <button type="button" onClick={retryLastOperation} className="mt-2 underline decoration-2 underline-offset-4">
              重试上一步
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
