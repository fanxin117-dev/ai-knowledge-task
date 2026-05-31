import { TagForm } from "@/components/tags/tag-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewTagPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="New Tag"
        title="新建标签"
        description="创建标签会调用 /api/tags，标签名保持唯一，颜色用于列表和筛选显示。"
      />

      <TagForm mode="create" />
    </main>
  );
}
