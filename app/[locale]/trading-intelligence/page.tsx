import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CategoryToggle } from "@/components/CategoryToggle";
import { EtfTypeToggle } from "@/components/EtfTypeToggle";
import { getWeeklyStockRankings, type RankedStock } from "@/lib/marketVolume";
import { PaywallCard } from "@/components/PaywallCard";
import { getViewerAccess } from "@/lib/supabase/viewer";
import { StockScreener, type ScreenerSearchParams } from "@/components/analysis/StockScreener";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("tradingIntelligenceTitle") };
}

const CATEGORIES = ["etfs", "krypto", "aktien"] as const;
type Category = (typeof CATEGORIES)[number];

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

const ETF_TYPES = ["etfs", "leveraged", "active", "commodity"] as const;
type EtfType = (typeof ETF_TYPES)[number];

function isEtfType(value: string): value is EtfType {
  return (ETF_TYPES as readonly string[]).includes(value);
}

const INTL_LOCALES: Record<Locale, string> = { de: "de-DE", en: "en-US", es: "es-ES" };

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
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ category?: string; etfType?: string } & ScreenerSearchParams>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("tradingIntelligence");
  const category: Category = isCategory(sp.category ?? "") ? (sp.category as Category) : "aktien";
  const etfType: EtfType = isEtfType(sp.etfType ?? "") ? (sp.etfType as EtfType) : "etfs";
  const rankings = category === "aktien" ? await getWeeklyStockRankings() : null;
  // Aktien-Empfehlungen sind Pro-only (wie der Vorstand-Tab bei Insider-Käufen);
  // die FINRA-Ranglisten darunter bleiben kostenlos.
  const access = category === "aktien" ? await getViewerAccess() : { isLoggedIn: false, isPro: false };
  const tAnalysis = await getTranslations("stockAnalysis");
  const description = category === "etfs" ? t(`etfTypeDescriptions.${etfType}`) : t(`descriptions.${category}`);

  const uiLocale = INTL_LOCALES[locale];
  const numberFormatter = new Intl.NumberFormat(uiLocale, { maximumFractionDigits: 0 });
  const percentFormatter = new Intl.NumberFormat(uiLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-24 pb-10 text-center sm:px-6">
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
          {category === "aktien" ? t("badgeLive") : t("badgeSoon")}
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">{description}</p>
        <div className="mt-8">
          <CategoryToggle activeCode={category} />
        </div>

        {category === "etfs" && (
          <div className="mt-4">
            <EtfTypeToggle activeCode={etfType} />
          </div>
        )}
      </div>

      {category === "aktien" && (
        <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          {access.isPro ? (
            <StockScreener locale={locale} sp={sp} />
          ) : (
            <PaywallCard isLoggedIn={access.isLoggedIn} description={tAnalysis("paywallDescription")} />
          )}

          <section className="mt-16">
            <h2 className="text-xl font-semibold">{t("rankingsHeading")}</h2>
            {rankings ? (
              <>
                <div className="mt-6 grid gap-8 lg:grid-cols-2">
                  <RankTable
                    title={t("rankTitleLong", { days: rankings.tradingDays })}
                    rows={rankings.mostTraded}
                    renderValue={(row) => `${numberFormatter.format(row.totalVolume)} ${t("sharesUnit")}`}
                  />
                  <RankTable
                    title={t("rankTitleShort", { days: rankings.tradingDays })}
                    rows={rankings.mostShorted}
                    renderValue={(row) => `${percentFormatter.format(row.shortRatio)} %`}
                  />
                </div>
                <p className="mt-6 max-w-3xl text-xs text-muted">{t("footnote")}</p>
              </>
            ) : (
              <p className="mt-6 text-sm text-red-400">{t("loadError")}</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
