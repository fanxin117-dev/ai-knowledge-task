import { TaskStatus } from "@/generated/prisma/enums";
import { AppError, notFound } from "@/lib/api/error";
import type { ProjectInput } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PROJECT_ID,
  ensureDefaultProject,
  serializeProject,
  serializeTask,
  taskInclude,
} from "@/lib/api/service/shared";

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
