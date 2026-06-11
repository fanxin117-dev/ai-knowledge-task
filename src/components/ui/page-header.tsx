type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  prominent?: boolean;
};

export function PageHeader({ title, actions, prominent = false }: PageHeaderProps) {
  return (
    <section className="border-b border-slate-200 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <h1
            className={[
              "break-words font-[var(--font-display)] font-semibold leading-tight text-slate-950",
              prominent ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl",
            ].join(" ")}
          >
            {title}
          </h1>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
