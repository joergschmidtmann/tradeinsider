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
  filing_url: string;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" });
const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function TransactionsTable({ rows }: { rows: TransactionRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-black/60 dark:text-white/60">No CEO purchases found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50 dark:border-white/10 dark:text-white/50">
            <th className="py-2 pr-4 font-medium">Company</th>
            <th className="py-2 pr-4 font-medium">Insider</th>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium text-right">Shares</th>
            <th className="py-2 pr-4 font-medium text-right">Price</th>
            <th className="py-2 pr-4 font-medium text-right">Total Value</th>
            <th className="py-2 font-medium">Filing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2 pr-4">
                <div className="font-medium">{row.issuer_name}</div>
                {row.issuer_ticker && <div className="text-xs text-black/50 dark:text-white/50">{row.issuer_ticker}</div>}
              </td>
              <td className="py-2 pr-4">
                <div>{row.owner_name}</div>
                {row.owner_title && <div className="text-xs text-black/50 dark:text-white/50">{row.owner_title}</div>}
              </td>
              <td className="py-2 pr-4 whitespace-nowrap">{dateFormatter.format(new Date(row.transaction_date))}</td>
              <td className="py-2 pr-4 text-right whitespace-nowrap">
                {row.shares !== null ? numberFormatter.format(row.shares) : "—"}
              </td>
              <td className="py-2 pr-4 text-right whitespace-nowrap">
                {row.price_per_share !== null ? currencyFormatter.format(row.price_per_share) : "—"}
              </td>
              <td className="py-2 pr-4 text-right whitespace-nowrap font-medium">
                {row.total_value !== null ? currencyFormatter.format(row.total_value) : "—"}
              </td>
              <td className="py-2 whitespace-nowrap">
                <a
                  href={row.filing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:no-underline dark:text-blue-400"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
