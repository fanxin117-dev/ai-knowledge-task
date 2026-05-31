import { notFound } from "next/navigation";
import { TagForm } from "@/components/tags/tag-form";
import { DeleteButton } from "@/components/ui/delete-button";
import { PageHeader } from "@/components/ui/page-header";
import { getTagByIdOrThrow } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type EditTagPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTagPage({ params }: EditTagPageProps) {
  const { id } = await params;
  const tag = await getTagByIdOrThrow(id).catch(() => null);

  if (!tag) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Edit Tag"
        title="编辑标签"
        description="保存会调用 /api/tags/:id；已关联内容不会丢失，只会更新标签显示信息。"
      />

      <TagForm mode="edit" initialTag={{ id: tag.id, name: tag.name, color: tag.color }} />

      <DeleteButton endpoint={`/api/tags/${tag.id}`} redirectTo="/tags" label={tag.name} />
    </main>
  );
}
