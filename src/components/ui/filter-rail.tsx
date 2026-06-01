import Link from "next/link";

type FilterItem = {
  href: string;
  label: string;
  active?: boolean;
};

type FilterRailProps = {
  label: string;
  items: FilterItem[];
};

export function FilterRail({ label, items }: FilterRailProps) {
  const activeItems = items.filter((item) => item.active);
  const activeLabel = activeItems.length > 0 ? activeItems.map((item) => item.label).join("、") : "全部";
  const linkClassName = (active?: boolean) =>
    [
      "inline-flex min-h-11 items-center rounded-md border-2 border-line px-3 py-2 text-sm font-bold shadow-control",
      active ? "bg-selected text-ink" : "bg-surface text-muted hover:bg-paper hover:text-ink",
    ].join(" ");

  return (
    <>
      <details className="rounded-lg border-2 border-line bg-paper p-3 shadow-soft md:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-bold text-ink">
          <span className="font-[var(--font-mono)] text-xs text-muted">{label}</span>
          <span className="text-sm">{activeLabel}</span>
        </summary>
        <nav className="mt-3 flex flex-wrap gap-2" aria-label={`${label} 移动筛选`}>
          {items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={linkClassName(item.active)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </details>

      <nav className="hidden flex-wrap gap-2 md:flex" aria-label={label}>
        <span className="mr-1 self-center font-[var(--font-mono)] text-xs font-bold text-muted">
          {label}
        </span>
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={linkClassName(item.active)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
