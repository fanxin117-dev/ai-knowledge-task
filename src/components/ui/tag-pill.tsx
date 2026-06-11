type TagPillProps = {
  tag: {
    id: string;
    name: string;
    color: string;
  };
};

export function TagPill({ tag }: TagPillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: tag.color }} aria-hidden />
      {tag.name}
    </span>
  );
}
