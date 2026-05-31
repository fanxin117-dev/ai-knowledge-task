import { ProjectForm } from "@/components/projects/project-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewProjectPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="New Project"
        title="新建项目"
        description="项目用于承载一组任务，适合按学习主题、产品功能或工作流拆分。"
      />

      <ProjectForm mode="create" />
    </main>
  );
}
