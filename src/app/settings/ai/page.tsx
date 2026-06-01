import { AiProviderSettings } from "@/components/ai/ai-provider-settings";
import { ModulePanel } from "@/components/ui/module-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function AiSettingsPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="AI Settings"
        title="AI 接口配置"
        description="按你的实际账号和本地模型情况配置 AI API，不再把服务商和模型固定在代码里。"
      />

      <AiProviderSettings />

      <ModulePanel
        code="AI-CONFIG"
        title="配置原则"
        items={[
          "优先使用 OpenAI-compatible 接口，统一覆盖 OpenAI、DeepSeek、Google Gemini 兼容入口和本地模型服务。",
          "预设只是快速填充模板，baseUrl、model、apiStyle 和 apiKey 都可以手动修改。",
          "自动测试仍固定使用 mock，避免真实接口费用和网络波动影响回归。",
        ]}
      />
    </main>
  );
}
