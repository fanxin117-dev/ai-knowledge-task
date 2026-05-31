type TagPillProps = {
  tag: {
    id: string;
    name: string;
    color: string;
  };
};

function getReadableTextColor(backgroundColor: string) {
  const normalized = backgroundColor.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return "#211a12";
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.55 ? "#211a12" : "#fff7e8";
}

export function TagPill({ tag }: TagPillProps) {
  return (
    <span
      className="inline-flex items-center rounded-md border-2 border-line px-2 py-1 font-[var(--font-mono)] text-xs font-bold"
      style={{ backgroundColor: tag.color, color: getReadableTextColor(tag.color) }}
    >
      {tag.name}
    </span>
  );
}
