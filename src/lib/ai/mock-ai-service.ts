import type { ActionItem, AiNoteInput, AiProvider } from "@/lib/ai/types";

function splitSentences(content: string) {
  return content
    .split(/[。！？!?；;\n]/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function summarizeNote(input: AiNoteInput) {
  const sentences = splitSentences(input.content);
  const core = sentences.slice(0, 2).join("。");

  if (!core) {
    return `《${input.title}》内容较短，暂时没有足够信息生成摘要。`;
  }

  // 本地模拟摘要故意保持确定性：相同输入永远得到相同输出，方便测试和调试。
  return `《${input.title}》摘要：${core}。`;
}

export async function extractActionItems(input: AiNoteInput): Promise<ActionItem[]> {
  const sentences = splitSentences(input.content);
  const actionKeywords = ["需要", "应该", "下一步", "待办事项", "TODO", "完成", "补充", "实现", "验证", "测试"];

  const matched = sentences.filter((sentence) =>
    actionKeywords.some((keyword) => sentence.toLowerCase().includes(keyword.toLowerCase())),
  );

  const source = matched.length > 0 ? matched : sentences.slice(0, 2);

  return source.slice(0, 5).map((sentence, index) => ({
    title: sentence.length > 36 ? `${sentence.slice(0, 36)}...` : sentence,
    description: `来自《${input.title}》的第 ${index + 1} 个本地模拟行动项。`,
  }));
}

export const mockAiProvider: AiProvider = {
  name: "本地模拟",
  summarizeNote,
  extractActionItems,
};
