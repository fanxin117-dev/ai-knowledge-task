"use client";

import { useEffect, useMemo, useState } from "react";
import type { AiApiStyle, AiRuntimeConfig } from "@/lib/ai/types";
import { AI_CONFIG_PRESETS, readStoredAiConfig, writeStoredAiConfig } from "@/lib/ai/client-config";

type EditableConfig = {
  mode: "mock" | "openai-compatible";
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  apiStyle: AiApiStyle;
};

function toEditable(config: AiRuntimeConfig): EditableConfig {
  return {
    mode: config.mode,
    label: config.label ?? "",
    baseUrl: config.baseUrl ?? "",
    apiKey: config.apiKey ?? "",
    model: config.model ?? "",
    apiStyle: config.apiStyle ?? "chat-completions",
  };
}

function toRuntimeConfig(config: EditableConfig): AiRuntimeConfig {
  if (config.mode === "mock") {
    return {
      mode: "mock",
      label: config.label || "Mock",
    };
  }

  return {
    mode: "openai-compatible",
    label: config.label || "Custom",
    baseUrl: config.baseUrl.trim(),
    apiKey: config.apiKey.trim() || undefined,
    model: config.model.trim(),
    apiStyle: config.apiStyle,
  };
}

export function AiProviderSettings() {
  const [config, setConfig] = useState<EditableConfig>(() => toEditable(AI_CONFIG_PRESETS[0].config));
  const [message, setMessage] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setConfig(toEditable(readStoredAiConfig()));
  }, []);

  const isMock = config.mode === "mock";
  const canSave = useMemo(() => {
    if (isMock) {
      return true;
    }

    return /^https?:\/\//i.test(config.baseUrl.trim()) && config.model.trim().length > 0;
  }, [config.baseUrl, config.model, isMock]);

  function applyPreset(presetId: string) {
    const preset = AI_CONFIG_PRESETS.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    setConfig(toEditable(preset.config));
    setMessage(null);
    setTestMessage(null);
  }

  function updateField<K extends keyof EditableConfig>(key: K, value: EditableConfig[K]) {
    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
    setMessage(null);
    setTestMessage(null);
  }

  function save() {
    if (!canSave) {
      setMessage("请填写有效的 baseUrl 和 model。");
      return;
    }

    writeStoredAiConfig(toRuntimeConfig(config));
    setMessage("AI 配置已保存到当前浏览器。");
  }

  async function testConnection() {
    if (!canSave) {
      setTestMessage("请先填写有效的 baseUrl 和 model。");
      return;
    }

    setIsTesting(true);
    setTestMessage(null);

    try {
      const response = await fetch("/api/ai/test-config", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          aiConfig: toRuntimeConfig(config),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            data?: { provider: string; summary: string };
            error?: { message?: string; details?: Record<string, string> };
          }
        | null;

      if (!response.ok || !payload?.data) {
        const detailText = payload?.error?.details
          ? ` (${Object.entries(payload.error.details)
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ")})`
          : "";
        setTestMessage(`${payload?.error?.message ?? "连接测试失败。"}${detailText}`);
        return;
      }

      setTestMessage(`连接成功：${payload.data.provider} 返回了摘要。`);
    } catch {
      setTestMessage("连接测试失败：浏览器无法完成请求。");
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <section className="space-y-5 rounded-lg border-2 border-line bg-paper p-6 shadow-panel">
      <div>
        <p className="font-[var(--font-mono)] text-xs font-bold text-copper">PROVIDER PRESETS</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {AI_CONFIG_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="rounded-lg border-2 border-line bg-surface p-4 text-left shadow-panel hover:bg-accent"
            >
              <span className="block text-sm font-black text-ink">{preset.name}</span>
              <span className="mt-2 block text-xs leading-5 text-muted">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">MODE</span>
          <select
            value={config.mode}
            onChange={(event) => updateField("mode", event.target.value as EditableConfig["mode"])}
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
          >
            <option value="mock">mock</option>
            <option value="openai-compatible">openai-compatible</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">LABEL</span>
          <input
            value={config.label}
            onChange={(event) => updateField("label", event.target.value)}
            placeholder="例如 OpenAI / DeepSeek / 本地模型"
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">BASE URL</span>
          <input
            value={config.baseUrl}
            disabled={isMock}
            onChange={(event) => updateField("baseUrl", event.target.value)}
            placeholder="https://api.example.com/v1"
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel disabled:opacity-50"
          />
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">MODEL</span>
          <input
            value={config.model}
            disabled={isMock}
            onChange={(event) => updateField("model", event.target.value)}
            placeholder="例如 gpt-5.2 / deepseek-chat / llama3.2"
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel disabled:opacity-50"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">API STYLE</span>
          <select
            value={config.apiStyle}
            disabled={isMock}
            onChange={(event) => updateField("apiStyle", event.target.value as AiApiStyle)}
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel disabled:opacity-50"
          >
            <option value="chat-completions">chat-completions</option>
            <option value="responses">responses</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-muted">API KEY</span>
          <input
            value={config.apiKey}
            disabled={isMock}
            type="password"
            onChange={(event) => updateField("apiKey", event.target.value)}
            placeholder="本地模型可留空，云端模型通常需要填写"
            className="rounded-md border-2 border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-panel disabled:opacity-50"
          />
        </label>
      </div>

      <div className="rounded-lg border-2 border-line bg-surface p-4 text-sm leading-6 text-muted">
        API Key 只保存到当前浏览器的 localStorage，不写入 PostgreSQL。多人共用电脑时，请不要保存自己的生产密钥。
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-panel disabled:opacity-60"
        >
          保存配置
        </button>
        <button
          type="button"
          onClick={testConnection}
          disabled={!canSave || isTesting}
          className="rounded-md border-2 border-line bg-paper px-4 py-2 text-sm font-black text-ink shadow-panel disabled:opacity-60"
        >
          {isTesting ? "测试中..." : "测试连接"}
        </button>
        {message ? <p className="text-sm font-bold text-blueprint">{message}</p> : null}
      </div>

      {testMessage ? <p className="text-sm font-bold text-ember">{testMessage}</p> : null}
    </section>
  );
}
