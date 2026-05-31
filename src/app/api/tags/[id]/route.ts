import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { deleteTag, getTagByIdOrThrow, updateTag } from "@/lib/api/services";
import { parseTagInput } from "@/lib/api/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const tag = await getTagByIdOrThrow(id);

    return NextResponse.json({ data: tag });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = parseTagInput(await readJsonBody(request));
    const tag = await updateTag(id, input);

    return NextResponse.json({ data: tag });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteTag(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
