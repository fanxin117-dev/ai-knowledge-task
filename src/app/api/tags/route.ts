import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { createTag, listTags } from "@/lib/api/services";
import { parseTagInput } from "@/lib/api/validation";

export async function GET() {
  try {
    const tags = await listTags();

    return NextResponse.json({ data: tags });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = parseTagInput(await readJsonBody(request));
    const tag = await createTag(input);

    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
