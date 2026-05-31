import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <section className="relative rounded-lg border-2 border-dashed border-line bg-paper p-6">
      {/* 四角短线模拟档案扫描框，让空状态像等待采集的资料槽，而不是普通空白卡片。 */}
      <span className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-line" aria-hidden />
      <span className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-line" aria-hidden />
      <span className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-line" aria-hidden />
      <span className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-line" aria-hidden />
      <div className="max-w-xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md border-2 border-line bg-accent font-[var(--font-mono)] text-lg font-black text-ink shadow-panel">
          0
        </div>
        <h2 className="font-[var(--font-display)] text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>

        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex rounded-md border-2 border-line bg-ink px-4 py-2 text-sm font-bold text-surface shadow-panel hover:bg-blueprint"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
