type SearchFormProps = {
  action: string;
  placeholder: string;
  defaultQuery?: string;
  hiddenFields?: Record<string, string | undefined>;
};

export function SearchForm({ action, placeholder, defaultQuery, hiddenFields }: SearchFormProps) {
  return (
    <form action={action} className="w-full">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) =>
            value ? <input key={name} type="hidden" name={name} value={value} /> : null,
          )
        : null}

      <label className="block">
        <span className="sr-only">搜索</span>
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder={placeholder}
          className="min-h-14 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-none placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-blue-600 md:text-sm"
        />
      </label>
    </form>
  );
}
