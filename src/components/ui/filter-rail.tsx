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
  return (
    <nav className="flex flex-wrap gap-2" aria-label={label}>
      <span className="mr-1 self-center font-[var(--font-mono)] text-xs font-bold text-muted">
        {label}
      </span>
      {items.map((item) => (
        <Link
          key={item.href + item.label}
          href={item.href}
          className={[
            "rounded-md border-2 border-line px-3 py-1.5 text-sm font-bold shadow-panel",
            item.active ? "bg-accent text-ink" : "bg-surface text-muted hover:bg-paper hover:text-ink",
          ].join(" ")}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
