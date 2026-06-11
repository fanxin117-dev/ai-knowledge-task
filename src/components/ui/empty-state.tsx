import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>

        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex min-h-11 items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
