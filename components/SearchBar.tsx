export function SearchBar({
  initialQuery,
  role,
  region,
  company,
  insider,
}: {
  initialQuery: string;
  role: string;
  region: string;
  company?: string;
  insider?: string;
}) {
  return (
    <form action="/insider-kaeufe" method="get" className="mb-8">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="region" value={region} />
      {company && <input type="hidden" name="company" value={company} />}
      {insider && <input type="hidden" name="insider" value={insider} />}
      <div className="relative max-w-md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          name="q"
          defaultValue={initialQuery}
          placeholder="Firma oder Ticker suchen…"
          className="w-full rounded-full border border-border bg-surface py-2.5 pr-4 pl-10 text-sm text-foreground placeholder:text-muted outline-none focus:border-white/25"
        />
      </div>
    </form>
  );
}
