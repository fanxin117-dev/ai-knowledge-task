import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DELETE as deleteNote, GET as getNote, PATCH as patchNote } from "../../src/app/api/notes/[id]/route";
import { GET as listNotes, POST as postNote } from "../../src/app/api/notes/route";
import { GET as listProjects, PATCH as patchProject } from "../../src/app/api/projects/[id]/route";
import { GET as listProjectCollection } from "../../src/app/api/projects/route";
import { DELETE as deleteTag } from "../../src/app/api/tags/[id]/route";
import { POST as createTag } from "../../src/app/api/tags/route";
import { DELETE as deleteTask, GET as getTask, PATCH as patchTask } from "../../src/app/api/tasks/[id]/route";
import { GET as listTasks, POST as postTask } from "../../src/app/api/tasks/route";
import { POST as actionsToTasks } from "../../src/app/api/ai/actions-to-tasks/route";
import { POST as extractActions } from "../../src/app/api/ai/extract-actions/route";
import { POST as summarizeNote } from "../../src/app/api/ai/summarize-note/route";
import { prisma } from "../../src/lib/prisma";

const runId = `api-test-${Date.now()}`;
const created = {
  noteIds: [] as string[],
  taskIds: [] as string[],
  tagIds: [] as string[],
};

beforeAll(() => {
  // API 回归测试必须稳定、低成本运行；真实 OpenAI 调用单独由 provider 单元测试和手工验收覆盖。
  process.env.AI_PROVIDER = "mock";
});

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function patchRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function routeContext(id: string) {
  // Next.js 15 的动态路由参数是 Promise；测试里也按真实 route handler 形状传入。
  return {
    params: Promise.resolve({ id }),
  };
}

async function readJson(response: Response) {
  return response.json() as Promise<{
    data?: unknown;
    error?: {
      code: string;
      message: string;
      details?: Record<string, string>;
    };
  }>;
}

afterAll(async () => {
  // 清理顺序必须先任务、再笔记、最后标签；否则标签仍被关联表引用时会触发 409。
  for (const taskId of created.taskIds) {
    await deleteTask(new Request(`http://localhost/api/tasks/${taskId}`), routeContext(taskId));
  }

  for (const noteId of created.noteIds) {
    await deleteNote(new Request(`http://localhost/api/notes/${noteId}`), routeContext(noteId));
  }

  for (const tagId of created.tagIds) {
    await deleteTag(new Request(`http://localhost/api/tags/${tagId}`), routeContext(tagId));
  }

  await prisma.project.deleteMany({
    where: {
      name: {
        contains: runId,
      },
    },
  });
});

describe("核心 CRUD API", () => {
  it("返回统一的输入校验错误", async () => {
    const response = await postNote(jsonRequest("http://localhost/api/notes", { title: "", content: "" }));
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload.error?.code).toBe("VALIDATION_ERROR");
    expect(payload.error?.details?.title).toBe("标题不能为空。");
    expect(payload.error?.details?.content).toBe("正文不能为空。");
  });

  it("AI 配置非法时返回统一校验错误", async () => {
    const response = await summarizeNote(
      jsonRequest("http://localhost/api/ai/summarize-note", {
        noteId: "note-id",
        aiConfig: {
          mode: "openai-compatible",
          baseUrl: "api.example.com",
          model: "",
        },
      }),
    );
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload.error?.code).toBe("VALIDATION_ERROR");
    expect(payload.error?.details?.["aiConfig.baseUrl"]).toBe("baseUrl 必须以 http:// 或 https:// 开头。");
    expect(payload.error?.details?.["aiConfig.model"]).toBe("model 不能为空。");
  });

  it("支持标签、笔记、任务的创建、查询、更新和删除", async () => {
    const tagResponse = await createTag(
      jsonRequest("http://localhost/api/tags", {
        name: `${runId}-工程`,
        color: "#d7ff37",
      }),
    );
    const tagPayload = (await readJson(tagResponse)) as {
      data: { id: string; name: string; color: string };
    };
    created.tagIds.push(tagPayload.data.id);

    expect(tagResponse.status).toBe(201);
    expect(tagPayload.data.name).toBe(`${runId}-工程`);

    const noteResponse = await postNote(
      jsonRequest("http://localhost/api/notes", {
        title: `${runId} 笔记`,
        content: "这是一条用于验证 API 搜索和标签筛选的笔记正文。",
        tagIds: [tagPayload.data.id],
      }),
    );
    const notePayload = (await readJson(noteResponse)) as {
      data: { id: string; title: string; tags: Array<{ id: string }> };
    };
    created.noteIds.push(notePayload.data.id);

    expect(noteResponse.status).toBe(201);
    expect(notePayload.data.tags).toEqual([{ id: tagPayload.data.id, name: tagPayload.data.name, color: "#d7ff37", createdAt: expect.any(String) }]);

    const listNoteResponse = await listNotes(
      new Request(`http://localhost/api/notes?q=${encodeURIComponent(runId)}&tag=${tagPayload.data.id}`),
    );
    const listNotePayload = (await readJson(listNoteResponse)) as {
      data: Array<{ id: string }>;
    };

    expect(listNoteResponse.status).toBe(200);
    expect(listNotePayload.data.some((note) => note.id === notePayload.data.id)).toBe(true);

    const updatedNoteResponse = await patchNote(
      patchRequest(`http://localhost/api/notes/${notePayload.data.id}`, {
        title: `${runId} 笔记更新`,
        content: "更新后的正文仍然保留同一个标签。",
        tagIds: [tagPayload.data.id],
      }),
      routeContext(notePayload.data.id),
    );
    const updatedNotePayload = (await readJson(updatedNoteResponse)) as {
      data: { title: string };
    };

    expect(updatedNoteResponse.status).toBe(200);
    expect(updatedNotePayload.data.title).toBe(`${runId} 笔记更新`);

    const summaryResponse = await summarizeNote(
      jsonRequest("http://localhost/api/ai/summarize-note", {
        noteId: notePayload.data.id,
      }),
    );
    const summaryPayload = (await readJson(summaryResponse)) as {
      data: { summary: string };
    };

    expect(summaryResponse.status).toBe(200);
    expect(summaryPayload.data.summary).toContain(`${runId} 笔记更新`);

    const actionResponse = await extractActions(
      jsonRequest("http://localhost/api/ai/extract-actions", {
        noteId: notePayload.data.id,
      }),
    );
    const actionPayload = (await readJson(actionResponse)) as {
      data: { items: Array<{ title: string; description: string | null }> };
    };

    expect(actionResponse.status).toBe(200);
    expect(actionPayload.data.items.length).toBeGreaterThan(0);

    const actionTaskResponse = await actionsToTasks(
      jsonRequest("http://localhost/api/ai/actions-to-tasks", {
        noteId: notePayload.data.id,
        projectName: `${runId} 项目`,
        items: actionPayload.data.items.slice(0, 1),
      }),
    );
    const actionTaskPayload = (await readJson(actionTaskResponse)) as {
      data: Array<{ id: string; sourceNoteId: string | null; project: { id: string; name: string; isArchived: boolean } }>;
    };

    expect(actionTaskResponse.status).toBe(201);
    expect(actionTaskPayload.data[0]?.sourceNoteId).toBe(notePayload.data.id);
    expect(actionTaskPayload.data[0]?.project.name).toBe(`${runId} 项目`);
    expect(actionTaskPayload.data[0]?.project.isArchived).toBe(false);
    created.taskIds.push(...actionTaskPayload.data.map((task) => task.id));

    const duplicateActionTaskResponse = await actionsToTasks(
      jsonRequest("http://localhost/api/ai/actions-to-tasks", {
        noteId: notePayload.data.id,
        projectName: `${runId} 项目`,
        items: actionPayload.data.items.slice(0, 1),
      }),
    );
    const duplicateActionTaskPayload = (await readJson(duplicateActionTaskResponse)) as {
      data: Array<{ id: string }>;
    };

    expect(duplicateActionTaskResponse.status).toBe(201);
    expect(duplicateActionTaskPayload.data[0]?.id).toBe(actionTaskPayload.data[0]?.id);

    const projectId = actionTaskPayload.data[0]?.project.id ?? "";
    expect(projectId).toBeTruthy();
    const archiveProjectResponse = await patchProject(
      patchRequest(`http://localhost/api/projects/${projectId}`, {
        archived: true,
      }),
      routeContext(projectId),
    );
    const archivedProjectPayload = (await readJson(archiveProjectResponse)) as {
      data: { isArchived: boolean; archivedAt: string | null };
    };

    expect(archiveProjectResponse.status).toBe(200);
    expect(archivedProjectPayload.data.isArchived).toBe(true);
    expect(archivedProjectPayload.data.archivedAt).toEqual(expect.any(String));

    const activeProjectListResponse = await listProjectCollection(new Request("http://localhost/api/projects"));
    const activeProjectListPayload = (await readJson(activeProjectListResponse)) as {
      data: Array<{ id: string }>;
    };

    expect(activeProjectListPayload.data.some((project) => project.id === projectId)).toBe(false);

    const archivedProjectListResponse = await listProjectCollection(
      new Request("http://localhost/api/projects?view=archived"),
    );
    const archivedProjectListPayload = (await readJson(archivedProjectListResponse)) as {
      data: Array<{ id: string }>;
    };

    expect(archivedProjectListPayload.data.some((project) => project.id === projectId)).toBe(true);

    const taskInArchivedProjectResponse = await postTask(
      jsonRequest("http://localhost/api/tasks", {
        title: `${runId} 归档项目任务`,
        description: "归档项目不应继续写入新任务。",
        status: "OPEN",
        projectId,
        tagIds: [tagPayload.data.id],
      }),
    );
    const taskInArchivedProjectPayload = await readJson(taskInArchivedProjectResponse);

    expect(taskInArchivedProjectResponse.status).toBe(409);
    expect(taskInArchivedProjectPayload.error?.code).toBe("CONFLICT");

    const restoreProjectResponse = await patchProject(
      patchRequest(`http://localhost/api/projects/${projectId}`, {
        archived: false,
      }),
      routeContext(projectId),
    );
    const restoredProjectPayload = (await readJson(restoreProjectResponse)) as {
      data: { isArchived: boolean };
    };

    expect(restoreProjectResponse.status).toBe(200);
    expect(restoredProjectPayload.data.isArchived).toBe(false);

    const projectDetailResponse = await listProjects(
      new Request(`http://localhost/api/projects/${projectId}`),
      routeContext(projectId),
    );
    const projectDetailPayload = (await readJson(projectDetailResponse)) as {
      data: { taskCount: number; openTaskCount: number };
    };

    expect(projectDetailResponse.status).toBe(200);
    expect(projectDetailPayload.data.taskCount).toBeGreaterThan(0);

    const taskResponse = await postTask(
      jsonRequest("http://localhost/api/tasks", {
        title: `${runId} 任务`,
        description: "这是一条用于验证任务 CRUD 的任务。",
        status: "OPEN",
        dueAt: "2020-01-01",
        sourceNoteId: notePayload.data.id,
        tagIds: [tagPayload.data.id],
      }),
    );
    const taskPayload = (await readJson(taskResponse)) as {
      data: { id: string; status: string; sourceNote: { id: string } | null };
    };
    created.taskIds.push(taskPayload.data.id);

    expect(taskResponse.status).toBe(201);
    expect(taskPayload.data.status).toBe("OPEN");
    expect(taskPayload.data.sourceNote?.id).toBe(notePayload.data.id);

    const listTaskResponse = await listTasks(
      new Request(`http://localhost/api/tasks?q=${encodeURIComponent(runId)}&status=OPEN&tag=${tagPayload.data.id}`),
    );
    const listTaskPayload = (await readJson(listTaskResponse)) as {
      data: Array<{ id: string }>;
    };

    expect(listTaskResponse.status).toBe(200);
    expect(listTaskPayload.data.some((task) => task.id === taskPayload.data.id)).toBe(true);

    const overdueTaskResponse = await listTasks(
      new Request(`http://localhost/api/tasks?q=${encodeURIComponent(runId)}&due=overdue`),
    );
    const overdueTaskPayload = (await readJson(overdueTaskResponse)) as {
      data: Array<{ id: string }>;
    };

    expect(overdueTaskResponse.status).toBe(200);
    expect(overdueTaskPayload.data.some((task) => task.id === taskPayload.data.id)).toBe(true);

    const updatedTaskResponse = await patchTask(
      patchRequest(`http://localhost/api/tasks/${taskPayload.data.id}`, {
        title: `${runId} 任务更新`,
        description: "任务已完成。",
        status: "DONE",
        sourceNoteId: notePayload.data.id,
        tagIds: [tagPayload.data.id],
      }),
      routeContext(taskPayload.data.id),
    );
    const updatedTaskPayload = (await readJson(updatedTaskResponse)) as {
      data: { status: string };
    };

    expect(updatedTaskResponse.status).toBe(200);
    expect(updatedTaskPayload.data.status).toBe("DONE");

    const usedTagDeleteResponse = await deleteTag(
      new Request(`http://localhost/api/tags/${tagPayload.data.id}`),
      routeContext(tagPayload.data.id),
    );
    const usedTagDeletePayload = await readJson(usedTagDeleteResponse);

    expect(usedTagDeleteResponse.status).toBe(409);
    expect(usedTagDeletePayload.error?.code).toBe("CONFLICT");

    const deleteTaskResponse = await deleteTask(
      new Request(`http://localhost/api/tasks/${taskPayload.data.id}`),
      routeContext(taskPayload.data.id),
    );
    created.taskIds = created.taskIds.filter((id) => id !== taskPayload.data.id);

    expect(deleteTaskResponse.status).toBe(204);

    const deleteNoteResponse = await deleteNote(
      new Request(`http://localhost/api/notes/${notePayload.data.id}`),
      routeContext(notePayload.data.id),
    );
    created.noteIds = created.noteIds.filter((id) => id !== notePayload.data.id);

    expect(deleteNoteResponse.status).toBe(204);

    const deleteTagResponse = await deleteTag(
      new Request(`http://localhost/api/tags/${tagPayload.data.id}`),
      routeContext(tagPayload.data.id),
    );
    created.tagIds = created.tagIds.filter((id) => id !== tagPayload.data.id);

    expect(deleteTagResponse.status).toBe(204);
  });

  it("查询不存在的数据时返回统一 404", async () => {
    const missingNote = await getNote(
      new Request("http://localhost/api/notes/missing-note"),
      routeContext("missing-note"),
    );
    const missingTask = await getTask(
      new Request("http://localhost/api/tasks/missing-task"),
      routeContext("missing-task"),
    );

    expect(missingNote.status).toBe(404);
    expect((await readJson(missingNote)).error?.code).toBe("NOT_FOUND");
    expect(missingTask.status).toBe(404);
    expect((await readJson(missingTask)).error?.code).toBe("NOT_FOUND");
  });
});
