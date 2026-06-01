type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  prominent?: boolean;
};

export function PageHeader({ eyebrow, title, description, actions, prominent = false }: PageHeaderProps) {
  return (
    <section className="relative border-b-2 border-line pb-5">
      {/* 页头采用档案编号样式，帮助用户感知当前页面属于同一个工作台系统。 */}
      {eyebrow ? (
        <p className="mb-3 inline-flex border border-line bg-accent px-2 py-1 font-[var(--font-mono)] text-xs font-bold uppercase text-ink">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <h1
            className={[
              "break-words font-[var(--font-display)] font-black leading-none text-ink",
              prominent ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl",
            ].join(" ")}
          >
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted md:text-base">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
