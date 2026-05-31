import { notFound } from "next/navigation";
import { TaskForm } from "@/components/tasks/task-form";
import { PageHeader } from "@/components/ui/page-header";
import { getTask, listNotes, listProjects, listTags } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type EditTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const [task, tags, notes, projects] = await Promise.all([
    getTask(id).catch(() => null),
    listTags(),
    listNotes({}),
    listProjects(),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Edit Task"
        title="编辑任务"
        description="保存会调用 /api/tasks/:id，并同步更新状态、来源笔记和标签关联。"
      />

      <TaskForm
        mode="edit"
        initialTask={task}
        tags={tags.map(({ id: tagId, name, color }) => ({ id: tagId, name, color }))}
        notes={notes.map(({ id: noteId, title }) => ({ id: noteId, title }))}
        projects={projects.map(({ id: projectId, name }) => ({ id: projectId, name }))}
      />
    </main>
  );
}
