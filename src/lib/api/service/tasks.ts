import { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { ActionItemInput, TaskInput } from "@/lib/api/validation";
import { notFound } from "@/lib/api/error";
import {
  containsInsensitive,
  ensureNoteExists,
  ensureProjectExists,
  ensureTagsExist,
  getOrCreateProjectByName,
  normalizeProjectName,
  serializeTask,
  taskInclude,
} from "@/lib/api/service/shared";
import { getNoteByIdOrThrow } from "@/lib/api/service/notes";

export type TaskDueScope = "overdue" | "today" | "week";

function startOfUtcDay(date: Date) {
  // 任务表单把日期保存为 UTC 零点；筛选也按 UTC 日边界计算，避免本地时区把“今天截止”的任务提前算成逾期。
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function buildDueScopeWhere(scope: TaskDueScope | undefined) {
  if (!scope) {
    return {};
  }

  const todayStart = startOfUtcDay(new Date());

  if (scope === "overdue") {
    return {
      status: TaskStatus.OPEN,
      dueAt: {
        lt: todayStart,
      },
    };
  }

  const upperBound = scope === "today" ? addUtcDays(todayStart, 1) : addUtcDays(todayStart, 7);

  return {
    status: TaskStatus.OPEN,
    dueAt: {
      gte: todayStart,
      lt: upperBound,
    },
  };
}

export async function listTasks(input: {
  query?: string;
  tagId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  overdue?: boolean;
  due?: TaskDueScope;
  projectId?: string;
}) {
  const query = input.query?.trim();
  const dueScope = input.due ?? (input.overdue ? "overdue" : undefined);

  const tasks = await prisma.task.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { title: containsInsensitive(query) },
                { description: containsInsensitive(query) },
                {
                  sourceNote: {
                    title: containsInsensitive(query),
                  },
                },
                {
                  project: {
                    name: containsInsensitive(query),
                  },
                },
              ],
            }
          : {},
        input.status ? { status: input.status } : {},
        input.priority ? { priority: input.priority } : {},
        buildDueScopeWhere(dueScope),
        input.projectId ? { projectId: input.projectId } : {},
        input.tagId
          ? {
              taskTags: {
                some: {
                  tagId: input.tagId,
                },
              },
            }
          : {},
      ],
    },
    include: taskInclude,
    orderBy: {
      updatedAt: "desc",
    },
  });

  return tasks.map(serializeTask);
}

export async function getTaskByIdOrThrow(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: taskInclude,
  });

  if (!task) {
    throw notFound("任务不存在。");
  }

  return task;
}

export async function getTask(id: string) {
  return serializeTask(await getTaskByIdOrThrow(id));
}

export async function createTask(input: TaskInput) {
  await ensureTagsExist(input.tagIds);
  const project = await ensureProjectExists(input.projectId);
  await ensureNoteExists(input.sourceNoteId);

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueAt: input.dueAt,
      projectId: project.id,
      sourceNoteId: input.sourceNoteId,
      taskTags: {
        create: input.tagIds.map((tagId) => ({
          tag: {
            connect: { id: tagId },
          },
        })),
      },
    },
    include: taskInclude,
  });

  return serializeTask(task);
}

export async function updateTask(id: string, input: TaskInput) {
  await ensureTagsExist(input.tagIds);
  const project = await ensureProjectExists(input.projectId);
  await ensureNoteExists(input.sourceNoteId);
  await getTaskByIdOrThrow(id);

  const task = await prisma.$transaction(async (tx) => {
    await tx.taskTag.deleteMany({ where: { taskId: id } });

    return tx.task.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueAt: input.dueAt,
        projectId: project.id,
        sourceNoteId: input.sourceNoteId,
        taskTags: {
          create: input.tagIds.map((tagId) => ({
            tag: {
              connect: { id: tagId },
            },
          })),
        },
      },
      include: taskInclude,
    });
  });

  return serializeTask(task);
}

export async function deleteTask(id: string) {
  await getTaskByIdOrThrow(id);
  await prisma.task.delete({ where: { id } });
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  await getTaskByIdOrThrow(id);

  const task = await prisma.task.update({
    where: { id },
    data: { status },
    include: taskInclude,
  });

  return serializeTask(task);
}

export async function createTasksFromActions(input: {
  noteId: string;
  projectId: string | null;
  projectName: string | null;
  items: ActionItemInput[];
}) {
  const note = await getNoteByIdOrThrow(input.noteId);
  const project = input.projectId
    ? await ensureProjectExists(input.projectId)
    : await getOrCreateProjectByName(normalizeProjectName(input.projectName, note.title));

  const uniqueItems = [...new Map(input.items.map((item) => [item.title.trim().toLowerCase(), item])).values()];

  const tasks = await prisma.$transaction(
    uniqueItems.map((item) =>
      prisma.task.upsert({
        where: {
          projectId_title: {
            projectId: project.id,
            title: item.title,
          },
        },
        update: {
          description: item.description,
          sourceNoteId: input.noteId,
        },
        create: {
          title: item.title,
          description: item.description,
          status: TaskStatus.OPEN,
          priority: TaskPriority.MEDIUM,
          projectId: project.id,
          sourceNoteId: input.noteId,
        },
        include: taskInclude,
      }),
    ),
  );

  return tasks.map(serializeTask);
}
