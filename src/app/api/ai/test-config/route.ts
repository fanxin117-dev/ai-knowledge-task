import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error";
import { readJsonBody } from "@/lib/api/request";
import { parseAiConfigOnlyInput } from "@/lib/api/validation";
import { getAiProvider } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const { aiConfig } = parseAiConfigOnlyInput(await readJsonBody(request));
    const provider = getAiProvider(aiConfig);
    const summary = await provider.summarizeNote({
      title: "AI 连接测试",
      content: "请返回一个简短 JSON 摘要，用于验证当前 AI provider 配置是否可用。",
    });

    return NextResponse.json({
      data: {
        provider: provider.name,
        summary,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
