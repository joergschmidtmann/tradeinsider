import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { getEurRates, convertToEur } from "@/lib/fxRates";
import { COUNTRIES } from "@/lib/countries";
import { weekRangeInBerlin } from "@/lib/weekRange";
import type { Locale } from "@/i18n/routing";

// Without this, Next statically prerenders the homepage at build time (no
// cookies()/headers() call here to trigger dynamic rendering automatically,
// unlike /insider-kaeufe's auth check) — the stats strip would then freeze
// at whatever it was during the last deploy instead of reflecting the live
// database.
export const revalidate = 60;

const INTL_LOCALES: Record<Locale, string> = { de: "de-DE", en: "en-US", es: "es-ES" };

function formatCompactEur(amount: number, uiLocale: string): string {
  return new Intl.NumberFormat(uiLocale, { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(
    amount
  );
}

const FEATURE_ICONS: React.ReactNode[] = [
  // Echte Daten
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <ellipse cx="12" cy="6" rx="8" ry="3" />
    <path strokeLinecap="round" d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
    <path strokeLinecap="round" d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </svg>,
  // Klare Signale
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V12M12 20V6M20 20v-9" />
  </svg>,
  // Globale Märkte
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M3 12h18" />
    <path strokeLinecap="round" d="M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z" />
  </svg>,
];

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const uiLocale = INTL_LOCALES[locale];
  const numberFormatter = new Intl.NumberFormat(uiLocale);

  const supabase = createSupabaseReadClient();
  const { from: weekFrom, to: weekTo } = weekRangeInBerlin(0);

  const [{ data: weekRows }, eurRates] = await Promise.all([
    supabase
      .from("transactions")
      .select("total_value, currency")
      .in("role", ["management_board", "supervisory_board"])
      .eq("transaction_code", "P")
      .gte("transaction_date", weekFrom)
      .lte("transaction_date", weekTo),
    getEurRates(),
  ]);

  // Some sources report structural reclassifications (e.g. a share block
  // moved between an insider and their holding company) as a "purchase" —
  // technically a real filing, but not a market investment, and large
  // enough to swamp a simple count/sum. Excluded from this stats band only
  // (not from the underlying data or the /insider-kaeufe table) above a
  // sanity threshold.
  const OUTLIER_EUR_THRESHOLD = 50_000_000;
  const rowsWithEur = (weekRows ?? []).map((row) => ({
    ...row,
    eur: row.total_value === null ? null : row.currency === "EUR" ? row.total_value : convertToEur(row.total_value, row.currency, eurRates),
  }));
  const rows = rowsWithEur.filter((row) => row.eur === null || row.eur <= OUTLIER_EUR_THRESHOLD);
  const purchasesLastWeek = rows.length;
  const volumeLastWeekEur = rows.reduce((sum, row) => sum + (row.eur ?? 0), 0);
  const countriesLive = COUNTRIES.length;

  const featureItems = t.raw("features.items") as { title: string; description: string }[];
  const overlayTop = t.raw("hero.overlayTop") as string[];
  const overlayBottom = t.raw("hero.overlayBottom") as string[];

  return (
    <main className="flex-1">
      {/* Hero — photo: Kanan Khasmammadov via Unsplash (unsplash.com/photos/b0445ee6073c) */}
      <section className="border-b border-border">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
            <div className="mx-auto w-full max-w-lg text-center lg:mx-0 lg:text-left">
              <p className="text-xs font-semibold tracking-widest text-muted uppercase">
                {t("hero.eyebrowLine1")}
                <br />
                {t("hero.eyebrowLine2")}
              </p>
              <span className="mx-auto mt-3 block h-px w-8 bg-gradient-accent lg:mx-0" />
              <h1 className="mt-6 text-5xl leading-[0.95] font-extrabold tracking-tight text-balance uppercase sm:text-6xl">
                <span className="block text-foreground">{t("hero.headlineLine1")}</span>
                <span className="block text-foreground">{t("hero.headlineLine2")}</span>
                <span className="block text-gradient">{t("hero.headlineLine3")}</span>
                <span className="block text-gradient">{t("hero.headlineLine4")}</span>
              </h1>
              <p className="mx-auto mt-6 max-w-md text-lg text-muted text-balance lg:mx-0">{t("hero.subtitle")}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:justify-start">
                <Link
                  href="/insider-kaeufe"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-accent px-6 py-3 text-sm font-semibold text-black shadow-[0_0_24px_-6px_rgba(120,255,70,0.55)] transition hover:-translate-y-px hover:shadow-[0_0_32px_-4px_rgba(120,255,70,0.7)]"
                >
                  {t("hero.cta")}
                </Link>
                <Link href="#vorteile" className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground transition hover:text-muted">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-3 w-3">
                      <path d="M6 4v16l14-8-14-8Z" />
                    </svg>
                  </span>
                  {t("hero.secondaryCta")}
                </Link>
              </div>
            </div>
          </div>

          <div className="relative min-h-[420px] lg:min-h-[680px]">
            <Image
              src="/images/hero-skyline-lounge.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40" />
            <div className="absolute top-6 right-6 text-right sm:top-8 sm:right-8">
              {overlayTop.map((line) => (
                <p key={line} className="text-[11px] font-medium tracking-widest text-foreground/80 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {line}
                </p>
              ))}
            </div>
            <div className="absolute right-6 bottom-6 text-right sm:right-8 sm:bottom-8">
              {overlayBottom.map((line) => (
                <p key={line} className="text-[11px] font-medium tracking-widest text-foreground/80 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section id="vorteile" className="scroll-mt-20 border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-3 sm:divide-x sm:divide-white/10">
            {featureItems.map((item, i) => (
              <div key={item.title} className="sm:px-8 sm:first:pl-0">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--accent-from)]"
                  style={{ backgroundColor: "rgba(78, 203, 60, 0.12)" }}
                >
                  {FEATURE_ICONS[i]}
                </span>
                <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — photo: Nubelson Fernandes via Unsplash (unsplash.com/photos/87ec38d01b9f) */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[560px]">
          <Image src="/images/cta-desk-scene.jpg" alt="" fill sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/45" />

          <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">{t("finalCta.label")}</p>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-balance uppercase sm:text-4xl">
                  <span className="block text-foreground">{t("finalCta.headingLine1")}</span>
                  <span className="block text-gradient">{t("finalCta.headingLine2")}</span>
                </h2>
                <p className="mt-4 max-w-md text-muted">{t("finalCta.subheading")}</p>
                <Link
                  href="/signup"
                  className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-gradient-accent px-6 py-3 text-sm font-semibold whitespace-nowrap text-black shadow-[0_0_24px_-6px_rgba(120,255,70,0.55)] transition hover:-translate-y-px hover:shadow-[0_0_32px_-4px_rgba(120,255,70,0.7)]"
                >
                  {t("finalCta.cta")}
                </Link>
              </div>

              <div className="max-w-xs lg:text-right">
                <blockquote className="text-lg leading-relaxed text-balance text-foreground">&ldquo;{t("quote.text")}&rdquo;</blockquote>
                <span className="mt-3 block h-px w-8 bg-gradient-accent lg:ml-auto" />
              </div>
            </div>
          </div>

          <div className="absolute right-6 bottom-6 sm:right-8 sm:bottom-8">
            <span className="rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-[11px] font-medium tracking-widest text-foreground uppercase backdrop-blur-sm">
              {t("finalCta.overlayBadge")}
            </span>
          </div>
        </div>

        <div className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="grid grid-cols-3 gap-6 sm:gap-10">
              <div>
                <div className="font-mono text-2xl font-bold text-foreground sm:text-3xl">{numberFormatter.format(purchasesLastWeek)}</div>
                <div className="mt-1 text-xs text-muted">
                  {t("finalCta.stats.purchasesLabel")}
                  <br />
                  {t("finalCta.stats.purchasesSub")}
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-foreground sm:text-3xl">{formatCompactEur(volumeLastWeekEur, uiLocale)}</div>
                <div className="mt-1 text-xs text-muted">
                  {t("finalCta.stats.volumeLabel")}
                  <br />
                  {t("finalCta.stats.volumeSub")}
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-foreground sm:text-3xl">{countriesLive}</div>
                <div className="mt-1 text-xs text-muted">
                  {t("finalCta.stats.countriesLabel")}
                  <br />
                  {t("finalCta.stats.countriesSub")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5 sm:text-right">
              <span className="font-mono text-xs tracking-widest text-muted uppercase">— tradeinsider.io</span>
              <span className="text-[11px] tracking-widest text-muted uppercase">{t("finalCta.tagline")}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
