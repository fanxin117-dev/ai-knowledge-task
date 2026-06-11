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
      "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium",
      active ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-950",
    ].join(" ");

  return (
    <>
      <details className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-medium text-slate-950">
          <span className="text-xs text-slate-500">{label}</span>
          <span className="text-sm">{activeLabel}</span>
        </summary>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label={`${label} 移动筛选`}>
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

      <nav className="hidden grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-3 md:grid" aria-label={label}>
        <span className="text-xs font-medium text-slate-500">
          {label}
        </span>
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
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
        </div>
      </nav>
    </>
  );
}
