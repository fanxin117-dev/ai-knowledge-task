import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { createTasksFromActions } from "@/lib/api/services";
import { parseActionsToTasksInput } from "@/lib/api/validation";

export async function POST(request: Request) {
  try {
    const { noteId, projectId, projectName, items } = parseActionsToTasksInput(await readJsonBody(request));
    const tasks = await createTasksFromActions({ noteId, projectId, projectName, items });

    return NextResponse.json({ data: tasks }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
