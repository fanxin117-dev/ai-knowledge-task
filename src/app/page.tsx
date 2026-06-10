import Link from "next/link";
import { ModulePanel } from "@/components/ui/module-panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
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
    <div className="grid min-h-[6.25rem] content-start gap-2 border-b-2 border-line pb-3">
      <div className="min-w-0">
        <p className="font-[var(--font-mono)] text-xs font-bold text-copper">{eyebrow}</p>
        <h2 className="mt-1 font-[var(--font-display)] text-2xl font-black leading-tight text-ink">{title}</h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-muted">{helper}</p>
    </div>
  );
}

function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section className="min-w-0 rounded-lg border-2 border-line bg-paper p-4 shadow-soft md:p-5">
      <div className="border-b-2 border-line pb-3">
        <p className="font-[var(--font-mono)] text-xs font-bold text-copper">下一步建议</p>
        <h2 className="mt-1 font-[var(--font-display)] text-2xl font-black leading-tight text-ink">下一步</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className={[
              "grid min-h-16 grid-cols-[2rem_1fr] items-center gap-3 rounded-md border-2 border-line px-3 py-3 shadow-control",
              index === 0 ? "bg-ink text-surface hover:bg-blueprint" : "bg-surface text-ink hover:bg-accent",
            ].join(" ")}
          >
            <span className="font-[var(--font-mono)] text-xs font-black">{String(index + 1).padStart(2, "0")}</span>
            <span className="min-w-0">
              <span className="block text-sm font-black">{action.label}</span>
              <span className={["mt-1 block text-xs leading-5", index === 0 ? "text-surface/75" : "text-muted"].join(" ")}>
                {action.helper}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EmptyDashboardPanel({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <section className="min-w-0 rounded-lg border-2 border-line bg-paper p-5 shadow-soft">
      <h3 className="font-[var(--font-display)] text-2xl font-black leading-tight text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex min-h-11 items-center rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-control hover:bg-blueprint"
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

  const focusItems = [
    overdueTasks.length > 0
      ? `${overdueTasks.length} 个任务已经逾期，建议先处理最早更新的一项。`
      : "当前没有逾期任务，行动队列处在可控状态。",
    nextTask
      ? `下一项建议处理：${nextTask.title}。`
      : "还没有未完成任务，可以从笔记中提取行动项或手动创建任务。",
    latestNote
      ? `最近更新的笔记是《${latestNote.title}》，可以继续摘要或提取行动项。`
      : "先创建第一条笔记，让知识库开始沉淀上下文。",
  ];

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
    <main className="space-y-8">
      <PageHeader
        eyebrow="第六阶段"
        title="AI 知识任务工作台"
        description="把笔记、项目、任务和 AI 行动项放在同一个工作台里。打开首页时，先看到下一步该做什么，再进入具体内容。"
        prominent
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="数据概览">
        {dashboardStats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} helper={item.helper} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <ModulePanel code="聚焦" title="今日聚焦" items={focusItems} />
        <QuickActions actions={quickActions} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <SectionHeading eyebrow="行动队列" title="行动队列" helper="优先展示逾期、高优先级或最近更新的未完成任务。" />
          {openTasks.length > 0 ? (
            openTasks.slice(0, 4).map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <EmptyDashboardPanel
              title="暂无待办任务"
              description="把笔记里的下一步转成任务，或者直接创建一条行动项。"
              href="/tasks/new"
              action="新建任务"
            />
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <SectionHeading eyebrow="最近笔记" title="最近笔记" helper="保留最近更新的知识片段，方便继续摘要、补充或提取行动项。" />
          {latestNotes.length > 0 ? (
            latestNotes.slice(0, 4).map((note) => <NoteCard key={note.id} note={note} />)
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
