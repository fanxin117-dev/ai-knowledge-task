import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "AI_PROVIDER_ERROR"
  | "INTERNAL_ERROR";

export type ApiErrorPayload = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, string>;
  };
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: Record<string, string>;

  constructor(input: {
    code: ApiErrorCode;
    message: string;
    status: number;
    details?: Record<string, string>;
  }) {
    super(input.message);
    this.name = "AppError";
    this.code = input.code;
    this.status = input.status;
    this.details = input.details;
  }
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json<ApiErrorPayload>(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 表示唯一约束冲突，最常见于重复创建同名标签。
    if (error.code === "P2002") {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: {
            code: "CONFLICT",
            message: "数据已存在，请检查唯一字段。",
          },
        },
        { status: 409 },
      );
    }

    // P2025 表示更新或删除目标不存在，把它统一转换成 404，避免泄漏 Prisma 内部错误细节。
    if (error.code === "P2025") {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: {
            code: "NOT_FOUND",
            message: "请求的数据不存在。",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiErrorPayload>(
      {
        error: {
          code: "DATABASE_ERROR",
          message: "数据库操作失败。",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiErrorPayload>(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "服务器处理请求失败。",
      },
    },
    { status: 500 },
  );
}

export function notFound(message: string) {
  return new AppError({
    code: "NOT_FOUND",
    message,
    status: 404,
  });
}
