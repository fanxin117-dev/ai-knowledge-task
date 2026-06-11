import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    // 只扫描实际源代码目录，避免 Tailwind 生成无用样式。
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f8fafc",
        surface: "#ffffff",
        ink: "#0f172a",
        muted: "#64748b",
        line: "#e2e8f0",
        accent: "#e0f2fe",
        selected: "#dbeafe",
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
        blueprint: "#2563eb",
        ember: "#f97316",
        copper: "#475569",
      },
      boxShadow: {
        panel: "0 16px 40px rgba(15, 23, 42, 0.08)",
        soft: "0 8px 24px rgba(15, 23, 42, 0.06)",
        control: "0 1px 2px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [forms],
};

export default config;
