import { AppError, notFound } from "@/lib/api/error";
import type { TagInput } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";
import { serializeTag } from "@/lib/api/service/shared";

export async function listTags() {
  const tags = await prisma.tag.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return tags.map(serializeTag);
}

export async function getTagByIdOrThrow(id: string) {
  const tag = await prisma.tag.findUnique({
    where: { id },
  });

  if (!tag) {
    throw notFound("标签不存在。");
  }

  return serializeTag(tag);
}

export async function createTag(input: TagInput) {
  const tag = await prisma.tag.create({
    data: input,
  });

  return serializeTag(tag);
}

export async function updateTag(id: string, input: TagInput) {
  await getTagByIdOrThrow(id);

  const tag = await prisma.tag.update({
    where: { id },
    data: input,
  });

  return serializeTag(tag);
}

export async function deleteTag(id: string) {
  await getTagByIdOrThrow(id);

  const relationCount = await prisma.noteTag.count({ where: { tagId: id } });
  const taskRelationCount = await prisma.taskTag.count({ where: { tagId: id } });

  if (relationCount + taskRelationCount > 0) {
    throw new AppError({
      code: "CONFLICT",
      message: "标签正在被笔记或任务使用，不能直接删除。",
      status: 409,
    });
  }

  await prisma.tag.delete({ where: { id } });
}
