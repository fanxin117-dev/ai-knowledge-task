import { prisma } from "@/lib/prisma";
import { AppError, notFound } from "@/lib/api/error";
import { AiResultType, TaskPriority, TaskStatus } from "@/generated/prisma/enums";

export const noteInclude = {
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

export const taskInclude = {
  taskTags: {
    include: {
      tag: true,
    },
  },
  project: true,
  sourceNote: true,
};

export const DEFAULT_PROJECT_ID = "project-inbox";
export const DEFAULT_PROJECT_NAME = "收件箱";

type SerializableTag = {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
};

type SerializableProject = {
  id: string;
  name: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type SerializableNote = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  noteTags: Array<{ tag: SerializableTag }>;
  aiResults: Array<{
    id: string;
    type: AiResultType;
    content: string;
    createdAt: Date;
  }>;
};

type SerializableTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date | null;
  projectId: string;
  project: SerializableProject;
  sourceNoteId: string | null;
  sourceNote: { id: string; title: string } | null;
  createdAt: Date;
  updatedAt: Date;
  taskTags: Array<{ tag: SerializableTag }>;
};

export function containsInsensitive(value: string) {
  return {
    contains: value,
    mode: "insensitive" as const,
  };
}

export function serializeTag(tag: SerializableTag) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
  };
}

export function serializeProject(project: SerializableProject) {
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

export function serializeNote(note: SerializableNote) {
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

export function serializeTask(task: SerializableTask) {
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

export async function ensureTagsExist(tagIds: string[]) {
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

export async function ensureNoteExists(noteId: string | null) {
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

export async function ensureDefaultProject() {
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

export async function ensureProjectExists(projectId: string | null) {
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

export function normalizeProjectName(name: string | null | undefined, fallback: string) {
  const value = name?.trim() || fallback.trim() || DEFAULT_PROJECT_NAME;
  return value.slice(0, 80);
}

export async function getOrCreateProjectByName(name: string) {
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
