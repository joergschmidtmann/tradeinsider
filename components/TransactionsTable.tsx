import { ColumnFilterDropdown } from "./ColumnFilterDropdown";
import type { ColumnFilterOption } from "@/lib/columnFilters";
import { convertToEur } from "@/lib/fxRates";
import { translateTitle } from "@/lib/translateTitle";
import { countryLabel } from "@/lib/countries";

export interface TransactionRow {
  id: number;
  issuer_name: string;
  issuer_ticker: string | null;
  owner_name: string;
  owner_title: string | null;
  source_country: string;
  transaction_date: string;
  shares: number | null;
  price_per_share: number | null;
  total_value: number | null;
  amount_range: string | null;
  currency: string;
  filing_url: string;
  insider_score: number | null;
}

const dateFormatter = new Intl.DateTimeFormat("de-DE", { year: "numeric", month: "short", day: "numeric" });
const numberFormatter = new Intl.NumberFormat("de-DE");

// Each currency reads naturally in its own locale ($1,234.56 / 1.234,56 € /
// 1 234,56 kr); NOK falls back to sv-SE too since we don't otherwise source
// Norwegian data — its number formatting is close enough to Swedish. GBP/PLN/
// ZAR/CZK show up on foreign-listed issuers in the Dutch AFM feed.
const CURRENCY_LOCALES: Record<string, string> = {
  USD: "en-US",
  SEK: "sv-SE",
  NOK: "sv-SE",
  GBP: "en-GB",
  PLN: "pl-PL",
  ZAR: "en-ZA",
  CZK: "cs-CZ",
};
function formatCurrency(value: number, currency: string): string {
  const locale = CURRENCY_LOCALES[currency] ?? "de-DE";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

function CurrencyCell({
  amount,
  currency,
  eurRates,
  fallback,
}: {
  amount: number | null;
  currency: string;
  eurRates: Record<string, number>;
  fallback?: string;
}) {
  if (amount === null) return <>{fallback ?? "—"}</>;
  const eurAmount = convertToEur(amount, currency, eurRates);
  return (
    <>
      <div>{formatCurrency(amount, currency)}</div>
      {eurAmount !== null && <div className="text-xs font-normal text-muted">≈ {formatCurrency(eurAmount, "EUR")}</div>}
    </>
  );
}

const SCORE_TOOLTIP =
  "Automatisch berechneter Indikator (0–100) aus Rolle, Kaufgröße relativ zum Bestand, Gesamtsumme und weiteren Insidern derselben Firma. Keine Anlageempfehlung.";

function ScoreBadge({ score }: { score: number }) {
  const colorClass =
    score >= 75
      ? "bg-emerald-500/15 text-emerald-400"
      : score >= 50
        ? "bg-amber-500/15 text-amber-400"
        : "bg-surface-2 text-muted";
  return (
    <span title={SCORE_TOOLTIP} className={`inline-flex min-w-[2.5rem] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
      {score}
    </span>
  );
}

interface TransactionsTableProps {
  rows: TransactionRow[];
  companyOptions: ColumnFilterOption[];
  insiderOptions: ColumnFilterOption[];
  countryOptions: ColumnFilterOption[];
  role: string;
  q: string;
  company?: string;
  insider?: string;
  country?: string;
  showScore: boolean;
  showCountry: boolean;
  eurRates: Record<string, number>;
}

export function TransactionsTable({
  rows,
  companyOptions,
  insiderOptions,
  countryOptions,
  role,
  q,
  company,
  insider,
  country,
  showScore,
  showCountry,
  eurRates,
}: TransactionsTableProps) {
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
              <th className="px-5 py-3.5 font-medium">
                <ColumnFilterDropdown
                  label="Unternehmen"
                  paramName="company"
                  values={companyOptions}
                  role={role}
                  q={q}
                  company={company}
                  insider={insider}
                  country={country}
                />
              </th>
              <th className="px-5 py-3.5 font-medium">
                <ColumnFilterDropdown
                  label="Insider"
                  paramName="insider"
                  values={insiderOptions}
                  role={role}
                  q={q}
                  company={company}
                  insider={insider}
                  country={country}
                />
              </th>
              {showCountry && (
                <th className="px-5 py-3.5 font-medium">
                  <ColumnFilterDropdown
                    label="Land"
                    paramName="country"
                    values={countryOptions}
                    role={role}
                    q={q}
                    company={company}
                    insider={insider}
                    country={country}
                  />
                </th>
              )}
              <th className="px-5 py-3.5 font-medium">Datum</th>
              <th className="px-5 py-3.5 text-right font-medium">Aktien</th>
              <th className="px-5 py-3.5 text-right font-medium">Preis</th>
              <th className="px-5 py-3.5 text-right font-medium">Gesamtwert</th>
              {showScore && (
                <th className="px-5 py-3.5 text-right font-medium" title={SCORE_TOOLTIP}>
                  Score
                </th>
              )}
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
                  {row.owner_title && <div className="text-xs text-muted">{translateTitle(row.owner_title)}</div>}
                </td>
                {showCountry && (
                  <td className="px-5 py-3.5 whitespace-nowrap text-foreground">{countryLabel(row.source_country)}</td>
                )}
                <td className="px-5 py-3.5 whitespace-nowrap text-muted">
                  {dateFormatter.format(new Date(row.transaction_date))}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap text-foreground">
                  {row.shares !== null ? numberFormatter.format(row.shares) : "—"}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap text-foreground">
                  <CurrencyCell amount={row.price_per_share} currency={row.currency} eurRates={eurRates} />
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap font-medium text-foreground">
                  <CurrencyCell
                    amount={row.total_value}
                    currency={row.currency}
                    eurRates={eurRates}
                    fallback={row.amount_range ?? "—"}
                  />
                </td>
                {showScore && (
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    {row.insider_score !== null ? <ScoreBadge score={row.insider_score} /> : <span className="text-muted">—</span>}
                  </td>
                )}
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
