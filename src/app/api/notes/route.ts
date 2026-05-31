import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { createNote, listNotes } from "@/lib/api/services";
import { parseNoteInput } from "@/lib/api/validation";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const notes = await listNotes({
      query: url.searchParams.get("q") ?? undefined,
      tagId: url.searchParams.get("tag") ?? undefined,
    });

    return NextResponse.json({ data: notes });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = parseNoteInput(await readJsonBody(request));
    const note = await createNote(input);

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
