import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { createProject, listProjects } from "@/lib/api/services";
import { parseProjectInput } from "@/lib/api/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawView = searchParams.get("view");
    const visibility = rawView === "archived" || rawView === "all" ? rawView : "active";
    const projects = await listProjects({ visibility });

    return NextResponse.json({ data: projects });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = parseProjectInput(await readJsonBody(request));
    const project = await createProject(input);

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
