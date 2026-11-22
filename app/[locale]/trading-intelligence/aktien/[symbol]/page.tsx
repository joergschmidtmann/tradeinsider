import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { RecommendationBadge } from "@/components/analysis/RecommendationBadge";
import { ScoreBar } from "@/components/analysis/ScoreBar";
import { SignalList } from "@/components/analysis/SignalList";
import { PriceChart } from "@/components/analysis/PriceChart";
import { AnalystDistribution } from "@/components/analysis/AnalystDistribution";
import { PaywallCard } from "@/components/PaywallCard";
import { getViewerAccess } from "@/lib/supabase/viewer";
import { slugToSymbol, type StockDetailRow } from "@/lib/stockAnalysis";
import { SCORE_CATEGORIES, DEFAULT_ANALYSIS_HORIZON_MONTHS } from "@/lib/methodology";
import type { CategoryKey, Fundamentals } from "@/lib/analysis/model";
import type { Locale } from "@/i18n/routing";

const INTL_LOCALES: Record<Locale, string> = { de: "de-DE", en: "en-US", es: "es-ES" };

interface PageProps {
  params: Promise<{ locale: Locale; symbol: string }>;
}

async function loadStock(slug: string): Promise<StockDetailRow | null> {
  const symbol = slugToSymbol(slug);
  if (!symbol) return null;
  const supabase = createSupabaseReadClient();
  const { data } = await supabase.from("stock_analysis").select("*").eq("symbol", symbol).maybeSingle();
  return (data as StockDetailRow | null) ?? null;
}

/** Nur Name/Ticker — für Metadaten und die Paywall-Ansicht, ohne Analyseinhalte. */
async function loadStockName(slug: string): Promise<{ name: string; ticker: string; exchange: string | null } | null> {
  const symbol = slugToSymbol(slug);
  if (!symbol) return null;
  const supabase = createSupabaseReadClient();
  const { data } = await supabase.from("stock_analysis").select("name, ticker, exchange").eq("symbol", symbol).maybeSingle();
  return data ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, symbol } = await params;
  const stock = await loadStockName(symbol);
  const t = await getTranslations({ locale, namespace: "metadata" });
  if (!stock) return { title: t("stockAnalysisTitle") };
  return {
    title: t("stockDetailTitle", { name: stock.name, ticker: stock.ticker }),
    description: t("stockDetailDescription", { name: stock.name }),
  };
}

function Card({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

const FUNDAMENTAL_ROWS: { key: keyof Fundamentals; kind: "pct" | "x" | "cap" }[] = [
  { key: "marketCap", kind: "cap" },
  { key: "trailingPE", kind: "x" },
  { key: "forwardPE", kind: "x" },
  { key: "pegRatio", kind: "x" },
  { key: "evToEbitda", kind: "x" },
  { key: "priceToSales", kind: "x" },
  { key: "priceToBook", kind: "x" },
  { key: "fcfYield", kind: "pct" },
  { key: "dividendYield", kind: "pct" },
  { key: "operatingMargin", kind: "pct" },
  { key: "profitMargin", kind: "pct" },
  { key: "returnOnEquity", kind: "pct" },
  { key: "debtToEquity", kind: "x" },
  { key: "currentRatio", kind: "x" },
  { key: "revenueGrowthYoY", kind: "pct" },
  { key: "revenueCagr3y", kind: "pct" },
  { key: "earningsGrowthYoY", kind: "pct" },
  { key: "epsGrowthNextYear", kind: "pct" },
];

export default async function StockDetailPage({ params }: PageProps) {
  const { locale, symbol } = await params;
  const t = await getTranslations("stockAnalysis");

  // Pro-Prüfung vor dem Laden der Analyse (siehe lib/supabase/viewer.ts).
  const access = await getViewerAccess();
  if (!access.isPro) {
    const preview = await loadStockName(symbol);
    if (!preview) notFound();
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-12 pb-24 sm:px-6">
        <Link href={{ pathname: "/trading-intelligence", query: { category: "aktien" } }} className="text-sm text-muted hover:text-foreground">
          ← {t("backToList")}
        </Link>
        <p className="mt-6 text-sm text-muted">
          {preview.ticker} · {preview.exchange}
        </p>
        <h1 className="mt-1 mb-8 text-4xl font-semibold tracking-tight text-balance">{preview.name}</h1>
        <PaywallCard isLoggedIn={access.isLoggedIn} description={t("paywallDescription")} />
      </main>
    );
  }

  const stock = await loadStock(symbol);
  if (!stock) notFound();

  const uiLocale = INTL_LOCALES[locale];
  const priceFmt = new Intl.NumberFormat(uiLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pctFmt = new Intl.NumberFormat(uiLocale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });
  const plainPct = new Intl.NumberFormat(uiLocale, { style: "percent", maximumFractionDigits: 1 });
  const xFmt = new Intl.NumberFormat(uiLocale, { maximumFractionDigits: 2 });
  const capFmt = new Intl.NumberFormat(uiLocale, { notation: "compact", maximumFractionDigits: 1 });
  const dateFmt = new Intl.DateTimeFormat(uiLocale, { dateStyle: "medium" });
  const dateTimeFmt = new Intl.DateTimeFormat(uiLocale, { dateStyle: "medium", timeStyle: "short" });

  const fmtMetric = (v: number | null | undefined, kind: "pct" | "x" | "cap") => {
    if (v === null || v === undefined) return "–";
    if (kind === "pct") return plainPct.format(v);
    if (kind === "cap") return `${capFmt.format(v)} ${stock.currency ?? ""}`;
    return xFmt.format(v);
  };

  const scores: Record<CategoryKey, number | null> = {
    technical: stock.score_technical,
    quality: stock.score_quality,
    growth: stock.score_growth,
    valuation: stock.score_valuation,
    analysts: stock.score_analysts,
    insider: stock.score_insider,
  };
  const signals = stock.signals ?? {};
  const tech = stock.technical;
  const f = stock.fundamentals;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-12 pb-24 sm:px-6">
      <Link href={{ pathname: "/trading-intelligence", query: { category: "aktien" } }} className="text-sm text-muted hover:text-foreground">
        ← {t("backToList")}
      </Link>

      {/* Kopf */}
      <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            {stock.ticker} · {stock.exchange}
            {stock.isin ? ` · ${stock.isin}` : ""}
          </p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-balance">{stock.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {[stock.sector, stock.industry].filter(Boolean).join(" · ")}
            {stock.indices.length > 0 && (
              <>
                {stock.sector ? " · " : ""}
                {stock.indices.map((i) => t(`indices.${i}`)).join(", ")}
              </>
            )}
          </p>
        </div>
        <div className="flex items-end gap-6">
          {stock.price !== null && (
            <div className="text-right">
              <div className="font-mono text-3xl font-semibold tabular-nums">
                {priceFmt.format(stock.price)} <span className="text-base text-muted">{stock.currency}</span>
              </div>
              {stock.price_date && <div className="text-xs text-muted">{t("closeOf", { date: dateFmt.format(new Date(stock.price_date)) })}</div>}
            </div>
          )}
        </div>
      </header>

      {/* Empfehlung */}
      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-1">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">{t("detail.recommendation")}</p>
          <div className="mt-3">
            <RecommendationBadge value={stock.recommendation} size="lg" />
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-mono text-5xl font-semibold tabular-nums">{stock.score_overall}</span>
            <span className="text-muted">/ 100</span>
          </div>
          <ScoreBar score={stock.score_overall} className="mt-2" />
          <p className="mt-4 text-sm text-muted">{t(`detail.summary.${stock.recommendation}`)}</p>
          {stock.previous_recommendation && stock.recommendation_changed_at && (
            <p className="mt-3 text-xs text-muted">
              {t("detail.changed", {
                from: t(`recommendations.${stock.previous_recommendation}`),
                date: dateFmt.format(new Date(stock.recommendation_changed_at)),
              })}
            </p>
          )}
          <p className="mt-3 text-xs text-muted">
            {t("detail.coverage", { pct: Math.round(stock.data_coverage * 100) })} ·{" "}
            {t("detail.horizon", { months: DEFAULT_ANALYSIS_HORIZON_MONTHS })}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">{t("detail.breakdown")}</p>
          <ul className="mt-4 space-y-3">
            {SCORE_CATEGORIES.map((c) => (
              <li key={c.key} className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-4 text-sm sm:grid-cols-[14rem_1fr]">
                <span className="text-foreground">
                  {t(`categories.${c.key}`)} <span className="text-xs text-muted">({Math.round(c.weight * 100)} %)</span>
                </span>
                <ScoreBar score={scores[c.key]} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Chart + Technik */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title={t("detail.chartTitle")}>
            {stock.chart ? <PriceChart chart={stock.chart} locale={uiLocale} currency={stock.currency} /> : <p className="text-sm text-muted">–</p>}
          </Card>
        </div>
        <Card title={t("categories.technical")} aside={<span className="font-mono text-sm">{stock.score_technical ?? "–"}</span>}>
          <dl>
            <Metric label={t("metrics.return1m")} value={stock.return_1m !== null ? pctFmt.format(stock.return_1m) : "–"} />
            <Metric label={t("metrics.return3m")} value={stock.return_3m !== null ? pctFmt.format(stock.return_3m) : "–"} />
            <Metric label={t("metrics.return12m")} value={stock.return_12m !== null ? pctFmt.format(stock.return_12m) : "–"} />
            <Metric label={t("metrics.rsi14")} value={tech?.rsi14 != null ? xFmt.format(Math.round(tech.rsi14)) : "–"} />
            <Metric label={t("metrics.sma50")} value={tech?.sma50 != null ? priceFmt.format(tech.sma50) : "–"} />
            <Metric label={t("metrics.sma200")} value={tech?.sma200 != null ? priceFmt.format(tech.sma200) : "–"} />
            <Metric
              label={t("metrics.range52w")}
              value={tech?.low52w != null && tech?.high52w != null ? `${priceFmt.format(tech.low52w)} – ${priceFmt.format(tech.high52w)}` : "–"}
            />
            <Metric label={t("metrics.volatility")} value={tech?.volatility != null ? plainPct.format(tech.volatility) : "–"} />
          </dl>
          <SignalList signals={signals.technical ?? []} />
        </Card>
      </div>

      {/* Fundamental */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title={t("detail.fundamentalTitle")}>
          {f ? (
            <dl>
              {FUNDAMENTAL_ROWS.map((r) => (
                <Metric key={r.key} label={t(`metrics.${r.key}`)} value={fmtMetric(f[r.key], r.kind)} />
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted">{t("detail.noFundamentals")}</p>
          )}
        </Card>
        <div className="grid content-start items-start gap-4 sm:grid-cols-3 lg:col-span-2">
          {(["quality", "growth", "valuation"] as const).map((k) => (
            <Card key={k} title={t(`categories.${k}`)} aside={<span className="font-mono text-sm">{scores[k] ?? "–"}</span>}>
              <p className="text-xs text-muted">{t(`categoryHelp.${k}`)}</p>
              <SignalList signals={signals[k] ?? []} />
            </Card>
          ))}
        </div>
      </div>

      {/* Analysten + Insider */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title={t("detail.analystTitle")}
            aside={<span className="font-mono text-sm">{stock.score_analysts ?? "–"}</span>}
          >
            <AnalystDistribution
              counts={{
                strongBuy: stock.analyst_strong_buy ?? 0,
                buy: stock.analyst_buy ?? 0,
                hold: stock.analyst_hold ?? 0,
                sell: stock.analyst_sell ?? 0,
                strongSell: stock.analyst_strong_sell ?? 0,
              }}
            />
            <dl className="mt-4 grid gap-x-8 sm:grid-cols-3">
              <Metric label={t("metrics.analystCount")} value={stock.analyst_count != null ? String(stock.analyst_count) : "–"} />
              <Metric
                label={t("metrics.analystTarget")}
                value={stock.analyst_target != null ? `${priceFmt.format(stock.analyst_target)} ${stock.currency ?? ""}` : "–"}
              />
              <Metric label={t("metrics.analystUpside")} value={stock.analyst_upside != null ? pctFmt.format(stock.analyst_upside) : "–"} />
            </dl>
            <SignalList signals={signals.analysts ?? []} />
          </Card>
        </div>
        <Card title={t("categories.insider")} aside={<span className="font-mono text-sm">{stock.score_insider ?? "–"}</span>}>
          <p className="text-xs text-muted">{t("categoryHelp.insider")}</p>
          <SignalList signals={signals.insider ?? []} />
          <Link href={{ pathname: "/insider-kaeufe", query: { q: stock.exchange === "US" ? stock.ticker : stock.name } }} className="mt-4 inline-block text-sm text-foreground underline">
            {t("detail.insiderLink")}
          </Link>
        </Card>
      </div>

      {/* Transparenz (MAR / Delegierte VO (EU) 2016/958) */}
      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 text-xs leading-relaxed text-muted">
        <h2 className="text-sm font-semibold text-foreground">{t("disclosure.title")}</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt>{t("disclosure.analyzedAt")}</dt>
            <dd className="text-foreground">{dateTimeFmt.format(new Date(stock.analyzed_at))}</dd>
          </div>
          <div>
            <dt>{t("disclosure.priceAtAnalysis")}</dt>
            <dd className="text-foreground">
              {stock.price !== null ? `${priceFmt.format(stock.price)} ${stock.currency ?? ""}` : "–"}
              {stock.price_date ? ` (${dateFmt.format(new Date(stock.price_date))})` : ""}
            </dd>
          </div>
          <div>
            <dt>{t("disclosure.methodology")}</dt>
            <dd className="text-foreground">v{stock.methodology_version}</dd>
          </div>
          <div>
            <dt>{t("disclosure.sources")}</dt>
            <dd className="text-foreground">{t("disclosure.sourcesValue")}</dd>
          </div>
        </dl>
        <p className="mt-4">{t("disclaimer")}</p>
        <p className="mt-2">
          <Link href="/methodik" className="underline hover:text-foreground">
            {t("methodologyLink")}
          </Link>{" "}
          ·{" "}
          <Link href="/risikohinweise" className="underline hover:text-foreground">
            {t("risksLink")}
          </Link>{" "}
          ·{" "}
          <Link href="/interessenkonflikte" className="underline hover:text-foreground">
            {t("conflictsLink")}
          </Link>
        </p>
      </section>
    </main>
  );
}
