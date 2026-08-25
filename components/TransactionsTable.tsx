export interface TransactionRow {
  id: number;
  issuer_name: string;
  issuer_ticker: string | null;
  owner_name: string;
  owner_title: string | null;
  transaction_date: string;
  shares: number | null;
  price_per_share: number | null;
  total_value: number | null;
  amount_range: string | null;
  currency: string;
  filing_url: string;
}

const dateFormatter = new Intl.DateTimeFormat("de-DE", { year: "numeric", month: "short", day: "numeric" });
const numberFormatter = new Intl.NumberFormat("de-DE");

// USD amounts read naturally in en-US formatting ($1,234.56); everything else
// (currently just EUR) reads naturally in de-DE formatting (1.234,56 €).
function formatCurrency(value: number, currency: string): string {
  const locale = currency === "USD" ? "en-US" : "de-DE";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export function TransactionsTable({ rows }: { rows: TransactionRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center text-sm text-muted">
        Keine Treffer gefunden.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
              <th className="px-5 py-3.5 font-medium">Unternehmen</th>
              <th className="px-5 py-3.5 font-medium">Insider</th>
              <th className="px-5 py-3.5 font-medium">Datum</th>
              <th className="px-5 py-3.5 text-right font-medium">Aktien</th>
              <th className="px-5 py-3.5 text-right font-medium">Preis</th>
              <th className="px-5 py-3.5 text-right font-medium">Gesamtwert</th>
              <th className="px-5 py-3.5 font-medium">Meldung</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-foreground">{row.issuer_name}</div>
                  {row.issuer_ticker && <div className="text-xs text-muted">{row.issuer_ticker}</div>}
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-foreground">{row.owner_name}</div>
                  {row.owner_title && <div className="text-xs text-muted">{row.owner_title}</div>}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-muted">
                  {dateFormatter.format(new Date(row.transaction_date))}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap text-foreground">
                  {row.shares !== null ? numberFormatter.format(row.shares) : "—"}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap text-foreground">
                  {row.price_per_share !== null ? formatCurrency(row.price_per_share, row.currency) : "—"}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap font-medium text-foreground">
                  {row.total_value !== null
                    ? formatCurrency(row.total_value, row.currency)
                    : (row.amount_range ?? "—")}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <a
                    href={row.filing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gradient font-medium hover:opacity-80"
                  >
                    Ansehen
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
