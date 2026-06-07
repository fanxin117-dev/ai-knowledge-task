"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarNavProps = {
  compact?: boolean;
};

const navItems = [
  { href: "/", label: "工作台", description: "概览和快捷入口", code: "00" },
  { href: "/search", label: "搜索", description: "跨模块检索", code: "01" },
  { href: "/notes", label: "笔记", description: "知识记录", code: "02" },
  { href: "/projects", label: "项目", description: "任务归属", code: "03" },
  { href: "/tasks", label: "任务", description: "行动管理", code: "04" },
  { href: "/tags", label: "标签", description: "内容组织", code: "05" },
  { href: "/ai", label: "AI 助手", description: "摘要与行动项", code: "06" },
  { href: "/settings/ai", label: "AI 配置", description: "接口和模型", code: "07" },
];

export function SidebarNav({ compact = false }: SidebarNavProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (compact) {
    return (
      <div className="relative max-w-full">
        <nav
          aria-label="主导航"
          className="flex max-w-full snap-x gap-2 overflow-x-auto overscroll-x-contain rounded-lg border-2 border-line bg-surface p-2 pr-12 shadow-soft [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
        {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={[
                "flex min-h-11 shrink-0 snap-start items-center rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink shadow-control",
                isActive(item.href) ? "bg-selected" : "bg-paper hover:bg-accent",
              ].join(" ")}
            >
              {item.label}
            </Link>
        ))}
        </nav>
        <div className="pointer-events-none absolute inset-y-1 right-1 w-12 bg-gradient-to-l from-surface to-transparent" aria-hidden />
      </div>
    );
  }

  return (
    <nav aria-label="主导航" className="rounded-lg border-2 border-line bg-surface p-3 shadow-panel">
      <div className="border-b-2 border-line px-3 py-3">
        <p className="font-[var(--font-display)] text-xl font-bold text-ink">知识工作台</p>
        <p className="mt-2 font-[var(--font-mono)] text-xs text-muted">知识任务 / 第一期</p>
      </div>

      <div className="mt-3 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={[
              "group grid min-h-14 grid-cols-[2.25rem_1fr] gap-3 rounded-md border px-3 py-3",
              isActive(item.href) ? "border-line bg-selected" : "border-transparent hover:border-line hover:bg-accent",
            ].join(" ")}
          >
            <span className="font-[var(--font-mono)] text-xs text-copper group-hover:text-ink">{item.code}</span>
            <span>
              <span className="block text-sm font-bold text-ink">{item.label}</span>
              <span className="mt-1 block text-xs text-muted group-hover:text-ink">{item.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
