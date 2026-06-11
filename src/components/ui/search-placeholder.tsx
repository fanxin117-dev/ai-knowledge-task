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
        className="w-full rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500 shadow-none"
      />
    </label>
  );
}
