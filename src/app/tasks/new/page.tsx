import { TaskForm } from "@/components/tasks/task-form";
import { PageHeader } from "@/components/ui/page-header";
import { listNotes, listProjects, listTags } from "@/lib/api/services";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const [tags, notes, projects] = await Promise.all([listTags(), listNotes({}), listProjects()]);

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="New Task"
        title="新建任务"
        description="创建任务会调用 /api/tasks，并可选关联来源笔记和标签。"
      />

      <TaskForm
        mode="create"
        tags={tags.map(({ id, name, color }) => ({ id, name, color }))}
        notes={notes.map(({ id, title }) => ({ id, title }))}
        projects={projects.map(({ id, name }) => ({ id, name }))}
      />
    </main>
  );
}
