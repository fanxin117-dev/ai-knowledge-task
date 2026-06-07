import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // .next 和 next-env.d.ts 都是 Next.js 生成文件，不应该参与人工源码 lint。
    // 忽略生成物可以让 lint 结果只反映项目真实源代码质量。
    ignores: [".next/**", ".next-e2e/**", "node_modules/**", "next-env.d.ts", "src/generated/prisma/**"],
  },
  // 复用 Next.js 官方规则，覆盖 React、App Router、性能和 TypeScript 常见问题。
  // 这样后续新增页面或组件时，lint 会提前暴露不符合框架约定的代码。
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
