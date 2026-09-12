import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { getEurRates, convertToEur, convertToUsd } from "@/lib/fxRates";
import { buySignalTier } from "@/lib/buySignal";
import { translateTitle } from "@/lib/translateTitle";
import { countryLabel, COUNTRIES } from "@/lib/countries";
import { weekRangeInBerlin } from "@/lib/weekRange";
import { BuySignalIcon } from "@/components/BuySignalIcon";
import { LiveStatus } from "@/components/hero/LiveStatus";
import { HeroStats } from "@/components/hero/HeroStats";
import { HeroSignalCard } from "@/components/hero/HeroSignalCard";
import { GlobalActivityMap } from "@/components/hero/GlobalActivityMap";
import type { Locale } from "@/i18n/routing";

// Without this, Next statically prerenders the homepage at build time (no
// cookies()/headers() call here to trigger dynamic rendering automatically,
// unlike /insider-kaeufe's auth check) — the "today" stats and recent-
// purchases table would then freeze at whatever they were during the last
// deploy instead of reflecting the live database.
export const revalidate = 60;

const INTL_LOCALES: Record<Locale, string> = { de: "de-DE", en: "en-US", es: "es-ES" };

interface RecentPurchaseRow {
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
  currency: string;
}

function formatCompactEur(amount: number, uiLocale: string): string {
  return new Intl.NumberFormat(uiLocale, { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(
    amount
  );
}

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  insiderKaeufe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 15 4-5 3 3 5-7" />
    </svg>
  ),
  tradingIntelligence: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.2-3.2" />
    </svg>
  ),
  tradingAcademy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2 8 10-5 10 5-10 5-10-5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10.5V16c0 1.1 2.7 3 6 3s6-1.9 6-3v-5.5" />
    </svg>
  ),
};

const WHY_ICONS: React.ReactNode[] = [
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 6.5V12c0 4.7 3.4 8.7 8 9.9 4.6-1.2 8-5.2 8-9.9V6.5L12 3Z" />
  </svg>,
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18M6 20V10m6 10V4m6 16v-7" />
  </svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />
  </svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.5 11 15l4-5" />
  </svg>,
];

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const tBuySignal = await getTranslations("buySignal");
  const uiLocale = INTL_LOCALES[locale];
  const dateFormatter = new Intl.DateTimeFormat(uiLocale, { year: "numeric", month: "short", day: "numeric" });
  const numberFormatter = new Intl.NumberFormat(uiLocale);

  const supabase = createSupabaseReadClient();
  const { from: weekFrom, to: weekTo } = weekRangeInBerlin(0);

  const [{ data: weekRows }, { data: recentRows }, eurRates] = await Promise.all([
    supabase
      .from("transactions")
      .select("issuer_name, total_value, currency")
      .in("role", ["management_board", "supervisory_board"])
      .eq("transaction_code", "P")
      .gte("transaction_date", weekFrom)
      .lte("transaction_date", weekTo),
    supabase
      .from("transactions")
      .select(
        "id, issuer_name, issuer_ticker, owner_name, owner_title, source_country, transaction_date, shares, price_per_share, total_value, currency"
      )
      .in("role", ["management_board", "supervisory_board"])
      .eq("transaction_code", "P")
      .order("transaction_date", { ascending: false })
      .order("id", { ascending: false })
      .limit(5),
    getEurRates(),
  ]);

  // Some sources report structural reclassifications (e.g. a share block
  // moved between an insider and their holding company) as a "purchase" with
  // the same price/share count as a matching same-day "sale" — technically
  // real filings, but not a market investment, and large enough to swamp a
  // simple sum/average. Excluded from this stats band only (not from the
  // underlying data or the /insider-kaeufe table) above a sanity threshold.
  const OUTLIER_EUR_THRESHOLD = 50_000_000;
  const rowsWithEur = (weekRows ?? []).map((row) => ({
    ...row,
    eur: row.total_value === null ? null : row.currency === "EUR" ? row.total_value : convertToEur(row.total_value, row.currency, eurRates),
    usd: row.total_value === null ? null : convertToUsd(row.total_value, row.currency, eurRates),
  }));
  const rows = rowsWithEur.filter((row) => row.eur === null || row.eur <= OUTLIER_EUR_THRESHOLD);
  const purchasesLastWeek = rows.length;
  const volumeLastWeekEur = rows.reduce((sum, row) => sum + (row.eur ?? 0), 0);
  const tiers = rows.map((row) => buySignalTier(row.usd));
  const strongSignals = tiers.filter((tier) => tier === "strong").length;

  const recent = (recentRows ?? []) as RecentPurchaseRow[];
  const featureKeys = ["insiderKaeufe", "tradingIntelligence", "tradingAcademy"] as const;
  const whyItems = t.raw("why.items") as { title: string; description: string }[];
  const steps = t.raw("how.steps") as { title: string; description: string }[];

  // Hero floating signal cards: the 2-3 biggest of the same recent purchases
  // already fetched above, by USD value — no separate query for the picks
  // themselves. A "since purchase" percentage is only shown where a real
  // quote exists (US tickers only, see scripts/ingest-prices.ts); never
  // fabricated for the rest.
  const heroCandidates = recent
    .map((row) => ({ ...row, usdValue: row.total_value !== null ? convertToUsd(row.total_value, row.currency, eurRates) : null }))
    .filter((row): row is typeof row & { usdValue: number } => row.usdValue !== null && row.usdValue > 0)
    .sort((a, b) => b.usdValue - a.usdValue)
    .slice(0, 3);

  const heroTickers = [...new Set(heroCandidates.map((row) => row.issuer_ticker).filter((ticker): ticker is string => !!ticker))];
  const { data: heroQuoteRows } =
    heroTickers.length > 0
      ? await supabase.from("stock_quotes").select("ticker, price, currency").in("ticker", heroTickers)
      : { data: [] as { ticker: string; price: number; currency: string }[] };
  const heroQuotes = new Map((heroQuoteRows ?? []).map((q) => [q.ticker, q]));

  const heroSignals = heroCandidates.map((row) => {
    const quote = row.issuer_ticker ? heroQuotes.get(row.issuer_ticker) : undefined;
    const pctChange =
      quote && quote.currency === row.currency && row.price_per_share
        ? ((quote.price - row.price_per_share) / row.price_per_share) * 100
        : null;
    return {
      id: row.id,
      ticker: row.issuer_ticker ?? row.issuer_name,
      issuerName: row.issuer_name,
      roleLabel: translateTitle(row.owner_title, locale),
      amountLabel:
        row.total_value !== null
          ? new Intl.NumberFormat(uiLocale, { style: "currency", currency: row.currency, maximumFractionDigits: 0 }).format(row.total_value)
          : "—",
      tier: buySignalTier(row.usdValue)!,
      sourceCountry: row.source_country,
      pctChange,
    };
  });

  const countriesLive = COUNTRIES.length;

  function toCardProps(signal: (typeof heroSignals)[number]) {
    return {
      ticker: signal.ticker,
      issuerName: signal.issuerName,
      roleLabel: signal.roleLabel,
      amountLabel: signal.amountLabel,
      tier: signal.tier,
      tierLabel: tBuySignal(signal.tier),
      pctChange: signal.pctChange,
    };
  }

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="hero-surface relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[45%_55%] lg:items-center lg:gap-10">
            {/* Left: headline */}
            <div className="text-center lg:text-left">
              <LiveStatus label={t("hero.status")} />
              <h1 className="mt-6 text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                <span className="block text-foreground">{t("hero.headlineLine1")}</span>
                <span className="block text-foreground">{t("hero.headlineLine2")}</span>
                <span className="block text-gradient">{t("hero.headlineHighlight")}</span>
              </h1>
              <p className="mx-auto mt-6 max-w-md text-lg text-muted text-balance lg:mx-0">{t("hero.subtitle")}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:justify-start">
                <Link
                  href="/insider-kaeufe"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-accent px-6 py-3 text-sm font-semibold text-black shadow-[0_0_24px_-6px_rgba(120,255,70,0.55)] transition hover:-translate-y-px hover:shadow-[0_0_32px_-4px_rgba(120,255,70,0.7)]"
                >
                  {t("hero.cta")}
                </Link>
                <Link href="#how-it-works" className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground transition hover:text-muted">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-3 w-3">
                      <path d="M6 4v16l14-8-14-8Z" />
                    </svg>
                  </span>
                  {t("hero.secondaryCta")}
                </Link>
              </div>
            </div>

            {/* Right: global activity visualization */}
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <GlobalActivityMap locale={locale} highlightCodes={heroSignals.map((s) => s.sourceCountry)} />

              {heroSignals[0] && (
                <div className="absolute top-0 left-0 hidden animate-[hero-float_7s_ease-in-out_infinite] motion-reduce:animate-none sm:block">
                  <HeroSignalCard {...toCardProps(heroSignals[0])} />
                </div>
              )}
              {heroSignals[2] && (
                <div
                  className="absolute top-2 right-0 hidden animate-[hero-float_9s_ease-in-out_infinite] motion-reduce:animate-none xl:block"
                  style={{ animationDelay: "2.6s" }}
                >
                  <HeroSignalCard {...toCardProps(heroSignals[2])} size="sm" />
                </div>
              )}
              {heroSignals[1] && (
                <div
                  className="absolute right-8 bottom-0 hidden animate-[hero-float_8s_ease-in-out_infinite] motion-reduce:animate-none md:block"
                  style={{ animationDelay: "1.4s" }}
                >
                  <HeroSignalCard {...toCardProps(heroSignals[1])} size="sm" />
                </div>
              )}

              {heroSignals[0] && (
                <div className="mt-4 flex justify-center sm:hidden">
                  <HeroSignalCard {...toCardProps(heroSignals[0])} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-14 border-t border-white/10 pt-8 lg:mt-16">
            <HeroStats
              stats={[
                { value: numberFormatter.format(purchasesLastWeek), label: t("hero.kpis.purchases") },
                { value: formatCompactEur(volumeLastWeekEur, uiLocale), label: t("hero.kpis.volume") },
                { value: String(countriesLive), label: t("hero.kpis.countries") },
                { value: numberFormatter.format(strongSignals), label: t("hero.kpis.strongSignals") },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {featureKeys.map((key) => {
            const live = key === "insiderKaeufe";
            return (
              <Link
                key={key}
                href={`/${t(`features.${key}.href`)}`}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 transition hover:border-white/25"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-foreground">
                    {FEATURE_ICONS[key]}
                  </span>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase " +
                      (live ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.08] text-muted")
                    }
                  >
                    {live ? t("features.live") : t("features.soon")}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{t(`features.${key}.heading`)}</h3>
                <p className="text-sm leading-relaxed text-muted">{t(`features.${key}.description`)}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-gradient">
                  {t(`features.${key}.cta`)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent purchases teaser */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{t("recent.heading")}</h2>
            <p className="mt-1 text-sm text-muted">{t("recent.subheading")}</p>
          </div>
          <Link href="/insider-kaeufe" className="text-sm font-medium text-gradient hover:opacity-80">
            {t("recent.viewAll")}
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center text-sm text-muted">{t("recent.empty")}</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
                    <th className="px-5 py-3.5 font-medium">{t("recent.table.company")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("recent.table.insider")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("recent.table.country")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("recent.table.date")}</th>
                    <th className="px-5 py-3.5 text-right font-medium">{t("recent.table.value")}</th>
                    <th className="px-5 py-3.5 text-right font-medium">{t("recent.table.buySignal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => {
                    const valueUsd = row.total_value !== null ? convertToUsd(row.total_value, row.currency, eurRates) : null;
                    const tier = buySignalTier(valueUsd);
                    return (
                    <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">{row.issuer_name}</div>
                        {row.issuer_ticker && <div className="text-xs text-muted">{row.issuer_ticker}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-foreground">{row.owner_name}</div>
                        {row.owner_title && <div className="text-xs text-muted">{translateTitle(row.owner_title, locale)}</div>}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-muted">{countryLabel(row.source_country, locale)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-muted">{dateFormatter.format(new Date(row.transaction_date))}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap font-medium text-foreground">
                        {row.total_value !== null
                          ? new Intl.NumberFormat(uiLocale, { style: "currency", currency: row.currency, maximumFractionDigits: 0 }).format(
                              row.total_value
                            )
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {tier !== null ? (
                          <BuySignalIcon tier={tier} label={tBuySignal(tier)} />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Why tradeinsider */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">{t("why.heading")}</h2>
          <p className="mt-2 text-muted">{t("why.subheading")}</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map((item, i) => (
            <div key={item.title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-[#a855f7]">{WHY_ICONS[i]}</span>
              <h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pull quote */}
      <section className="mx-auto max-w-3xl px-4 pb-20 text-center sm:px-6">
        <blockquote className="text-xl leading-relaxed text-balance text-foreground sm:text-2xl">
          &ldquo;{t("quote.text")}&rdquo;
        </blockquote>
        <p className="mt-4 text-sm text-muted">{t("quote.attribution")}</p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
        <div className="mb-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">{t("how.heading")}</h2>
          <p className="mt-2 text-muted">{t("how.subheading")}</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-stretch">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-accent text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center rounded-2xl border border-white/[0.14] bg-surface p-6 text-center lg:w-56">
            <p className="text-base font-semibold text-balance text-foreground">{t("how.highlight")}</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/[0.14] bg-surface px-6 py-12 text-center sm:flex-row sm:px-12 sm:text-left">
          <div>
            <h2 className="text-2xl font-semibold text-balance sm:text-3xl">{t("finalCta.heading")}</h2>
            <p className="mt-2 text-muted">{t("finalCta.subheading")}</p>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-accent px-6 py-3 text-sm font-semibold whitespace-nowrap text-white shadow-[0_12px_30px_-8px_rgba(168,85,247,0.55)] transition hover:-translate-y-px hover:opacity-90"
            >
              {t("finalCta.cta")}
            </Link>
            <p className="text-xs text-muted">{t("finalCta.microcopy")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
