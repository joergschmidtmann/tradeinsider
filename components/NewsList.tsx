export interface NewsRow {
  id: number;
  source: string;
  headline: string;
  summary: string | null;
  url: string;
  published_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  ecb: "EZB",
  destatis: "Destatis",
  eqs_corporate: "Unternehmen",
};

const dateFormatter = new Intl.DateTimeFormat("de-DE", { year: "numeric", month: "short", day: "numeric" });

export function NewsList({ rows }: { rows: NewsRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center text-sm text-muted">
        Keine Treffer gefunden.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <a
          key={row.id}
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl border border-border bg-surface px-5 py-4 transition-colors hover:bg-surface-2"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full border border-border px-2 py-0.5 font-medium tracking-wide uppercase">
              {SOURCE_LABELS[row.source] ?? row.source}
            </span>
            <span>{dateFormatter.format(new Date(row.published_at))}</span>
          </div>
          <h3 className="mt-2 font-medium text-foreground">{row.headline}</h3>
          {row.summary && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{row.summary}</p>}
        </a>
      ))}
    </div>
  );
}
