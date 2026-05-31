type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="relative border-b-2 border-line pb-6">
      {/* 页头采用档案编号样式，帮助用户感知当前页面属于同一个工作台系统。 */}
      {eyebrow ? (
        <p className="mb-3 inline-flex border border-line bg-accent px-2 py-1 font-[var(--font-mono)] text-xs font-bold uppercase text-ink">
          {eyebrow}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-[1fr_9rem] md:items-end">
        <div className="max-w-3xl">
          <h1 className="font-[var(--font-display)] text-4xl font-black leading-none text-ink md:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted md:text-base">{description}</p>
        </div>
        <div className="hidden border-l-2 border-line pl-4 font-[var(--font-mono)] text-xs text-muted md:block">
          <p>STATUS</p>
          <p className="mt-2 text-ink">SKELETON READY</p>
          <p className="mt-2">DB: OFFLINE</p>
        </div>
      </div>
    </section>
  );
}
