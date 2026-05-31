import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { deleteTask, getTask, updateTask, updateTaskStatus } from "@/lib/api/services";
import { parseTaskInput, parseTaskStatusInput } from "@/lib/api/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const task = await getTask(id);

    return NextResponse.json({ data: task });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const task =
      typeof body === "object" && body !== null && "title" in body
        ? await updateTask(id, parseTaskInput(body))
        : await updateTaskStatus(id, parseTaskStatusInput(body).status);

    return NextResponse.json({ data: task });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteTask(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
