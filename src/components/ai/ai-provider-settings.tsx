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
      label: config.label || "本地模拟",
    };
  }

  return {
    mode: "openai-compatible",
    label: config.label || "自定义",
    baseUrl: config.baseUrl.trim(),
    apiKey: config.apiKey.trim() || undefined,
    model: config.model.trim(),
    apiStyle: config.apiStyle,
  };
}

type FieldErrors = Partial<Record<"baseUrl" | "model", string>>;
type Feedback = {
  tone: "success" | "error" | "info";
  text: string;
};

function validateConfig(config: EditableConfig): FieldErrors {
  if (config.mode === "mock") {
    return {};
  }

  const errors: FieldErrors = {};

  if (!/^https?:\/\//i.test(config.baseUrl.trim())) {
    errors.baseUrl = "接口地址需要以 http:// 或 https:// 开头。";
  }

  if (config.model.trim().length === 0) {
    errors.model = "请填写要调用的模型名称。";
  }

  return errors;
}

export function AiProviderSettings() {
  const [config, setConfig] = useState<EditableConfig>(() => toEditable(AI_CONFIG_PRESETS[0].config));
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [saveMessage, setSaveMessage] = useState<Feedback | null>(null);
  const [testResult, setTestResult] = useState<Feedback | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setConfig(toEditable(readStoredAiConfig()));
  }, []);

  const isMock = config.mode === "mock";
  const fieldErrors = useMemo(() => validateConfig(config), [config]);
  const canSave = Object.keys(fieldErrors).length === 0;
  const selectedPresetId = useMemo(() => {
    const preset = AI_CONFIG_PRESETS.find((item) => {
      const editable = toEditable(item.config);

      return (
        editable.mode === config.mode &&
        editable.label === config.label &&
        editable.baseUrl === config.baseUrl &&
        editable.model === config.model &&
        editable.apiStyle === config.apiStyle
      );
    });

    return preset?.id ?? "custom";
  }, [config]);

  function applyPreset(presetId: string) {
    const preset = AI_CONFIG_PRESETS.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    setConfig(toEditable(preset.config));
    setTouched({});
    setSaveMessage(null);
    setTestResult(null);
  }

  function updateField<K extends keyof EditableConfig>(key: K, value: EditableConfig[K]) {
    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
    setSaveMessage(null);
    setTestResult(null);
  }

  function touchField(field: keyof FieldErrors) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function revealBlockingErrors() {
    setTouched({ baseUrl: true, model: true });
  }

  function save() {
    if (!canSave) {
      revealBlockingErrors();
      setSaveMessage({ tone: "error", text: "请先修正表单中的错误，再保存配置。" });
      return;
    }

    writeStoredAiConfig(toRuntimeConfig(config));
    setSaveMessage({ tone: "success", text: "AI 配置已保存到当前浏览器。" });
  }

  async function testConnection() {
    if (!canSave) {
      revealBlockingErrors();
      setTestResult({ tone: "error", text: "请先修正接口地址和模型名称，再测试连接。" });
      return;
    }

    setIsTesting(true);
    setTestResult({ tone: "info", text: "正在测试连接..." });

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
        setTestResult({
          tone: "error",
          text: `${payload?.error?.message ?? "连接测试失败。"}${detailText} 请检查接口地址、模型名称和接口密钥是否匹配。`,
        });
        return;
      }

      setTestResult({ tone: "success", text: `连接成功：${payload.data.provider} 返回了摘要。` });
    } catch {
      setTestResult({ tone: "error", text: "连接测试失败：浏览器无法完成请求。请检查本地服务或网络状态。" });
    } finally {
      setIsTesting(false);
    }
  }

  const baseUrlError = touched.baseUrl ? fieldErrors.baseUrl : undefined;
  const modelError = touched.model ? fieldErrors.model : undefined;
  const feedbackClassName = (tone: Feedback["tone"]) =>
    [
      "rounded-lg border border-slate-200 p-4 text-sm font-bold leading-6",
      tone === "success" ? "bg-green-50 text-slate-950" : tone === "error" ? "bg-red-600 text-white" : "bg-white text-blue-700",
    ].join(" ");

  return (
    <section className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm md:p-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)] md:items-end">
        <div>
          <p className="font-[var(--font-mono)] text-xs font-bold text-slate-500">AI 配置</p>
          <h2 className="mt-2 font-[var(--font-display)] text-2xl font-black leading-tight text-slate-950">连接参数</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">先确认运行模式和模型参数，再保存或测试连接。</p>
        </div>
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">快速套用预设</span>
          <select
            value={selectedPresetId}
            onChange={(event) => {
              if (event.target.value !== "custom") {
                applyPreset(event.target.value);
              }
            }}
            className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
          >
            <option value="custom">自定义配置</option>
            {AI_CONFIG_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">运行模式</span>
          <select
            value={config.mode}
            onChange={(event) => updateField("mode", event.target.value as EditableConfig["mode"])}
            className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
          >
            <option value="mock">本地模拟</option>
            <option value="openai-compatible">兼容 OpenAI 接口</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">配置名称</span>
          <input
            value={config.label}
            onChange={(event) => updateField("label", event.target.value)}
            placeholder="例如 OpenAI / DeepSeek / 本地模型"
            className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm md:text-sm"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">接口地址</span>
          <input
            value={config.baseUrl}
            disabled={isMock}
            onChange={(event) => updateField("baseUrl", event.target.value)}
            onBlur={() => touchField("baseUrl")}
            placeholder="https://api.example.com/v1"
            aria-invalid={Boolean(baseUrlError)}
            aria-describedby={baseUrlError ? "ai-base-url-error" : undefined}
            className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
          {baseUrlError ? <span id="ai-base-url-error" className="text-sm font-bold text-red-700">{baseUrlError}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">模型名称</span>
          <input
            value={config.model}
            disabled={isMock}
            onChange={(event) => updateField("model", event.target.value)}
            onBlur={() => touchField("model")}
            placeholder="例如 gpt-5.2 / deepseek-chat / llama3.2"
            aria-invalid={Boolean(modelError)}
            aria-describedby={modelError ? "ai-model-error" : undefined}
            className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
          {modelError ? <span id="ai-model-error" className="text-sm font-bold text-red-700">{modelError}</span> : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">接口风格</span>
          <select
            value={config.apiStyle}
            disabled={isMock}
            onChange={(event) => updateField("apiStyle", event.target.value as AiApiStyle)}
            className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="chat-completions">聊天补全接口</option>
            <option value="responses">响应接口</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-mono)] text-xs font-bold text-slate-500">接口密钥</span>
          <div className="flex gap-2">
            <input
              value={config.apiKey}
              disabled={isMock}
              type={showApiKey ? "text" : "password"}
              onChange={(event) => updateField("apiKey", event.target.value)}
              placeholder="本地模型可留空，云端模型通常需要填写"
              className="min-h-11 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
            <button
              type="button"
              disabled={isMock}
              onClick={() => setShowApiKey((current) => !current)}
              className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showApiKey ? "隐藏" : "显示"}
            </button>
          </div>
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-500 shadow-sm">
        接口密钥只保存到当前浏览器的本地存储，不写入服务端数据库。多人共用电脑时，请不要保存自己的生产密钥。
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="min-h-11 rounded-md border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          保存配置
        </button>
        <button
          type="button"
          onClick={testConnection}
          disabled={!canSave || isTesting}
          className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isTesting ? "测试中..." : "测试连接"}
        </button>
      </div>

      <div className="space-y-3" aria-live="polite">
        {saveMessage ? <p className={feedbackClassName(saveMessage.tone)}>{saveMessage.text}</p> : null}
        {testResult ? <p className={feedbackClassName(testResult.tone)}>{testResult.text}</p> : null}
      </div>

      <details className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-bold text-slate-950">
          <span className="font-[var(--font-mono)] text-xs text-slate-500">服务商预设</span>
          <span className="text-sm text-slate-500">查看预设说明</span>
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {AI_CONFIG_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left shadow-sm hover:bg-blue-50"
            >
              <span className="block text-sm font-black text-slate-950">{preset.name}</span>
              <span className="mt-2 block text-xs leading-5 text-slate-500">{preset.description}</span>
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}
