import { AppError } from "@/lib/api/error";
import { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import type { AiApiStyle, AiRuntimeConfig } from "@/lib/ai/types";

export type NoteInput = {
  title: string;
  content: string;
  tagIds: string[];
};

export type TaskInput = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date | null;
  projectId: string | null;
  sourceNoteId: string | null;
  tagIds: string[];
};

export type TagInput = {
  name: string;
  color: string;
};

export type ProjectInput = {
  name: string;
  description: string | null;
};

export type ProjectArchiveInput = {
  archived: boolean;
};

export type TaskStatusInput = {
  status: TaskStatus;
};

export type ActionItemInput = {
  title: string;
  description: string | null;
};

export type NoteAiInput = {
  noteId: string;
  aiConfig: AiRuntimeConfig | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = readString(value);
  return text.length > 0 ? text : null;
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return false;
}

export function parseAiConfig(value: unknown): AiRuntimeConfig | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!isRecord(value)) {
    throw validationError({ aiConfig: "aiConfig 必须是 JSON 对象。" });
  }

  const mode = readString(value.mode);

  if (!mode || mode === "mock") {
    return { mode: "mock" };
  }

  if (mode !== "openai-compatible") {
    throw validationError({ "aiConfig.mode": "mode 只能是 mock 或 openai-compatible。" });
  }

  const label = readOptionalString(value.label) ?? undefined;
  const baseUrl = readString(value.baseUrl);
  const apiKey = readOptionalString(value.apiKey) ?? undefined;
  const model = readString(value.model);
  const rawApiStyle = readString(value.apiStyle);
  const apiStyle: AiApiStyle = rawApiStyle === "responses" ? "responses" : "chat-completions";
  const details: Record<string, string> = {};

  if (!baseUrl) {
    details["aiConfig.baseUrl"] = "baseUrl 不能为空。";
  } else if (!/^https?:\/\//i.test(baseUrl)) {
    details["aiConfig.baseUrl"] = "baseUrl 必须以 http:// 或 https:// 开头。";
  }

  if (!model) {
    details["aiConfig.model"] = "model 不能为空。";
  }

  if (rawApiStyle && rawApiStyle !== "responses" && rawApiStyle !== "chat-completions") {
    details["aiConfig.apiStyle"] = "apiStyle 只能是 responses 或 chat-completions。";
  }

  if (Object.keys(details).length > 0) {
    throw validationError(details);
  }

  return {
    mode: "openai-compatible",
    label,
    baseUrl,
    apiKey,
    model,
    apiStyle,
  };
}

export function parseAiConfigOnlyInput(body: unknown) {
  if (!isRecord(body)) {
    throw validationError({ body: "请求体必须是 JSON 对象。" });
  }

  const aiConfig = parseAiConfig(body.aiConfig);

  if (!aiConfig) {
    throw validationError({ aiConfig: "aiConfig 不能为空。" });
  }

  return { aiConfig };
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  // 去重可以减少关联表重复写入，也让 API 调用者不必自己处理重复 tagId。
  return [...new Set(value.map(readString).filter(Boolean))];
}

function validationError(details: Record<string, string>) {
  return new AppError({
    code: "VALIDATION_ERROR",
    message: "请求参数不合法。",
    status: 400,
    details,
  });
}

export function parseNoteInput(body: unknown): NoteInput {
  if (!isRecord(body)) {
    throw validationError({ body: "请求体必须是 JSON 对象。" });
  }

  const title = readString(body.title);
  const content = readString(body.content);
  const tagIds = readStringArray(body.tagIds);
  const details: Record<string, string> = {};

  if (!title) {
    details.title = "标题不能为空。";
  }

  if (!content) {
    details.content = "正文不能为空。";
  }

  if (Object.keys(details).length > 0) {
    throw validationError(details);
  }

  return { title, content, tagIds };
}

export function parseTaskInput(body: unknown): TaskInput {
  if (!isRecord(body)) {
    throw validationError({ body: "请求体必须是 JSON 对象。" });
  }

  const title = readString(body.title);
  const description = readOptionalString(body.description);
  const dueAtText = readOptionalString(body.dueAt);
  const projectId = readOptionalString(body.projectId);
  const sourceNoteId = readOptionalString(body.sourceNoteId);
  const tagIds = readStringArray(body.tagIds);
  const rawStatus = readString(body.status);
  const rawPriority = readString(body.priority);
  const status = rawStatus === TaskStatus.DONE ? TaskStatus.DONE : TaskStatus.OPEN;
  const priority =
    rawPriority === TaskPriority.LOW || rawPriority === TaskPriority.HIGH
      ? rawPriority
      : TaskPriority.MEDIUM;
  const dueAt = dueAtText ? new Date(`${dueAtText}T00:00:00.000Z`) : null;
  const details: Record<string, string> = {};

  if (!title) {
    details.title = "标题不能为空。";
  }

  if (rawStatus && rawStatus !== TaskStatus.OPEN && rawStatus !== TaskStatus.DONE) {
    details.status = "状态只能是 OPEN 或 DONE。";
  }

  if (rawPriority && rawPriority !== TaskPriority.LOW && rawPriority !== TaskPriority.MEDIUM && rawPriority !== TaskPriority.HIGH) {
    details.priority = "优先级只能是 LOW、MEDIUM 或 HIGH。";
  }

  if (dueAtText && Number.isNaN(dueAt?.getTime())) {
    details.dueAt = "截止日期格式不正确。";
  }

  if (Object.keys(details).length > 0) {
    throw validationError(details);
  }

  return { title, description, status, priority, dueAt, projectId, sourceNoteId, tagIds };
}

export function parseTagInput(body: unknown): TagInput {
  if (!isRecord(body)) {
    throw validationError({ body: "请求体必须是 JSON 对象。" });
  }

  const name = readString(body.name);
  const color = readString(body.color) || "#d7ff37";
  const details: Record<string, string> = {};

  if (!name) {
    details.name = "标签名不能为空。";
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    details.color = "颜色必须是 6 位十六进制颜色值，例如 #d7ff37。";
  }

  if (Object.keys(details).length > 0) {
    throw validationError(details);
  }

  return { name, color };
}

export function parseProjectInput(body: unknown): ProjectInput {
  if (!isRecord(body)) {
    throw validationError({ body: "请求体必须是 JSON 对象。" });
  }

  const name = readString(body.name);
  const description = readOptionalString(body.description);
  const details: Record<string, string> = {};

  if (!name) {
    details.name = "项目名不能为空。";
  }

  if (name.length > 80) {
    details.name = "项目名不能超过 80 个字符。";
  }

  if (Object.keys(details).length > 0) {
    throw validationError(details);
  }

  return { name, description };
}

export function parseProjectArchiveInput(body: unknown): ProjectArchiveInput {
  if (!isRecord(body)) {
    throw validationError({ body: "请求体必须是 JSON 对象。" });
  }

  if (typeof body.archived !== "boolean") {
    throw validationError({ archived: "archived 必须是布尔值。" });
  }

  return { archived: readBoolean(body.archived) };
}

export function parseTaskStatusInput(body: unknown): TaskStatusInput {
  if (!isRecord(body)) {
    throw validationError({ body: "请求体必须是 JSON 对象。" });
  }

  const rawStatus = readString(body.status);

  if (rawStatus !== TaskStatus.OPEN && rawStatus !== TaskStatus.DONE) {
    throw validationError({ status: "状态只能是 OPEN 或 DONE。" });
  }

  return { status: rawStatus };
}

export function parseNoteIdInput(body: unknown): NoteAiInput {
  if (!isRecord(body)) {
    throw validationError({ body: "请求体必须是 JSON 对象。" });
  }

  const noteId = readString(body.noteId);
  const aiConfig = parseAiConfig(body.aiConfig);

  if (!noteId) {
    throw validationError({ noteId: "noteId 不能为空。" });
  }

  return { noteId, aiConfig };
}

export function parseActionsToTasksInput(body: unknown) {
  if (!isRecord(body)) {
    throw validationError({ body: "请求体必须是 JSON 对象。" });
  }

  const noteId = readString(body.noteId);
  const projectId = readOptionalString(body.projectId);
  const projectName = readOptionalString(body.projectName);
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems
    .filter(isRecord)
    .map((item) => ({
      title: readString(item.title),
      description: readOptionalString(item.description),
    }))
    .filter((item) => item.title.length > 0);

  const details: Record<string, string> = {};

  if (!noteId) {
    details.noteId = "noteId 不能为空。";
  }

  if (items.length === 0) {
    details.items = "至少需要一个行动项。";
  }

  if (Object.keys(details).length > 0) {
    throw validationError(details);
  }

  return { noteId, projectId, projectName, items };
}
