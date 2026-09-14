import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { getEurRates, convertToEur, convertToUsd } from "@/lib/fxRates";
import { buySignalTier } from "@/lib/buySignal";
import { translateTitle } from "@/lib/translateTitle";
import { daysAgoInBerlin } from "@/lib/weekRange";
import { EarthGlobe, type GlobeMarker } from "@/components/hero/EarthGlobe";
import { ExampleCarousel, type CarouselExample } from "@/components/ExampleCarousel";
import type { Locale } from "@/i18n/routing";

// Without this, Next statically prerenders the homepage at build time (no
// cookies()/headers() call here to trigger dynamic rendering automatically,
// unlike /insider-kaeufe's auth check) — the globe markers and featured
// examples would then freeze at whatever they were during the last deploy
// instead of reflecting the live database.
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

// The globe only spotlights cities in countries we actually have live data
// for (see memory: France/Switzerland/Poland/UK are not licensed) — New York
// doubles as the hub, with arcs drawn from it to the other three.
const GLOBE_CITIES: { code: string; city: string; lat: number; lng: number; isHub?: boolean }[] = [
  { code: "US", city: "New York", lat: 40.7128, lng: -74.006, isHub: true },
  { code: "DE", city: "Frankfurt", lat: 50.1109, lng: 8.6821 },
  { code: "ES", city: "Madrid", lat: 40.4168, lng: -3.7038 },
  { code: "SE", city: "Stockholm", lat: 59.3293, lng: 18.0686 },
];

const STEP_ICONS: React.ReactNode[] = [
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <ellipse cx="12" cy="6" rx="8" ry="3" />
    <path strokeLinecap="round" d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
    <path strokeLinecap="round" d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </svg>,
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V12M12 20V6M20 20v-9" />
  </svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m15 9-4.5 2.5L8 16l4.5-2.5L15 9Z" />
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

  const supabase = createSupabaseReadClient();

  const [{ data: weekRows }, { data: recentRows }, eurRates] = await Promise.all([
    supabase
      .from("transactions")
      .select("source_country, total_value, currency")
      .in("role", ["management_board", "supervisory_board"])
      .eq("transaction_code", "P")
      .gte("transaction_date", daysAgoInBerlin(6)),
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
  // moved between an insider and their holding company) as a "purchase" —
  // technically a real filing, but not a market investment, and large
  // enough to swamp a simple count. Excluded from this count only (not from
  // the underlying data or the /insider-kaeufe table) above a sanity threshold.
  const OUTLIER_EUR_THRESHOLD = 50_000_000;
  const countryCounts = new Map<string, number>();
  for (const row of weekRows ?? []) {
    const eur = row.total_value === null ? null : row.currency === "EUR" ? row.total_value : convertToEur(row.total_value, row.currency, eurRates);
    if (eur !== null && eur > OUTLIER_EUR_THRESHOLD) continue;
    countryCounts.set(row.source_country, (countryCounts.get(row.source_country) ?? 0) + 1);
  }

  const globeMarkers: GlobeMarker[] = GLOBE_CITIES.map((c) => ({
    id: c.code,
    label: c.city,
    sublabel: `+${countryCounts.get(c.code) ?? 0} ${t("hero.purchasesShort")}`,
    lat: c.lat,
    lng: c.lng,
    isHub: c.isHub,
  }));

  const recent = (recentRows ?? []) as RecentPurchaseRow[];
  const stepItems = t.raw("steps.items") as { title: string; description: string }[];

  // Quotes for every ticker among the 5 recent purchases, to compute a real
  // "since purchase" percentage for the example carousel — only where a
  // quote exists (US tickers only, see scripts/ingest-prices.ts).
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

  // Example carousel: the biggest few of the same recent purchases, by USD
  // value — no separate query for the picks themselves.
  const exampleCandidates = recent
    .map((row) => ({ ...row, usdValue: row.total_value !== null ? convertToUsd(row.total_value, row.currency, eurRates) : null }))
    .filter((row): row is typeof row & { usdValue: number } => row.usdValue !== null && row.usdValue > 0)
    .sort((a, b) => b.usdValue - a.usdValue)
    .slice(0, 4);

  const examples: CarouselExample[] = exampleCandidates.map((row) => ({
    id: row.id,
    ticker: row.issuer_ticker ?? row.issuer_name,
    issuerName: row.issuer_name,
    tier: buySignalTier(row.usdValue)!,
    tierLabel: tBuySignal(buySignalTier(row.usdValue)!),
    kindLabel: translateTitle(row.owner_title, locale),
    amountLabel:
      row.total_value !== null
        ? new Intl.NumberFormat(uiLocale, { style: "currency", currency: row.currency, maximumFractionDigits: 0 }).format(row.total_value)
        : "—",
    dateLabel: dateFormatter.format(new Date(row.transaction_date)),
    pctChange: pctChangeFor(row),
  }));

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="hero-surface relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[45%_55%] lg:items-center lg:gap-10">
            {/* Left: headline */}
            <div className="text-center lg:text-left">
              <p className="text-xs font-semibold tracking-widest text-muted uppercase">{t("hero.eyebrow")}</p>
              <h1 className="mt-6 text-5xl leading-[0.95] font-extrabold tracking-tight text-balance uppercase sm:text-6xl lg:text-7xl">
                <span className="block text-foreground">{t("hero.headlineLine1")}</span>
                <span className="block text-foreground">
                  {t("hero.headlinePrefix")} <span className="text-gradient">{t("hero.headlineHighlight")}</span>
                </span>
                <span className="block text-foreground">{t("hero.headlineLine3")}</span>
              </h1>
              <p className="mx-auto mt-6 max-w-md text-lg text-muted text-balance lg:mx-0">{t("hero.subtitle")}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:justify-start">
                <Link
                  href="/insider-kaeufe"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-accent px-6 py-3 text-sm font-semibold text-black shadow-[0_0_24px_-6px_rgba(120,255,70,0.55)] transition hover:-translate-y-px hover:shadow-[0_0_32px_-4px_rgba(120,255,70,0.7)]"
                >
                  {t("hero.cta")}
                </Link>
                <Link href="#aktuelles-beispiel" className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground transition hover:text-muted">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-3 w-3">
                      <path d="M6 4v16l14-8-14-8Z" />
                    </svg>
                  </span>
                  {t("hero.secondaryCta")}
                </Link>
              </div>
            </div>

            {/* Right: world map */}
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <EarthGlobe markers={globeMarkers} />

              <div className="pointer-events-none absolute right-2 bottom-2 flex items-center gap-2 sm:right-4 sm:bottom-4">
                <span className="h-6 w-px bg-white/25" />
                <span className="text-[10px] font-medium tracking-wide text-muted uppercase">{t("hero.mapCaption")}</span>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center lg:mt-4">
            <div className="flex flex-col items-center gap-2 text-muted">
              <span className="flex h-8 w-5 items-start justify-center rounded-full border border-border p-1">
                <span className="h-1.5 w-1 animate-[hero-float_1.6s_ease-in-out_infinite] rounded-full bg-current motion-reduce:animate-none" />
              </span>
              <span className="text-[10px] font-medium tracking-widest uppercase">{t("hero.scrollHint")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured example */}
      <section id="aktuelles-beispiel" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">{t("example.eyebrow")}</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              <span className="block text-foreground">{t("example.headingLine1")}</span>
              <span className="block text-gradient">{t("example.headingLine2")}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted text-balance lg:mx-0">{t("example.subheading")}</p>
            <Link
              href="/insider-kaeufe"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-white/25"
            >
              {t("example.viewAll")}
            </Link>
          </div>

          {examples.length > 0 && <ExampleCarousel examples={examples} sincePurchaseLabel={t("example.sincePurchase")} />}
        </div>
      </section>

      {/* Three steps */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="mb-10 text-center lg:text-left">
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">{t("steps.eyebrow")}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            <span className="block text-foreground">{t("steps.headingLine1")}</span>
            <span className="block text-gradient">{t("steps.headingLine2")}</span>
          </h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {stepItems.map((step, i) => (
            <div key={step.title}>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--accent-from)]"
                style={{ backgroundColor: "rgba(78, 203, 60, 0.12)" }}
              >
                {STEP_ICONS[i]}
              </span>
              <div className="mt-3 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-1 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tagline strip */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:px-6">
          <span className="flex items-center gap-2">
            <span className="h-px w-6 bg-white/25" />
            {t("tagline")}
          </span>
          <span className="font-mono tracking-wide uppercase">tradeinsider.io</span>
        </div>
      </section>
    </main>
  );
}
