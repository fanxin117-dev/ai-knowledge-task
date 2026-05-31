import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // 数据库连接串是服务端访问 PostgreSQL 的必要配置；这里主动失败，比让底层驱动报模糊错误更容易排查。
    throw new Error("DATABASE_URL is required to initialize Prisma Client.");
  }

  return new PrismaClient({
    // Prisma 7 的客户端不再隐式绑定数据库驱动，PostgreSQL 需要显式传入 PrismaPg 适配器。
    adapter: new PrismaPg({ connectionString }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  // Next.js 开发模式会频繁热更新模块；把 Prisma Client 缓存在 globalThis 上可以避免连接池被重复创建。
  globalForPrisma.prisma = prisma;
}
