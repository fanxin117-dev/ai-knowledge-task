import Link from "next/link";

type SidebarNavProps = {
  compact?: boolean;
};

const navItems = [
  { href: "/", label: "工作台", description: "概览和快捷入口", code: "00" },
  { href: "/notes", label: "笔记", description: "知识记录", code: "01" },
  { href: "/projects", label: "项目", description: "任务归属", code: "02" },
  { href: "/tasks", label: "任务", description: "行动管理", code: "03" },
  { href: "/tags", label: "标签", description: "内容组织", code: "04" },
  { href: "/ai", label: "AI 助手", description: "摘要与行动项", code: "05" },
  { href: "/settings/ai", label: "AI 配置", description: "接口和模型", code: "06" },
];

export function SidebarNav({ compact = false }: SidebarNavProps) {
  if (compact) {
    return (
      <nav aria-label="主导航" className="flex gap-2 overflow-x-auto rounded-lg border-2 border-line bg-surface p-2 shadow-panel">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-md border border-line bg-paper px-3 py-2 text-sm font-semibold text-ink hover:bg-accent"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="主导航" className="rounded-lg border-2 border-line bg-surface p-3 shadow-panel">
      <div className="border-b-2 border-line px-3 py-3">
        <p className="font-[var(--font-display)] text-xl font-bold text-ink">Knowledge Hub</p>
        <p className="mt-2 font-[var(--font-mono)] text-xs text-muted">FIELD DESK / MVP-01</p>
      </div>

      <div className="mt-3 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group grid grid-cols-[2.25rem_1fr] gap-3 rounded-md border border-transparent px-3 py-3 hover:border-line hover:bg-accent"
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
