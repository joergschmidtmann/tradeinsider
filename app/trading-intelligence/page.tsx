import type { Metadata } from "next";
import { CategoryToggle } from "@/components/CategoryToggle";
import { getWeeklyStockRankings, type RankedStock } from "@/lib/marketVolume";

export const metadata: Metadata = { title: "Trading Intelligence — tradeinsider" };

const CATEGORIES = ["etfs", "krypto", "aktien"] as const;
type Category = (typeof CATEGORIES)[number];

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

const DESCRIPTIONS: Record<Category, string> = {
  etfs: "Fundamentale und technische Analysen zu ETFs folgen in Kürze.",
  krypto: "Fundamentale und technische Analysen zu Kryptowährungen folgen in Kürze.",
  aktien: "Die 20 meistgehandelten und die 20 meist leerverkauften US-Aktien der letzten Handelswoche.",
};

const numberFormatter = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function RankTable({
  title,
  rows,
  renderValue,
}: {
  title: string;
  rows: RankedStock[];
  renderValue: (row: RankedStock) => string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <ol>
        {rows.map((row, i) => (
          <li
            key={row.symbol}
            className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-3 text-sm last:border-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-5 shrink-0 text-right font-mono text-xs text-muted">{i + 1}</span>
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{row.name}</div>
                <div className="truncate text-xs text-muted">
                  {row.symbol}
                  {row.securityType ? ` (${row.securityType})` : ""}
                </div>
              </div>
            </div>
            <div className="shrink-0 font-medium text-foreground">{renderValue(row)}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const category: Category = isCategory(params.category ?? "") ? (params.category as Category) : "aktien";
  const rankings = category === "aktien" ? await getWeeklyStockRankings() : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
        {category === "aktien" ? "Live · FINRA Reg SHO" : "Bald verfügbar"}
      </span>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">Trading Intelligence</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{DESCRIPTIONS[category]}</p>
      <div className="mt-8">
        <CategoryToggle activeCode={category} />
      </div>

      {category === "aktien" &&
        (rankings ? (
          <div className="mt-12 w-full text-left">
            <div className="grid gap-8 lg:grid-cols-2">
              <RankTable
                title={`Aktien mit dem höchsten Handelsvolumen (long) — letzte ${rankings.tradingDays} Handelstage`}
                rows={rankings.mostTraded}
                renderValue={(row) => `${numberFormatter.format(row.totalVolume)} Stk.`}
              />
              <RankTable
                title={`Aktien mit dem höchsten Handelsvolumen (short) — letzte ${rankings.tradingDays} Handelstage`}
                rows={rankings.mostShorted}
                renderValue={(row) => `${percentFormatter.format(row.shortRatio)} %`}
              />
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-xs text-muted">
              Basiert auf den täglichen Reg-SHO-Leerverkaufsvolumen-Dateien der FINRA (US-Aktien, ETFs
              ausgeschlossen). Das ist das tatsächlich als Leerverkauf ausgeführte Handelsvolumen des Tages, nicht
              die offene Short-Interest-Position — ein hoher Anteil zeigt reges Handelsgeschehen, nicht automatisch
              eine bearishe Wette gegen die Aktie. Keine Anlageberatung.
            </p>
          </div>
        ) : (
          <p className="mt-12 text-sm text-red-400">Marktdaten konnten gerade nicht geladen werden. Bitte später erneut versuchen.</p>
        ))}
    </div>
  );
}
