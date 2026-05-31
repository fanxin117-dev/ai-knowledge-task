import { AppError } from "@/lib/api/error";
import { createOpenAiCompatibleProvider, normalizeApiStyle } from "@/lib/ai/configurable-ai-provider";
import { mockAiProvider } from "@/lib/ai/mock-ai-service";
import { createOpenAiProvider } from "@/lib/ai/openai-ai-provider";
import type { AiProvider, AiRuntimeConfig } from "@/lib/ai/types";

const SUPPORTED_AI_PROVIDERS = ["mock", "openai"] as const;

type SupportedAiProvider = (typeof SUPPORTED_AI_PROVIDERS)[number];

function normalizeProviderName(value: string | undefined): SupportedAiProvider {
  const provider = (value ?? "mock").trim().toLowerCase();

  if (SUPPORTED_AI_PROVIDERS.includes(provider as SupportedAiProvider)) {
    return provider as SupportedAiProvider;
  }

  throw new AppError({
    code: "AI_PROVIDER_ERROR",
    status: 500,
    message: `不支持的 AI_PROVIDER：${value}。请改为 mock 或 openai。`,
  });
}

export function getAiProvider(config?: AiRuntimeConfig | null): AiProvider {
  if (config?.mode === "mock") {
    return mockAiProvider;
  }

  if (config?.mode === "openai-compatible") {
    return createOpenAiCompatibleProvider({
      label: config.label,
      baseUrl: config.baseUrl ?? "",
      apiKey: config.apiKey,
      model: config.model ?? "",
      apiStyle: normalizeApiStyle(config.apiStyle),
    });
  }

  const provider = normalizeProviderName(process.env.AI_PROVIDER);

  if (provider === "mock") {
    return mockAiProvider;
  }

  return createOpenAiProvider();
}
