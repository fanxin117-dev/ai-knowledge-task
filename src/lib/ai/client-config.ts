"use client";

import type { AiRuntimeConfig } from "@/lib/ai/types";

export const AI_CONFIG_STORAGE_KEY = "knowledge-hub.ai-config.v1";

export type AiConfigPreset = {
  id: string;
  name: string;
  description: string;
  config: AiRuntimeConfig;
};

export const AI_CONFIG_PRESETS: AiConfigPreset[] = [
  {
    id: "mock",
    name: "Mock",
    description: "本地模拟结果，不需要密钥，适合开发和自动测试。",
    config: {
      mode: "mock",
      label: "Mock",
    },
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "OpenAI 官方接口，默认使用 Responses API。",
    config: {
      mode: "openai-compatible",
      label: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-5.2",
      apiStyle: "responses",
    },
  },
  {
    id: "google",
    name: "Google Gemini",
    description: "Google Gemini 的 OpenAI 兼容入口，模型名可按自己的账号可用模型调整。",
    config: {
      mode: "openai-compatible",
      label: "Google Gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      model: "gemini-2.5-flash",
      apiStyle: "chat-completions",
    },
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek 官方 OpenAI 兼容接口，适合使用 DeepSeek API Key。",
    config: {
      mode: "openai-compatible",
      label: "DeepSeek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      apiStyle: "chat-completions",
    },
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "本地 Ollama 服务，默认端口 11434，不需要真实云端密钥。",
    config: {
      mode: "openai-compatible",
      label: "Ollama",
      baseUrl: "http://localhost:11434/v1",
      model: "llama3.2",
      apiKey: "ollama",
      apiStyle: "chat-completions",
    },
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    description: "本地 LM Studio OpenAI 兼容服务，默认端口 1234。",
    config: {
      mode: "openai-compatible",
      label: "LM Studio",
      baseUrl: "http://localhost:1234/v1",
      model: "local-model",
      apiStyle: "chat-completions",
    },
  },
];

export function getDefaultAiConfig(): AiRuntimeConfig {
  return AI_CONFIG_PRESETS[0].config;
}

export function readStoredAiConfig(): AiRuntimeConfig {
  if (typeof window === "undefined") {
    return getDefaultAiConfig();
  }

  const raw = window.localStorage.getItem(AI_CONFIG_STORAGE_KEY);

  if (!raw) {
    return getDefaultAiConfig();
  }

  try {
    const parsed = JSON.parse(raw) as AiRuntimeConfig;
    return parsed.mode ? parsed : getDefaultAiConfig();
  } catch {
    return getDefaultAiConfig();
  }
}

export function writeStoredAiConfig(config: AiRuntimeConfig) {
  window.localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("knowledge-hub:ai-config-change", { detail: config }));
}
