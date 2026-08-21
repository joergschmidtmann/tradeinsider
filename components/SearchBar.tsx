export function SearchBar({ initialQuery }: { initialQuery: string }) {
  return (
    <form action="/" method="get" className="mb-6">
      <input
        type="text"
        name="q"
        defaultValue={initialQuery}
        placeholder="Search by company name or ticker…"
        className="w-full max-w-md rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-black dark:focus:border-white/40"
      />
    </form>
  );
}
