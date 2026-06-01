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
        // 这组颜色服务于“档案研究舱”方向：纸面底色负责可读性，墨色负责结构，功能色负责稳定表达状态。
        paper: "#f3eddc",
        surface: "#fffaf0",
        ink: "#16130d",
        muted: "#756b5a",
        line: "#2c261b",
        accent: "#d7ff37",
        selected: "#d7ff37",
        success: "#9be15d",
        warning: "#f4b860",
        danger: "#e5484d",
        blueprint: "#2457d6",
        ember: "#ff6b35",
        copper: "#b66a2c",
      },
      boxShadow: {
        // 阴影分级让主框架、普通卡片和小控件不再抢同一个视觉层级。
        panel: "8px 8px 0 rgba(22, 19, 13, 0.16)",
        soft: "4px 4px 0 rgba(22, 19, 13, 0.12)",
        control: "3px 3px 0 rgba(22, 19, 13, 0.14)",
      },
    },
  },
  plugins: [forms],
};

export default config;
