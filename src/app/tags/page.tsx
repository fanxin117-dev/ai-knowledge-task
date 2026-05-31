import { ModulePanel } from "@/components/ui/module-panel";
import { PageHeader } from "@/components/ui/page-header";
import { TagPill } from "@/components/ui/tag-pill";
import { listTags } from "@/lib/api/services";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await listTags();

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Tags"
        title="标签"
        description="标签索引已切换到 PostgreSQL 数据源，后续会接入创建、关联和删除策略。"
      />

      <ModulePanel
        code="TAG-SPEC"
        title="标签策略"
        items={["标签会同时服务笔记和任务，避免两套分类体系割裂。", "MVP 先支持创建和关联，删除策略后续再定。", "标签名保持唯一，减少筛选时的歧义。"]}
      />

      <Link
        href="/tags/new"
        className="inline-flex rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-panel"
      >
        新建标签
      </Link>

      <section className="rounded-lg border-2 border-line bg-paper p-6 shadow-panel">
        <p className="font-[var(--font-mono)] text-xs font-bold text-muted">TAG INDEX</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between gap-3 rounded-md border-2 border-line bg-surface p-3">
              <TagPill tag={tag} />
              <Link href={`/tags/${tag.id}/edit`} className="text-sm font-black text-blueprint hover:text-ink">
                编辑
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
