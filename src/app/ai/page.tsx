import { EmptyState } from "@/components/ui/empty-state";
import { ModulePanel } from "@/components/ui/module-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function AiPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="AI Provider"
        title="AI 助手"
        description="摘要生成、行动项提取和行动项转任务已经统一走 AI provider，可通过环境变量在 mock 和 OpenAI 之间切换。"
      />

      <ModulePanel
        code="AI-SPEC"
        title="AI 接入原则"
        items={["默认使用 mock provider，保证流程可测试且不依赖密钥。", "OpenAI provider 使用 Responses API 和结构化 JSON 输出，减少解析不确定性。", "AI 输出会保存为结构化结果，避免只停留在界面文本。"]}
      />

      <EmptyState
        title="从笔记详情页使用 AI"
        description="打开任意笔记详情页即可生成摘要、提取行动项，并把行动项保存为任务。"
        actionLabel="查看笔记"
        actionHref="/notes"
      />
    </main>
  );
}
