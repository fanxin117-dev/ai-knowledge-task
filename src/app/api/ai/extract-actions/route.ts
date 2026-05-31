import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { getNoteByIdOrThrow, saveActionItems } from "@/lib/api/services";
import { parseNoteIdInput } from "@/lib/api/validation";
import { getAiProvider } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const { noteId, aiConfig } = parseNoteIdInput(await readJsonBody(request));
    const note = await getNoteByIdOrThrow(noteId);
    const provider = getAiProvider(aiConfig);
    const items = await provider.extractActionItems({ title: note.title, content: note.content });
    const result = await saveActionItems(noteId, items);

    return NextResponse.json({ data: { items, result, provider: provider.name } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
