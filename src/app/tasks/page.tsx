import { EmptyState } from "@/components/ui/empty-state";
import { FilterRail } from "@/components/ui/filter-rail";
import { PageHeader } from "@/components/ui/page-header";
import { SearchForm } from "@/components/ui/search-form";
import { TaskCard } from "@/components/tasks/task-card";
import { buildQueryPath, readSearchParam, type PageSearchParams } from "@/lib/search-params";
import { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { listProjects, listTags, listTasks, type TaskDueScope } from "@/lib/api/services";
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

function normalizeDueScope(due: string | undefined, overdue: string | undefined): TaskDueScope | undefined {
  if (due === "overdue" || due === "today" || due === "week") {
    return due;
  }

  return overdue === "true" ? "overdue" : undefined;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const query = readSearchParam(params, "q");
  const tagId = readSearchParam(params, "tag");
  const projectId = readSearchParam(params, "project");
  const status = normalizeStatus(readSearchParam(params, "status"));
  const priority = normalizePriority(readSearchParam(params, "priority"));
  const due = normalizeDueScope(readSearchParam(params, "due"), readSearchParam(params, "overdue"));
  const [tags, projects] = await Promise.all([
    listTags(),
    listProjects(),
  ]);
  const projectFilterOptions = projects.filter((project) => project.taskCount > 0);
  const effectiveProjectId = projectFilterOptions.some((project) => project.id === projectId) ? projectId : undefined;
  const tasks = await listTasks({ query, tagId, status, priority, due, projectId: effectiveProjectId });

  const statusFilters = [
    { label: "全部", href: buildQueryPath("/tasks", { q: query, tag: tagId, project: effectiveProjectId, priority, due }), active: !status },
    {
      label: "未完成",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, project: effectiveProjectId, priority, due, status: TaskStatus.OPEN }),
      active: status === TaskStatus.OPEN,
    },
    {
      label: "已完成",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, project: effectiveProjectId, priority, due, status: TaskStatus.DONE }),
      active: status === TaskStatus.DONE,
    },
  ];

  const priorityFilters = [
    {
      label: "全部",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status, project: effectiveProjectId, due }),
      active: !priority,
    },
    ...[TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW].map((item) => ({
      label: item === TaskPriority.HIGH ? "高" : item === TaskPriority.MEDIUM ? "中" : "低",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status, project: effectiveProjectId, due, priority: item }),
      active: priority === item,
    })),
  ];

  const dueFilters = [
    {
      label: "全部",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status, project: effectiveProjectId, priority }),
      active: !due,
    },
    {
      label: "已逾期",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status: TaskStatus.OPEN, project: effectiveProjectId, priority, due: "overdue" }),
      active: due === "overdue",
    },
    {
      label: "今天",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status: TaskStatus.OPEN, project: effectiveProjectId, priority, due: "today" }),
      active: due === "today",
    },
    {
      label: "未来 7 天",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status: TaskStatus.OPEN, project: effectiveProjectId, priority, due: "week" }),
      active: due === "week",
    },
  ];

  const projectFilters = [
    {
      label: "全部",
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status, priority, due }),
      active: !effectiveProjectId,
    },
    ...projectFilterOptions.map((project) => ({
      label: `${project.name} (${project.openTaskCount}/${project.taskCount})`,
      href: buildQueryPath("/tasks", { q: query, tag: tagId, status, priority, due, project: project.id }),
      active: effectiveProjectId === project.id,
    })),
  ];

  const tagFilters = [
    {
      label: "全部",
      href: buildQueryPath("/tasks", { q: query, status, priority, due, project: effectiveProjectId }),
      active: !tagId,
    },
    ...tags.map((tag) => ({
      label: tag.name,
      href: buildQueryPath("/tasks", { q: query, tag: tag.id, status, priority, due, project: effectiveProjectId }),
      active: tagId === tag.id,
    })),
  ];

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="任务"
        title="任务"
        description="任务列表已切换到 PostgreSQL 数据源，并支持标题搜索、状态筛选和标签筛选。"
        actions={
          <Link
            href="/tasks/new"
            className="inline-flex min-h-10 items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
          >
            新建任务
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[28rem_minmax(0,1fr)]">
        <aside className="space-y-3 xl:sticky xl:top-8 xl:self-start">
          <SearchForm
            action="/tasks"
            placeholder="搜索任务标题"
            defaultQuery={query}
            hiddenFields={{ tag: tagId, status, priority, due, project: effectiveProjectId }}
          />
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <FilterRail label="项目" items={projectFilters} />
            <FilterRail label="状态" items={statusFilters} />
            <FilterRail label="优先级" items={priorityFilters} />
            <FilterRail label="截止日期" items={dueFilters} />
            <FilterRail label="标签" items={tagFilters} />
          </div>
        </aside>

        {tasks.length > 0 ? (
          <section className="grid min-w-0 gap-3 2xl:grid-cols-2" aria-label="任务列表">
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
      </section>
    </main>
  );
}
