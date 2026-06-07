import { expect, test, type APIRequestContext } from "@playwright/test";

async function deleteCreatedTasks(request: APIRequestContext, runId: string) {
  const response = await request.get(`/api/tasks?q=${encodeURIComponent(runId)}`);

  if (!response.ok()) {
    return;
  }

  const payload = (await response.json()) as {
    data?: Array<{ id: string }>;
  };

  for (const task of payload.data ?? []) {
    await request.delete(`/api/tasks/${task.id}`);
  }
}

async function deleteCreatedNote(request: APIRequestContext, noteId: string | null) {
  if (!noteId) {
    return;
  }

  await request.delete(`/api/notes/${noteId}`);
}

async function deleteCreatedTags(request: APIRequestContext, runId: string) {
  const response = await request.get("/api/tags");

  if (!response.ok()) {
    return;
  }

  const payload = (await response.json()) as {
    data?: Array<{ id: string; name: string }>;
  };

  for (const tag of payload.data ?? []) {
    if (tag.name.includes(runId)) {
      await request.delete(`/api/tags/${tag.id}`);
    }
  }
}

async function deleteCreatedProjects(request: APIRequestContext, runId: string) {
  const response = await request.get("/api/projects?view=all");

  if (!response.ok()) {
    return;
  }

  const payload = (await response.json()) as {
    data?: Array<{ id: string; name: string }>;
  };

  for (const project of payload.data ?? []) {
    if (project.name.includes(runId)) {
      await request.delete(`/api/projects/${project.id}`);
    }
  }
}

test("笔记到 AI 行动项再到任务的主流程可用", async ({ page, request }) => {
  const runId = `e2e-${Date.now()}`;
  const noteTitle = `${runId} Vibe Coding 流程笔记`;
  const noteContent = [
    `待办事项：完成 ${runId} 的端到端测试。`,
    "下一步需要验证摘要生成、行动项提取和任务落库。",
  ].join("\n");
  let noteId: string | null = null;
  let tagId: string | null = null;
  const editedTaskTitle = `${runId} 编辑后的任务`;

  try {
    const tagResponse = await request.post("/api/tags", {
      data: {
        name: `${runId}-回归标签`,
        color: "#2457d6",
      },
    });
    expect(tagResponse.status()).toBe(201);
    const tagPayload = (await tagResponse.json()) as {
      data?: { id: string };
    };
    tagId = tagPayload.data?.id ?? null;

    await page.goto("/notes/new");

    await page.getByLabel("标题").fill(noteTitle);
    await page.getByLabel("正文").fill(noteContent);
    const createNoteResponse = page.waitForResponse(
      (response) => response.url().includes("/api/notes") && response.request().method() === "POST",
      { timeout: 30_000 },
    );
    await page.getByRole("button", { name: "创建笔记" }).click();
    await expect((await createNoteResponse).status()).toBe(201);

    await expect(page.getByRole("heading", { name: noteTitle })).toBeVisible();
    noteId = page.url().split("/notes/")[1]?.split("/")[0] ?? null;
    expect(noteId).toBeTruthy();

    await page.getByRole("button", { name: "生成摘要" }).click();
    await expect(page.getByText("摘要已由 本地模拟 生成并保存。")).toBeVisible();
    await expect(page.getByText(`《${noteTitle}》摘要：`)).toBeVisible();
    await expect(page.getByText(/最近保存/)).toBeVisible();

    await page.getByRole("button", { name: "提取行动项" }).click();
    await expect(page.getByText(/已由 本地模拟 提取并保存 \d+ 个行动项/)).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: `待办事项：完成 ${runId} 的端到端测试` }),
    ).toBeVisible();

    await page.getByRole("button", { name: "行动项转任务" }).click();
    await expect(page.getByText(/已同步 \d+ 个任务到项目/)).toBeVisible();

    await page.reload();
    await expect(page.getByText("已载入最近一次保存的 AI 结果。")).toBeVisible();
    await expect(page.getByText(`《${noteTitle}》摘要：`)).toBeVisible();

    await page.goto(`/tasks?q=${encodeURIComponent(runId)}`);
    const generatedTask = page.locator("article").filter({ hasText: runId }).first();
    await expect(generatedTask).toBeVisible();
    await generatedTask.getByRole("link", { name: "查看详情" }).click();
    await expect(page.getByRole("heading", { name: new RegExp(runId) })).toBeVisible();

    await page.getByRole("link", { name: "编辑任务" }).click();
    await page.getByLabel("标题").fill(editedTaskTitle);
    await page.getByLabel("描述").fill("这条任务用于验证编辑、标签筛选和逾期提示。");
    await page.getByLabel("优先级").selectOption("HIGH");
    await page.getByLabel("截止日期").fill("2020-01-01");
    await page.getByText(`${runId}-回归标签`).click();
    await page.getByRole("button", { name: "保存任务" }).click();
    await expect(page.getByRole("heading", { name: editedTaskTitle })).toBeVisible();
    await expect(page.getByText("优先级：高")).toBeVisible();
    await expect(page.getByText("截止：2020-01-01")).toBeVisible();

    await page.goto(`/tasks?tag=${tagId}`);
    await expect(page.locator("article").filter({ hasText: editedTaskTitle })).toBeVisible();

    await page.goto(`/tasks?overdue=true&q=${encodeURIComponent(runId)}`);
    await expect(page.locator("article").filter({ hasText: editedTaskTitle })).toBeVisible();

    const projectsResponse = await request.get("/api/projects?view=all");
    const projectsPayload = (await projectsResponse.json()) as {
      data?: Array<{ id: string; name: string }>;
    };
    const project = projectsPayload.data?.find((item) => item.name.includes(runId));
    expect(project?.id).toBeTruthy();

    await page.goto(`/projects/${project?.id}`);
    await expect(page.getByLabel("项目任务看板")).toBeVisible();
    await page.getByLabel("排序").selectOption("priority");
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole("button", { name: "批量完成" }).click();
    await expect(page.getByText(/已批量更新 \d+ 个任务/)).toBeVisible();
    await expect(page.getByRole("button", { name: "重新打开" }).first()).toBeVisible();

    await page.goto(`/notes/${noteId}/edit`);
    await page.getByLabel("标题").fill(`${noteTitle} 更新`);
    await page.getByRole("button", { name: "保存笔记" }).click();
    await expect(page.getByRole("heading", { name: `${noteTitle} 更新` })).toBeVisible();
  } finally {
    await deleteCreatedTasks(request, runId);
    await deleteCreatedNote(request, noteId);
    await deleteCreatedProjects(request, runId);
    await deleteCreatedTags(request, runId);
  }
});
