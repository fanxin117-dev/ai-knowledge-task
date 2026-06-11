type StatCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold leading-none text-slate-950">{value}</p>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{helper}</p>
    </article>
  );
}
