import { EmptyState } from "@/components/ui/empty-state";
import { FilterRail } from "@/components/ui/filter-rail";
import { ModulePanel } from "@/components/ui/module-panel";
import { PageHeader } from "@/components/ui/page-header";
import { SearchForm } from "@/components/ui/search-form";
import { TaskCard } from "@/components/tasks/task-card";
import { buildQueryPath, readSearchParam, type PageSearchParams } from "@/lib/search-params";
import { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { listProjects, listTags, listTasks } from "@/lib/api/services";
import Link from "next/link";

export const dynamic = "force-dynamic";

type TasksPageProps = {
  searchParams: PageSearchParams;
};

function normalizeStatus(status: string | undefined): TaskStatus | undefined {
  if (status === TaskStatus.OPEN || status === TaskStatus.DONE) {
    return status;
  }

  return undefined;
}

function normalizePriority(priority: string | undefined): TaskPriority | undefined {
  if (priority === TaskPriority.LOW || priority === TaskPriority.MEDIUM || priority === TaskPriority.HIGH) {
    return priority;
  }

  return undefined;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const query = readSearchParam(params, "q");
  const tagId = readSearchParam(params, "tag");
  const projectId = readSearchParam(params, "project");
  const status = normalizeStatus(readSearchParam(params, "status"));
  const priority = normalizePriority(readSearchParam(params, "priority"));
  const overdue = readSearchParam(params, "overdue") === "true";
  const [tasks, tags, projects] = await Promise.all([
    listTasks({ query, tagId, status, priority, overdue, projectId }),
    listTags(),
    listProjects(),
  ]);

  const statusFilters = [
    { label: "全部", href: buildQueryPath("/tasks", { q: query, tag: tagId, project: projectId, priority, overdue: overdue ? "true" : undefined }), active: !status },
    {
      label: "未完成",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, project: projectId, priority, overdue: overdue ? "true" : undefined, status: TaskStatus.OPEN }),
      active: status === TaskStatus.OPEN,
    },
    {
      label: "已完成",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, project: projectId, priority, overdue: overdue ? "true" : undefined, status: TaskStatus.DONE }),
      active: status === TaskStatus.DONE,
    },
  ];

  const priorityFilters = [
    {
      label: "全部优先级",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status, project: projectId, overdue: overdue ? "true" : undefined }),
      active: !priority,
    },
    ...[TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW].map((item) => ({
      label: item,
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status, project: projectId, overdue: overdue ? "true" : undefined, priority: item }),
      active: priority === item,
    })),
  ];

  const dueFilters = [
    {
      label: "全部截止日期",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status, project: projectId, priority }),
      active: !overdue,
    },
    {
      label: "已逾期",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status: TaskStatus.OPEN, project: projectId, priority, overdue: "true" }),
      active: overdue,
    },
  ];

  const projectFilters = [
    {
      label: "全部项目",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status, priority, overdue: overdue ? "true" : undefined }),
      active: !projectId,
    },
    ...projects.map((project) => ({
      label: `${project.name} (${project.openTaskCount}/${project.taskCount})`,
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status, priority, overdue: overdue ? "true" : undefined, project: project.id }),
      active: projectId === project.id,
    })),
  ];

  const tagFilters = [
    {
      label: "全部标签",
      href: buildQueryPath("/tasks", { q: query, status, priority, overdue: overdue ? "true" : undefined, project: projectId }),
      active: !tagId,
    },
    ...tags.map((tag) => ({
      label: tag.name,
      href: buildQueryPath("/tasks", { q: query, tag: tag.id, status, priority, overdue: overdue ? "true" : undefined, project: projectId }),
      active: tagId === tag.id,
    })),
  ];

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Tasks"
        title="任务"
        description="任务列表已切换到 PostgreSQL 数据源，并支持标题搜索、状态筛选和标签筛选。"
      />

      <SearchForm
        action="/tasks"
        placeholder="搜索任务标题"
        defaultQuery={query}
        hiddenFields={{ tag: tagId, status, priority, overdue: overdue ? "true" : undefined, project: projectId }}
      />

      <Link
        href="/tasks/new"
        className="inline-flex rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-black text-surface shadow-panel"
      >
        新建任务
      </Link>

      <div className="space-y-3">
        <FilterRail label="PROJECT" items={projectFilters} />
        <FilterRail label="STATUS" items={statusFilters} />
        <FilterRail label="PRIORITY" items={priorityFilters} />
        <FilterRail label="DUE" items={dueFilters} />
        <FilterRail label="TAG" items={tagFilters} />
      </div>

      <ModulePanel
        code="TASK-SPEC"
        title="任务页当前能力"
        items={["任务必须归属到项目，避免行动项散落在全局列表。", "任务支持优先级、截止日期和逾期筛选，便于先处理最紧急事项。", "项目、状态、优先级、逾期、标签和关键词可以组合筛选。"]}
      />

      {tasks.length > 0 ? (
        <section className="grid gap-3" aria-label="任务列表">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="没有匹配的任务"
          description="换一个关键词，或清除状态和标签筛选后再试。"
          actionLabel="清除筛选"
          actionHref="/tasks"
        />
      )}
    </main>
  );
}
