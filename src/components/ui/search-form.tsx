type SearchFormProps = {
  action: string;
  placeholder: string;
  defaultQuery?: string;
  hiddenFields?: Record<string, string | undefined>;
};

export function SearchForm({ action, placeholder, defaultQuery, hiddenFields }: SearchFormProps) {
  return (
    <form action={action} className="rounded-lg border-2 border-line bg-paper p-4 shadow-soft">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) =>
            value ? <input key={name} type="hidden" name={name} value={value} /> : null,
          )
        : null}

      <label className="grid gap-2">
        <span className="font-[var(--font-mono)] text-xs font-bold text-muted">SEARCH</span>
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder={placeholder}
          className="min-h-11 w-full rounded-md border-2 border-line bg-surface px-3 py-2 text-base font-semibold text-ink shadow-control placeholder:text-muted md:text-sm"
        />
      </label>
    </form>
  );
}
