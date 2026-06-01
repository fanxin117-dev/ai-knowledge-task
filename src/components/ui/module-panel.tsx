type ModulePanelProps = {
  code: string;
  title: string;
  items: string[];
};

export function ModulePanel({ code, title, items }: ModulePanelProps) {
  return (
    <section className="min-w-0 rounded-lg border-2 border-line bg-surface p-4 shadow-soft md:p-5">
      {/* code 是模块编号，帮助页面形成“工程蓝图”的阅读秩序。 */}
      <div className="flex items-center justify-between gap-4 border-b-2 border-line pb-3">
        <h2 className="min-w-0 break-words font-[var(--font-display)] text-2xl font-bold text-ink">{title}</h2>
        <span className="rounded-md border-2 border-line bg-accent px-2 py-1 font-[var(--font-mono)] text-xs font-black text-ink">
          {code}
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="grid grid-cols-[1rem_1fr] gap-3 text-sm leading-6 text-muted">
            <span className="mt-2 h-2 w-2 rounded-full bg-ember" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
