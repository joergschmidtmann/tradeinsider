import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { getEurRates, convertToEur, convertToUsd } from "@/lib/fxRates";
import { buySignalTier } from "@/lib/buySignal";
import { translateTitle } from "@/lib/translateTitle";
import { COUNTRIES } from "@/lib/countries";
import { weekRangeInBerlin } from "@/lib/weekRange";
import { BuySignalIcon } from "@/components/BuySignalIcon";
import { LiveStatus } from "@/components/hero/LiveStatus";
import { HeroStats } from "@/components/hero/HeroStats";
import { HeroSignalCard } from "@/components/hero/HeroSignalCard";
import { GlobalActivityMap } from "@/components/hero/GlobalActivityMap";
import { LiveTicker, type LiveTickerItem } from "@/components/hero/LiveTicker";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { SignalFilterTabs } from "@/components/SignalFilterTabs";
import { MountainBolt } from "@/components/MountainBolt";
import { BUY_SIGNAL_COLOR } from "@/lib/buySignal";
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

function formatCompactCurrency(amount: number, currency: string, uiLocale: string): string {
  return new Intl.NumberFormat(uiLocale, { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(amount);
}

// Rounds a live count down to a tidy "at least this many" figure for the
// final-CTA stats row (e.g. 10,234 -> "10.000+", 93 -> "90+") — honest (never
// rounds up) while avoiding a jittery exact number that shifts on every
// 60s revalidation.
function formatAtLeast(n: number, uiLocale: string): string {
  const step = n >= 10_000 ? 1000 : n >= 1000 ? 500 : n >= 100 ? 50 : 10;
  const rounded = Math.floor(n / step) * step;
  return `${new Intl.NumberFormat(uiLocale).format(rounded)}+`;
}

const WHY_ICONS: React.ReactNode[] = [
  // Echtzeit-Daten
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />
  </svg>,
  // Klare Signale
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18M6 20V10m6 10V4m6 16v-7" />
  </svg>,
  // Globaler Fokus
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M3 12h18" />
    <path strokeLinecap="round" d="M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z" />
  </svg>,
  // Wissen & Strategie
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2 8 10-5 10 5-10 5-10-5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 10.5V16c0 1.1 2.7 3 6 3s6-1.9 6-3v-5.5" />
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

  const [{ data: weekRows }, { data: recentRows }, eurRates, { count: totalTradesCount }, { data: allTickerRows }] = await Promise.all([
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
    supabase.from("transactions").select("id", { count: "exact", head: true }).eq("transaction_code", "P"),
    supabase.from("transactions").select("issuer_ticker").eq("transaction_code", "P").not("issuer_ticker", "is", null),
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
  const whyItems = t.raw("why.items") as { title: string; description: string }[];

  // Quotes for every ticker among the 5 recent purchases — shared by the
  // hero's floating signal cards and the live-ticker strip below the hero, so
  // there's only one round trip to stock_quotes for both. A "since purchase"
  // percentage is only shown where a real quote exists (US tickers only, see
  // scripts/ingest-prices.ts); never fabricated for the rest.
  const recentTickers = [...new Set(recent.map((row) => row.issuer_ticker).filter((ticker): ticker is string => !!ticker))];
  const { data: quoteRows } =
    recentTickers.length > 0
      ? await supabase.from("stock_quotes").select("ticker, price, currency").in("ticker", recentTickers)
      : { data: [] as { ticker: string; price: number; currency: string }[] };
  const quotesByTicker = new Map((quoteRows ?? []).map((q) => [q.ticker, q]));

  function pctChangeFor(row: RecentPurchaseRow): number | null {
    const quote = row.issuer_ticker ? quotesByTicker.get(row.issuer_ticker) : undefined;
    return quote && quote.currency === row.currency && row.price_per_share
      ? ((quote.price - row.price_per_share) / row.price_per_share) * 100
      : null;
  }

  // Hero floating signal cards: the 2-3 biggest of the same recent purchases
  // already fetched above, by USD value — no separate query for the picks
  // themselves.
  const heroCandidates = recent
    .map((row) => ({ ...row, usdValue: row.total_value !== null ? convertToUsd(row.total_value, row.currency, eurRates) : null }))
    .filter((row): row is typeof row & { usdValue: number } => row.usdValue !== null && row.usdValue > 0)
    .sort((a, b) => b.usdValue - a.usdValue)
    .slice(0, 3);

  const heroSignals = heroCandidates.map((row) => ({
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
    pctChange: pctChangeFor(row),
  }));

  const tickerItems: LiveTickerItem[] = recent.map((row) => ({
    id: row.id,
    ticker: row.issuer_ticker ?? row.issuer_name,
    pctChange: pctChangeFor(row),
    roleLabel: translateTitle(row.owner_title, locale),
    amountLabel: row.total_value !== null ? formatCompactCurrency(row.total_value, row.currency, uiLocale) : "—",
    dateLabel: dateFormatter.format(new Date(row.transaction_date)),
  }));

  const countriesLive = COUNTRIES.length;
  const marketsCount = new Set((allTickerRows ?? []).map((row) => row.issuer_ticker)).size;

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
                <Link href="#aktuelle-insider-kaeufe" className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground transition hover:text-muted">
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

      {/* Live activity ticker */}
      <LiveTicker label={t("ticker.label")} items={tickerItems} />

      {/* Recent purchases */}
      <section id="aktuelle-insider-kaeufe" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20 pb-20 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
              <span className="block text-foreground">{t("recent.headingLine1")}</span>
              <span className="block text-foreground">{t("recent.headingLine2")}</span>
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted">{t("recent.subheading")}</p>
          </div>
          <Link href="/insider-kaeufe" className="text-sm font-medium text-gradient hover:opacity-80">
            {t("recent.viewAll")}
          </Link>
        </div>

        <div className="mb-6">
          <SignalFilterTabs
            labels={[t("recent.filters.all"), t("recent.filters.strong"), t("recent.filters.medium"), t("recent.filters.weak")]}
          />
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center text-sm text-muted">{t("recent.empty")}</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
                    <th className="px-5 py-3.5 font-medium">{t("recent.table.date")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("recent.table.company")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("recent.table.ticker")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("recent.table.insider")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("recent.table.position")}</th>
                    <th className="px-5 py-3.5 text-right font-medium">{t("recent.table.value")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("recent.table.buySignal")}</th>
                    <th className="px-5 py-3.5 text-right font-medium">{t("recent.table.details")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => {
                    const valueUsd = row.total_value !== null ? convertToUsd(row.total_value, row.currency, eurRates) : null;
                    const tier = buySignalTier(valueUsd);
                    return (
                      <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2">
                        <td className="px-5 py-3.5 whitespace-nowrap text-muted">{dateFormatter.format(new Date(row.transaction_date))}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <CompanyAvatar name={row.issuer_ticker ?? row.issuer_name} />
                            <span className="font-medium text-foreground">{row.issuer_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted">{row.issuer_ticker ?? "—"}</td>
                        <td className="px-5 py-3.5 text-foreground">{row.owner_name}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-muted">{translateTitle(row.owner_title, locale) ?? "—"}</td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap font-medium text-foreground">
                          {row.total_value !== null
                            ? new Intl.NumberFormat(uiLocale, { style: "currency", currency: row.currency, maximumFractionDigits: 0 }).format(
                                row.total_value
                              )
                            : "—"}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {tier !== null ? (
                            <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: BUY_SIGNAL_COLOR[tier] }}>
                              <BuySignalIcon tier={tier} size={16} />
                              {tBuySignal(tier)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <Link href="/insider-kaeufe" className="text-sm font-medium text-gradient hover:opacity-80">
                            {t("recent.table.details")} →
                          </Link>
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
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
              <span className="block text-foreground">{t("why.headingLine1")}</span>
              <span className="block text-foreground">{t("why.headingLine2")}</span>
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted">{t("why.subheading")}</p>
          </div>
          <Link
            href="/trading-academy"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-white/25"
          >
            {t("why.cta")}
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map((item, i) => (
            <div key={item.title}>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--accent-from)]"
                style={{ backgroundColor: "rgba(78, 203, 60, 0.12)" }}
              >
                {WHY_ICONS[i]}
              </span>
              <h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.14] bg-surface">
          <div className="grid lg:grid-cols-[280px_1fr]">
            <div className="relative hidden lg:block">
              <MountainBolt className="absolute inset-0 h-full w-full" />
            </div>
            <div className="px-6 py-12 sm:px-10">
              <MountainBolt className="mb-8 h-36 w-full rounded-2xl lg:hidden" />
              <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-muted uppercase">{t("finalCta.eyebrow")}</p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight uppercase text-balance sm:text-4xl">
                    <span className="block text-foreground">{t("finalCta.headingLine1")}</span>
                    <span className="block text-foreground">{t("finalCta.headingLine2")}</span>
                  </h2>
                  <p className="mt-4 max-w-md text-muted">{t("finalCta.subheading")}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-accent px-6 py-3 text-sm font-semibold whitespace-nowrap text-black shadow-[0_0_24px_-6px_rgba(120,255,70,0.55)] transition hover:-translate-y-px hover:shadow-[0_0_32px_-4px_rgba(120,255,70,0.7)]"
                    >
                      {t("finalCta.cta")}
                    </Link>
                    <Link
                      href="/trading-academy"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:border-white/25"
                    >
                      {t("finalCta.secondaryCta")}
                    </Link>
                  </div>
                  <p className="mt-3 text-xs text-muted">{t("finalCta.microcopy")}</p>
                </div>

                <div className="flex flex-col gap-6 lg:w-64 lg:shrink-0 lg:border-l lg:border-white/10 lg:pl-8">
                  <div className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-5">
                    <div>
                      <div className="font-mono text-2xl font-bold text-foreground">
                        {formatAtLeast(totalTradesCount ?? 0, uiLocale)}
                      </div>
                      <div className="mt-1 text-xs text-muted">{t("finalCta.stats.trades")}</div>
                    </div>
                    <div>
                      <div className="font-mono text-2xl font-bold text-foreground">{formatAtLeast(marketsCount, uiLocale)}</div>
                      <div className="mt-1 text-xs text-muted">{t("finalCta.stats.markets")}</div>
                    </div>
                    <div>
                      <div className="font-mono text-2xl font-bold text-foreground">{countriesLive}</div>
                      <div className="mt-1 text-xs text-muted">{t("finalCta.stats.sources")}</div>
                    </div>
                  </div>
                  <blockquote className="text-sm leading-relaxed text-balance text-muted italic">
                    &ldquo;{t("quote.text")}&rdquo;
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === 0 ? "w-6 bg-gradient-accent" : "w-1.5 bg-white/15"}`} />
          ))}
        </div>
      </section>
    </main>
  );
}
