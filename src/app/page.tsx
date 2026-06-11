import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { NoteCard } from "@/components/notes/note-card";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { listNotes, listProjects, listTasks } from "@/lib/api/services";

export const dynamic = "force-dynamic";

type QuickAction = {
  href: string;
  label: string;
  helper: string;
};

function SectionHeading({ eyebrow, title, helper }: { eyebrow: string; title: string; helper: string }) {
  return (
    <div className="grid content-start gap-1">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-slate-950">{title}</h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  );
}

function PrimaryFocus({
  nextTask,
  latestNote,
  overdueCount,
  actions,
}: {
  nextTask: Awaited<ReturnType<typeof listTasks>>[number] | null;
  latestNote: Awaited<ReturnType<typeof listNotes>>[number] | null;
  overdueCount: number;
  actions: QuickAction[];
}) {
  const focusTitle = nextTask?.title ?? latestNote?.title ?? "先建立一个清晰的入口";
  const focusDescription = nextTask
    ? nextTask.description ?? "这项任务是当前最值得推进的下一步。"
    : latestNote
      ? "最近更新的笔记可以继续补充、摘要，或者提取成行动项。"
      : "添加第一条笔记或任务后，工作台会把下一步放到这里。";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm md:p-10">
      <div className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          {overdueCount > 0 ? `${overdueCount} 个逾期任务` : "当前重点"}
        </p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">{focusTitle}</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">{focusDescription}</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className={[
              "inline-flex min-h-11 items-center rounded-md px-4 py-2 text-sm font-semibold",
              index === 0 ? "bg-blue-600 text-white shadow-sm hover:bg-slate-950" : "bg-slate-100 text-slate-950 hover:bg-slate-200",
            ].join(" ")}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MetricStrip({ items }: { items: Array<{ label: string; value: string; helper: string }> }) {
  return (
    <section className="grid gap-6 border-y border-slate-200 py-6 sm:grid-cols-2 xl:grid-cols-4" aria-label="数据概览">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold leading-none text-slate-950">{item.value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{item.helper}</p>
        </div>
      ))}
    </section>
  );
}

function EmptyDashboardPanel({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-dashed border-slate-200 bg-white p-6">
      <h3 className="text-xl font-semibold leading-tight text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <Link
        href={href}
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
      >
        {action}
      </Link>
    </section>
  );
}

export default async function DashboardPage() {
  const [latestNotes, openTasks, overdueTasks, highPriorityTasks, allNotes, projects] = await Promise.all([
    listNotes({}),
    listTasks({ status: TaskStatus.OPEN }),
    listTasks({ overdue: true }),
    listTasks({ status: TaskStatus.OPEN, priority: TaskPriority.HIGH }),
    listNotes({}),
    listProjects(),
  ]);

  const activeProjects = projects.filter((project) => !project.isArchived);
  const nextTask = overdueTasks[0] ?? highPriorityTasks[0] ?? openTasks[0] ?? null;
  const latestNote = latestNotes[0] ?? null;

  const quickActions: QuickAction[] = [
    nextTask
      ? { href: `/tasks/${nextTask.id}`, label: "继续处理任务", helper: nextTask.title }
      : { href: "/tasks/new", label: "创建第一项任务", helper: "把下一步行动写进队列" },
    latestNote
      ? { href: `/notes/${latestNote.id}`, label: "打开最近笔记", helper: latestNote.title }
      : { href: "/notes/new", label: "创建第一条笔记", helper: "记录一个想法、资料或会议结论" },
    { href: "/settings/ai", label: "调整 AI 配置", helper: "配置摘要和行动项生成所用服务" },
  ];

  const dashboardStats = [
    { label: "笔记总数", value: String(allNotes.length), helper: "已经沉淀的知识记录" },
    { label: "待办任务", value: String(openTasks.length), helper: "等待推进的未完成任务" },
    { label: "逾期任务", value: String(overdueTasks.length), helper: "需要优先关注的逾期项" },
    { label: "项目数量", value: String(activeProjects.length), helper: "正在承载任务的项目空间" },
  ];

  return (
    <main className="space-y-10">
      <PageHeader
        title="AI 知识任务工作台"
        description="只把当前真正需要关注的内容放在前面，其余信息保持安静。"
        prominent
      />

      <PrimaryFocus nextTask={nextTask} latestNote={latestNote} overdueCount={overdueTasks.length} actions={quickActions} />

      <MetricStrip items={dashboardStats} />

      <section className="grid gap-10 xl:grid-cols-2">
          <div className="min-w-0 space-y-5">
            <SectionHeading eyebrow="行动队列" title="待处理" helper="只展示最靠前的几项，完整列表留给任务页。" />
            {openTasks.length > 0 ? (
              openTasks.slice(0, 3).map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <EmptyDashboardPanel
                title="暂无待办任务"
                description="把笔记里的下一步转成任务，或者直接创建一条行动项。"
                href="/tasks/new"
                action="新建任务"
              />
            )}
          </div>

          <div className="min-w-0 space-y-5">
            <SectionHeading eyebrow="最近笔记" title="知识线索" helper="最近更新的笔记作为背景，不和当前任务争抢注意力。" />
            {latestNotes.length > 0 ? (
              latestNotes.slice(0, 3).map((note) => <NoteCard key={note.id} note={note} />)
            ) : (
              <EmptyDashboardPanel
                title="暂无笔记"
                description="先记录一段资料、想法或会议纪要，再让 AI 帮你生成摘要和行动项。"
                href="/notes/new"
                action="新建笔记"
              />
            )}
          </div>
      </section>
    </main>
  );
}
