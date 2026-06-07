import { prisma } from "@/lib/prisma";
import { AppError, notFound } from "@/lib/api/error";
import type { ActionItemInput, NoteInput, ProjectInput, TagInput, TaskInput } from "@/lib/api/validation";
import { AiResultType, TaskPriority, TaskStatus } from "@/generated/prisma/enums";

const noteInclude = {
  noteTags: {
    include: {
      tag: true,
    },
  },
  aiResults: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
};

const taskInclude = {
  taskTags: {
    include: {
      tag: true,
    },
  },
  project: true,
  sourceNote: true,
};

const DEFAULT_PROJECT_ID = "project-inbox";
const DEFAULT_PROJECT_NAME = "收件箱";
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

function containsInsensitive(value: string) {
  return {
    contains: value,
    mode: "insensitive" as const,
  };
}

function serializeTag(tag: { id: string; name: string; color: string; createdAt: Date }) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
  };
}

async function ensureTagsExist(tagIds: string[]) {
  if (tagIds.length === 0) {
    return;
  }

  const count = await prisma.tag.count({
    where: {
      id: {
        in: tagIds,
      },
    },
  });

  if (count !== tagIds.length) {
    // 关联不存在的 tagId 会让用户误以为数据保存成功；这里提前返回明确错误。
    throw notFound("部分标签不存在。");
  }
}

async function ensureNoteExists(noteId: string | null) {
  if (!noteId) {
    return;
  }

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true },
  });

  if (!note) {
    throw notFound("来源笔记不存在。");
  }
}

function serializeProject(project: {
  id: string;
  name: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    archivedAt: project.archivedAt?.toISOString() ?? null,
    isArchived: project.archivedAt !== null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

async function ensureDefaultProject() {
  return prisma.project.upsert({
    where: { id: DEFAULT_PROJECT_ID },
    update: {},
    create: {
      id: DEFAULT_PROJECT_ID,
      name: DEFAULT_PROJECT_NAME,
      description: "未归属到具体项目的默认任务集合。",
    },
  });
}

async function ensureProjectExists(projectId: string | null) {
  if (!projectId) {
    return ensureDefaultProject();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw notFound("项目不存在。");
  }

  if (project.archivedAt) {
    throw new AppError({
      code: "CONFLICT",
      message: "项目已归档，不能继续添加任务。请先恢复项目。",
      status: 409,
    });
  }

  return project;
}

function normalizeProjectName(name: string | null | undefined, fallback: string) {
  const value = name?.trim() || fallback.trim() || DEFAULT_PROJECT_NAME;
  return value.slice(0, 80);
}

async function getOrCreateProjectByName(name: string) {
  const project = await prisma.project.findUnique({
    where: { name },
  });

  if (project?.archivedAt) {
    throw new AppError({
      code: "CONFLICT",
      message: "同名项目已归档，不能自动写入任务。请先恢复项目或更换项目名。",
      status: 409,
    });
  }

  if (project) {
    return project;
  }

  return prisma.project.create({
    data: {
      name,
      description: "由 AI 行动项转任务时自动创建。",
    },
  });
}

export function serializeNote(note: Awaited<ReturnType<typeof getNoteByIdOrThrow>>) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    tags: note.noteTags.map((noteTag) => serializeTag(noteTag.tag)),
    aiResults: note.aiResults.map((result) => ({
      id: result.id,
      type: result.type,
      content: result.content,
      createdAt: result.createdAt.toISOString(),
    })),
  };
}

export function serializeTask(task: Awaited<ReturnType<typeof getTaskByIdOrThrow>>) {
  const isOverdue = task.status === TaskStatus.OPEN && task.dueAt !== null && task.dueAt.getTime() < Date.now();

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt?.toISOString() ?? null,
    isOverdue,
    projectId: task.projectId,
    project: serializeProject(task.project),
    sourceNoteId: task.sourceNoteId,
    sourceNote: task.sourceNote
      ? {
          id: task.sourceNote.id,
          title: task.sourceNote.title,
        }
      : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    tags: task.taskTags.map((taskTag) => serializeTag(taskTag.tag)),
  };
}

export async function listNotes(input: { query?: string; tagId?: string }) {
  const query = input.query?.trim();

  const notes = await prisma.note.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { title: containsInsensitive(query) },
                { content: containsInsensitive(query) },
              ],
            }
          : {},
        input.tagId
          ? {
              noteTags: {
                some: {
                  tagId: input.tagId,
                },
              },
            }
          : {},
      ],
    },
    include: noteInclude,
    orderBy: {
      updatedAt: "desc",
    },
  });

  return notes.map(serializeNote);
}

export async function getNoteByIdOrThrow(id: string) {
  const note = await prisma.note.findUnique({
    where: { id },
    include: noteInclude,
  });

  if (!note) {
    throw notFound("笔记不存在。");
  }

  return note;
}

export async function getNote(id: string) {
  return serializeNote(await getNoteByIdOrThrow(id));
}

export async function createNote(input: NoteInput) {
  await ensureTagsExist(input.tagIds);

  const note = await prisma.note.create({
    data: {
      title: input.title,
      content: input.content,
      noteTags: {
        create: input.tagIds.map((tagId) => ({
          tag: {
            connect: { id: tagId },
          },
        })),
      },
    },
    include: noteInclude,
  });

  return serializeNote(note);
}

export async function updateNote(id: string, input: NoteInput) {
  await ensureTagsExist(input.tagIds);
  await getNoteByIdOrThrow(id);

  const note = await prisma.$transaction(async (tx) => {
    // 显式关联表更新最稳妥的方式是先删后建；MVP 阶段标签数量很小，简单可靠比复杂 diff 更合适。
    await tx.noteTag.deleteMany({ where: { noteId: id } });

    return tx.note.update({
      where: { id },
      data: {
        title: input.title,
        content: input.content,
        noteTags: {
          create: input.tagIds.map((tagId) => ({
            tag: {
              connect: { id: tagId },
            },
          })),
        },
      },
      include: noteInclude,
    });
  });

  return serializeNote(note);
}

export async function deleteNote(id: string) {
  await getNoteByIdOrThrow(id);
  await prisma.note.delete({ where: { id } });
}

export async function saveNoteSummary(noteId: string, summary: string) {
  await getNoteByIdOrThrow(noteId);

  const result = await prisma.aiResult.create({
    data: {
      noteId,
      type: AiResultType.SUMMARY,
      content: summary,
    },
  });

  return {
    id: result.id,
    noteId: result.noteId,
    type: result.type,
    content: result.content,
    createdAt: result.createdAt.toISOString(),
  };
}

export async function saveActionItems(noteId: string, items: ActionItemInput[]) {
  await getNoteByIdOrThrow(noteId);

  const result = await prisma.aiResult.create({
    data: {
      noteId,
      type: AiResultType.ACTION_ITEMS,
      content: JSON.stringify(items),
    },
  });

  return {
    id: result.id,
    noteId: result.noteId,
    type: result.type,
    content: result.content,
    createdAt: result.createdAt.toISOString(),
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

  const uniqueItems = [
    ...new Map(input.items.map((item) => [item.title.trim().toLowerCase(), item])).values(),
  ];

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

export async function listProjects(input: { visibility?: "active" | "archived" | "all" } = {}) {
  await ensureDefaultProject();

  const visibility = input.visibility ?? "active";
  const projects = await prisma.project.findMany({
    where:
      visibility === "all"
        ? {}
        : {
            archivedAt: visibility === "archived" ? { not: null } : null,
          },
    include: {
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return projects.map((project) => ({
    ...serializeProject(project),
    taskCount: project.tasks.length,
    openTaskCount: project.tasks.filter((task) => task.status === TaskStatus.OPEN).length,
  }));
}

export async function getProjectByIdOrThrow(id: string) {
  await ensureDefaultProject();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        include: taskInclude,
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!project) {
    throw notFound("项目不存在。");
  }

  return project;
}

export async function getProject(id: string) {
  const project = await getProjectByIdOrThrow(id);

  return {
    ...serializeProject(project),
    taskCount: project.tasks.length,
    openTaskCount: project.tasks.filter((task) => task.status === TaskStatus.OPEN).length,
    tasks: project.tasks.map(serializeTask),
  };
}

export async function createProject(input: ProjectInput) {
  const project = await prisma.project.create({
    data: input,
  });

  return {
    ...serializeProject(project),
    taskCount: 0,
    openTaskCount: 0,
  };
}

export async function updateProject(id: string, input: ProjectInput) {
  await getProjectByIdOrThrow(id);

  const project = await prisma.project.update({
    where: { id },
    data: input,
  });

  return getProject(project.id);
}

export async function setProjectArchived(id: string, archived: boolean) {
  if (id === DEFAULT_PROJECT_ID && archived) {
    throw new AppError({
      code: "CONFLICT",
      message: "收件箱是默认项目，不能归档。",
      status: 409,
    });
  }

  await getProjectByIdOrThrow(id);

  const project = await prisma.project.update({
    where: { id },
    data: {
      archivedAt: archived ? new Date() : null,
    },
  });

  return getProject(project.id);
}

export async function deleteProject(id: string) {
  if (id === DEFAULT_PROJECT_ID) {
    throw new AppError({
      code: "CONFLICT",
      message: "收件箱是默认项目，不能删除。",
      status: 409,
    });
  }

  await getProjectByIdOrThrow(id);

  const taskCount = await prisma.task.count({
    where: { projectId: id },
  });

  if (taskCount > 0) {
    throw new AppError({
      code: "CONFLICT",
      message: "项目下仍有任务，不能直接删除。",
      status: 409,
    });
  }

  await prisma.project.delete({ where: { id } });
}

export async function listTags() {
  const tags = await prisma.tag.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return tags.map(serializeTag);
}

export async function searchKnowledge(input: { query?: string }) {
  const query = input.query?.trim() ?? "";

  if (!query) {
    return {
      query,
      notes: [],
      tasks: [],
      projects: [],
      tags: [],
      totalCount: 0,
    };
  }

  const [notes, tasks, projects, tags] = await Promise.all([
    listNotes({ query }),
    listTasks({ query }),
    listProjects({ visibility: "all" }),
    listTags(),
  ]);

  const lowerQuery = query.toLowerCase();
  const matchedProjects = projects.filter((project) => {
    return project.name.toLowerCase().includes(lowerQuery) || project.description?.toLowerCase().includes(lowerQuery);
  });
  const matchedTags = tags.filter((tag) => tag.name.toLowerCase().includes(lowerQuery));

  return {
    query,
    notes,
    tasks,
    projects: matchedProjects,
    tags: matchedTags,
    totalCount: notes.length + tasks.length + matchedProjects.length + matchedTags.length,
  };
}

export async function getTagByIdOrThrow(id: string) {
  const tag = await prisma.tag.findUnique({
    where: { id },
  });

  if (!tag) {
    throw notFound("标签不存在。");
  }

  return serializeTag(tag);
}

export async function createTag(input: TagInput) {
  const tag = await prisma.tag.create({
    data: input,
  });

  return serializeTag(tag);
}

export async function updateTag(id: string, input: TagInput) {
  await getTagByIdOrThrow(id);

  const tag = await prisma.tag.update({
    where: { id },
    data: input,
  });

  return serializeTag(tag);
}

export async function deleteTag(id: string) {
  await getTagByIdOrThrow(id);

  const relationCount = await prisma.noteTag.count({ where: { tagId: id } });
  const taskRelationCount = await prisma.taskTag.count({ where: { tagId: id } });

  if (relationCount + taskRelationCount > 0) {
    throw new AppError({
      code: "CONFLICT",
      message: "标签正在被笔记或任务使用，不能直接删除。",
      status: 409,
    });
  }

  await prisma.tag.delete({ where: { id } });
}
