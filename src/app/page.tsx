import { ModulePanel } from "@/components/ui/module-panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { NoteCard } from "@/components/notes/note-card";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskStatus } from "@/generated/prisma/enums";
import { listNotes, listTags, listTasks } from "@/lib/api/services";

export const dynamic = "force-dynamic";

const phaseItems = [
  "PostgreSQL 表结构已经迁移完成，页面数据已经切换到服务端查询。",
  "搜索和筛选通过 URL 查询参数实现，并由 API 与页面共享同一套服务层。",
  "AI provider 已支持 mock 和 OpenAI 两种模式，默认 mock，便于离线开发和测试。",
];

export default async function DashboardPage() {
  const [latestNotes, openTasks, allNotes, allTags] = await Promise.all([
    listNotes({}),
    listTasks({ status: TaskStatus.OPEN }),
    listNotes({}),
    listTags(),
  ]);

  const dashboardStats = [
    { label: "NOTE STACK", value: String(allNotes.length), helper: "来自 PostgreSQL API 数据源" },
    {
      label: "ACTION QUEUE",
      value: String(openTasks.length),
      helper: "当前未完成任务数量",
    },
    { label: "TAG INDEX", value: String(allTags.length), helper: "用于组织知识和行动项" },
  ];

  return (
    <main className="space-y-8">
      <PageHeader
        eyebrow="MVP 第六阶段"
        title="AI Knowledge Task Hub"
        description="当前阶段已经接入 CRUD API、AI provider、核心测试和端到端测试，页面数据来自 PostgreSQL。"
      />

      <section className="grid gap-4 md:grid-cols-3" aria-label="数据概览">
        {dashboardStats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} helper={item.helper} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ModulePanel code="FLOW-01" title="开发节奏" items={phaseItems} />
        {latestNotes.slice(0, 2).map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {openTasks.slice(0, 2).map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </section>
    </main>
  );
}
