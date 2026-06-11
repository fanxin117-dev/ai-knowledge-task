type ModulePanelProps = {
  code: string;
  title: string;
  items: string[];
};

export function ModulePanel({ code, title, items }: ModulePanelProps) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <h2 className="min-w-0 break-words text-base font-semibold text-slate-950">{title}</h2>
        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
          {code}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="grid grid-cols-[0.75rem_1fr] gap-2 text-sm leading-6 text-slate-500">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
