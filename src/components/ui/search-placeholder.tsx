type SearchPlaceholderProps = {
  placeholder: string;
};

export function SearchPlaceholder({ placeholder }: SearchPlaceholderProps) {
  return (
    <label className="block">
      <span className="sr-only">搜索</span>
      <input
        disabled
        type="search"
        placeholder={placeholder}
        className="w-full rounded-md border-2 border-line bg-surface text-sm font-semibold text-muted shadow-panel"
      />
    </label>
  );
}
