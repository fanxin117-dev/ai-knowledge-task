import { AiResultType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { ActionItemInput, NoteInput } from "@/lib/api/validation";
import { notFound } from "@/lib/api/error";
import { containsInsensitive, ensureTagsExist, noteInclude, serializeNote } from "@/lib/api/service/shared";

export async function listNotes(input: { query?: string; tagId?: string }) {
  const query = input.query?.trim();

  const notes = await prisma.note.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { title: containsInsensitive(query) },
                { content: containsInsensitive(query) },
              ],
            }
          : {},
        input.tagId
          ? {
              noteTags: {
                some: {
                  tagId: input.tagId,
                },
              },
            }
          : {},
      ],
    },
    include: noteInclude,
    orderBy: {
      updatedAt: "desc",
    },
  });

  return notes.map(serializeNote);
}

export async function getNoteByIdOrThrow(id: string) {
  const note = await prisma.note.findUnique({
    where: { id },
    include: noteInclude,
  });

  if (!note) {
    throw notFound("笔记不存在。");
  }

  return note;
}

export async function getNote(id: string) {
  return serializeNote(await getNoteByIdOrThrow(id));
}

export async function createNote(input: NoteInput) {
  await ensureTagsExist(input.tagIds);

  const note = await prisma.note.create({
    data: {
      title: input.title,
      content: input.content,
      noteTags: {
        create: input.tagIds.map((tagId) => ({
          tag: {
            connect: { id: tagId },
          },
        })),
      },
    },
    include: noteInclude,
  });

  return serializeNote(note);
}

export async function updateNote(id: string, input: NoteInput) {
  await ensureTagsExist(input.tagIds);
  await getNoteByIdOrThrow(id);

  const note = await prisma.$transaction(async (tx) => {
    // 显式关联表更新最稳妥的方式是先删后建；MVP 阶段标签数量很小，简单可靠比复杂 diff 更合适。
    await tx.noteTag.deleteMany({ where: { noteId: id } });

    return tx.note.update({
      where: { id },
      data: {
        title: input.title,
        content: input.content,
        noteTags: {
          create: input.tagIds.map((tagId) => ({
            tag: {
              connect: { id: tagId },
            },
          })),
        },
      },
      include: noteInclude,
    });
  });

  return serializeNote(note);
}

export async function deleteNote(id: string) {
  await getNoteByIdOrThrow(id);
  await prisma.note.delete({ where: { id } });
}

export async function saveNoteSummary(noteId: string, summary: string) {
  await getNoteByIdOrThrow(noteId);

  const result = await prisma.aiResult.create({
    data: {
      noteId,
      type: AiResultType.SUMMARY,
      content: summary,
    },
  });

  return {
    id: result.id,
    noteId: result.noteId,
    type: result.type,
    content: result.content,
    createdAt: result.createdAt.toISOString(),
  };
}

export async function saveActionItems(noteId: string, items: ActionItemInput[]) {
  await getNoteByIdOrThrow(noteId);

  const result = await prisma.aiResult.create({
    data: {
      noteId,
      type: AiResultType.ACTION_ITEMS,
      content: JSON.stringify(items),
    },
  });

  return {
    id: result.id,
    noteId: result.noteId,
    type: result.type,
    content: result.content,
    createdAt: result.createdAt.toISOString(),
  };
}
