import { EmptyState } from "@/components/ui/empty-state";
import { ModulePanel } from "@/components/ui/module-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function AiPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="AI 服务"
        title="AI 助手"
        description="摘要生成、行动项提取和行动项转任务已经统一走 AI 服务，可按需要在本地模拟和 OpenAI 之间切换。"
      />

      <ModulePanel
        code="AI 说明"
        title="AI 接入原则"
        items={["默认使用本地模拟服务，保证流程可测试且不依赖密钥。", "OpenAI 服务使用响应接口和结构化数据输出，减少解析不确定性。", "AI 输出会保存为结构化结果，避免只停留在界面文本。"]}
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
