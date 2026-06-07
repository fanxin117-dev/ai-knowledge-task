import { NextResponse } from "next/server";
import { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { createTask, listTasks, type TaskDueScope } from "@/lib/api/services";
import { parseTaskInput } from "@/lib/api/validation";

function readTaskStatus(value: string | null) {
  if (value === TaskStatus.OPEN || value === TaskStatus.DONE) {
    return value;
  }

  return undefined;
}

function readTaskPriority(value: string | null) {
  if (value === TaskPriority.LOW || value === TaskPriority.MEDIUM || value === TaskPriority.HIGH) {
    return value;
  }

  return undefined;
}

function readTaskDueScope(value: string | null): TaskDueScope | undefined {
  if (value === "overdue" || value === "today" || value === "week") {
    return value;
  }

  return undefined;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tasks = await listTasks({
      query: url.searchParams.get("q") ?? undefined,
      tagId: url.searchParams.get("tag") ?? undefined,
      status: readTaskStatus(url.searchParams.get("status")),
      priority: readTaskPriority(url.searchParams.get("priority")),
      due: readTaskDueScope(url.searchParams.get("due")),
      overdue: url.searchParams.get("overdue") === "true",
      projectId: url.searchParams.get("project") ?? undefined,
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = parseTaskInput(await readJsonBody(request));
    const task = await createTask(input);

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
