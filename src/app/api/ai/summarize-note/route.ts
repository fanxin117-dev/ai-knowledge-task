import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { getNoteByIdOrThrow, saveNoteSummary } from "@/lib/api/services";
import { parseNoteIdInput } from "@/lib/api/validation";
import { getAiProvider } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const { noteId, aiConfig } = parseNoteIdInput(await readJsonBody(request));
    const note = await getNoteByIdOrThrow(noteId);
    const provider = getAiProvider(aiConfig);
    const summary = await provider.summarizeNote({ title: note.title, content: note.content });
    const result = await saveNoteSummary(noteId, summary);

    return NextResponse.json({ data: { summary, result, provider: provider.name } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
