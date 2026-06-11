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
        eyebrow="标签"
        title="标签"
        description="标签索引已切换到 PostgreSQL 数据源，后续会接入创建、关联和删除策略。"
      />

      <Link
        href="/tags/new"
        className="inline-flex min-h-11 w-fit items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
      >
        新建标签
      </Link>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">标签索引</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <TagPill tag={tag} />
              <Link
                href={`/tags/${tag.id}/edit`}
                className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 hover:text-slate-950"
              >
                编辑
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
