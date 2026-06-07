import { AiProviderSettings } from "@/components/ai/ai-provider-settings";
import { ModulePanel } from "@/components/ui/module-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function AiSettingsPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="AI 设置"
        title="AI 接口配置"
        description="按你的实际账号和本地模型情况配置 AI 接口，不再把服务商和模型固定在代码里。"
      />

      <AiProviderSettings />

      <ModulePanel
        code="AI 配置"
        title="配置原则"
        items={[
          "优先使用兼容 OpenAI 的接口，统一覆盖 OpenAI、DeepSeek、Google Gemini 兼容入口和本地模型服务。",
          "预设只是快速填充模板，接口地址、模型名称、接口风格和接口密钥都可以手动修改。",
          "自动测试仍固定使用本地模拟服务，避免真实接口费用和网络波动影响回归。",
        ]}
      />
    </main>
  );
}
