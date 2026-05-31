import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { deleteProject, getProject, setProjectArchived, updateProject } from "@/lib/api/services";
import { parseProjectArchiveInput, parseProjectInput } from "@/lib/api/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const project = await getProject(id);

    return NextResponse.json({ data: project });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const project =
      typeof body === "object" && body !== null && "archived" in body
        ? await setProjectArchived(id, parseProjectArchiveInput(body).archived)
        : await updateProject(id, parseProjectInput(body));

    return NextResponse.json({ data: project });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteProject(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
