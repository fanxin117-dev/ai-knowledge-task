import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { PageHeader } from "@/components/ui/page-header";
import { getProject } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const project = await getProject(id).catch(() => null);

  if (!project) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Edit Project"
        title="编辑项目"
        description="项目名称会影响任务分组和 AI 行动项转任务时的归属。"
      />

      <ProjectForm mode="edit" initialProject={project} />
    </main>
  );
}
