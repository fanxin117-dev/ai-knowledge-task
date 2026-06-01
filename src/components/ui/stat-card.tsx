type StatCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-lg border-2 border-line bg-paper p-4 shadow-soft md:p-5">
      {/* 左侧色条把统计卡做成仪表标签，后续有真实数据时可以按状态换色。 */}
      <div className="absolute left-0 top-0 h-full w-2 bg-ember" aria-hidden />
      <p className="pl-3 font-[var(--font-mono)] text-xs font-bold text-muted">{label}</p>
      <p className="mt-3 pl-3 font-[var(--font-display)] text-5xl font-black leading-none text-ink">{value}</p>
      <p className="mt-2 text-sm leading-5 text-muted">{helper}</p>
    </article>
  );
}
