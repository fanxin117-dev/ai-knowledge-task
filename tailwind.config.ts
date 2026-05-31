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
        // 这组颜色服务于“档案研究舱”方向：纸面底色负责可读性，墨色负责结构，荧光色只用于状态提示。
        paper: "#f3eddc",
        surface: "#fffaf0",
        ink: "#16130d",
        muted: "#756b5a",
        line: "#2c261b",
        accent: "#d7ff37",
        blueprint: "#2457d6",
        ember: "#ff6b35",
        copper: "#b66a2c",
      },
      boxShadow: {
        // 轻微错位阴影让面板像贴在工作台上的纸张，避免普通 SaaS 卡片的漂浮感。
        panel: "8px 8px 0 rgba(22, 19, 13, 0.16)",
      },
    },
  },
  plugins: [forms],
};

export default config;
