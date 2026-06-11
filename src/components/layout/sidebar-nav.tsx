"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarNavProps = {
  compact?: boolean;
};

const navItems = [
  { href: "/", label: "工作台", code: "00" },
  { href: "/search", label: "搜索", code: "01" },
  { href: "/notes", label: "笔记", code: "02" },
  { href: "/projects", label: "项目", code: "03" },
  { href: "/tasks", label: "任务", code: "04" },
  { href: "/tags", label: "标签", code: "05" },
  { href: "/settings/ai", label: "AI 配置", code: "06" },
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
          className="flex max-w-full snap-x gap-2 overflow-x-auto overscroll-x-contain pr-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
        {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={[
                "flex min-h-11 shrink-0 snap-start items-center rounded-md px-3 py-2 text-sm font-semibold",
                isActive(item.href) ? "bg-slate-100 text-blue-700" : "text-slate-500 hover:bg-white hover:text-slate-950",
              ].join(" ")}
            >
              {item.label}
            </Link>
        ))}
        </nav>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-slate-50 to-transparent" aria-hidden />
      </div>
    );
  }

  return (
    <nav aria-label="主导航" className="flex h-full flex-col p-4">
      <div className="px-2 py-3">
        <p className="text-lg font-semibold text-slate-950">知识工作台</p>
      </div>

      <div className="mt-5 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={[
              "group grid min-h-12 grid-cols-[2rem_1fr] gap-3 rounded-md px-3 py-2.5",
              isActive(item.href) ? "bg-slate-100 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
            ].join(" ")}
          >
            <span className="font-[var(--font-mono)] text-xs font-semibold text-slate-400">{item.code}</span>
            <span>
              <span className="block text-sm font-semibold">{item.label}</span>
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
