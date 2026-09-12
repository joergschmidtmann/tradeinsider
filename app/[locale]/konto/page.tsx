import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { stripe, PRO_MONTHLY_LOOKUP_KEY } from "@/lib/stripe";
import { getEurRates, convertToEur, convertToUsd } from "@/lib/fxRates";
import { buySignalTier } from "@/lib/buySignal";
import { translateTitle } from "@/lib/translateTitle";
import { countryLabel } from "@/lib/countries";
import { weekRangeInBerlin, daysAgoInBerlin } from "@/lib/weekRange";
import { BuySignalIcon } from "@/components/BuySignalIcon";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatTile, type StatDelta } from "@/components/dashboard/StatTile";
import { TickerBadge } from "@/components/dashboard/TickerBadge";
import { ActivityChart, type ActivityDay } from "@/components/dashboard/ActivityChart";
import { EditNameForm } from "@/components/dashboard/EditNameForm";
import { UpgradeSection } from "./UpgradeSection";
import { logout, openBillingPortal } from "./actions";

const INTL_LOCALES: Record<Locale, string> = { de: "de-DE", en: "en-US", es: "es-ES" };

// A structural reclassification (e.g. a share block moved between an insider
// and their holding company) can be reported as a "purchase" at the same
// price/share count as a matching same-day "sale" — technically a real
// filing, but not a market investment, and large enough to swamp a simple
// sum/average. Excluded from the stats/signals below only, above a sanity
// threshold (same one used on the homepage).
const OUTLIER_EUR_THRESHOLD = 50_000_000;
const ACTIVITY_WINDOW_DAYS = 30;

interface SubscriptionSummary {
  planLabel: string;
  price: string;
  startedAt: string;
  nextBilling: string;
  status: string;
}

async function loadSubscriptionSummary(subscriptionId: string, locale: Locale): Promise<SubscriptionSummary | null> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
  const item = subscription.items.data[0];
  if (!item) return null;

  const uiLocale = INTL_LOCALES[locale];
  const dateFormatter = new Intl.DateTimeFormat(uiLocale, { dateStyle: "medium" });
  const price = item.price;
  const amount = price.unit_amount !== null ? price.unit_amount / 100 : null;
  const currencyFormatter = amount !== null ? new Intl.NumberFormat(uiLocale, { style: "currency", currency: price.currency }) : null;

  return {
    planLabel: price.lookup_key === PRO_MONTHLY_LOOKUP_KEY ? "Monatlich" : "Jährlich",
    price: amount !== null && currencyFormatter ? currencyFormatter.format(amount) : "—",
    startedAt: dateFormatter.format(new Date(subscription.created * 1000)),
    nextBilling: dateFormatter.format(new Date(item.current_period_end * 1000)),
    status: subscription.status,
  };
}

interface BoardPurchaseRow {
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

function summarizeWeek(rows: (BoardPurchaseRow & { eurValue: number; usdValue: number | null })[]) {
  const count = rows.length;
  const volumeEur = rows.reduce((sum, row) => sum + row.eurValue, 0);
  const tiers = rows.map((row) => buySignalTier(row.usdValue));
  const strongSignals = tiers.filter((tier) => tier === "strong").length;
  const mediumSignals = tiers.filter((tier) => tier === "medium").length;
  return { count, volumeEur, strongSignals, mediumSignals };
}

export default async function KontoPage({ searchParams }: { searchParams: Promise<{ upgraded?: string }> }) {
  const supabaseAuth = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect({ href: { pathname: "/login", query: { next: "/konto" } }, locale });
    return null;
  }

  const t = await getTranslations("dashboard");
  const tKonto = await getTranslations("auth.konto");
  const tFooter = await getTranslations("footer");
  const tHome = await getTranslations("home");
  const tBuySignal = await getTranslations("buySignal");
  const locale = (await getLocale()) as Locale;
  const uiLocale = INTL_LOCALES[locale];
  const sp = await searchParams;
  const justUpgraded = sp.upgraded === "1";

  const { data: profile } = await supabaseAuth.from("profiles").select("tier, stripe_subscription_id").eq("id", user.id).single();
  const isPro = profile?.tier === "pro";
  const subscription = isPro && profile?.stripe_subscription_id ? await loadSubscriptionSummary(profile.stripe_subscription_id, locale) : null;

  // Queried separately from the tier/subscription lookup above so that, until
  // the `display_name` column migration (supabase/schema.sql) has been
  // applied, this query failing on its own doesn't take Pro-tier detection
  // down with it — it just falls back to the email-derived name below.
  const { data: nameRow } = await supabaseAuth.from("profiles").select("display_name").eq("id", user.id).single();
  const savedName = nameRow?.display_name?.trim() || "";

  const currentWeek = weekRangeInBerlin(0);
  const previousWeek = weekRangeInBerlin(1);
  const activityFrom = daysAgoInBerlin(ACTIVITY_WINDOW_DAYS - 1);

  const supabase = createSupabaseReadClient();
  const [{ data: twoWeekRows }, { data: activityRows }, eurRates] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, issuer_name, issuer_ticker, owner_name, owner_title, source_country, transaction_date, shares, price_per_share, total_value, currency"
      )
      .in("role", ["management_board", "supervisory_board"])
      .eq("transaction_code", "P")
      .gte("transaction_date", previousWeek.from)
      .lte("transaction_date", currentWeek.to)
      .order("transaction_date", { ascending: false })
      .order("id", { ascending: false }),
    supabase
      .from("transactions")
      .select("transaction_date, transaction_code")
      .in("role", ["management_board", "supervisory_board"])
      .in("transaction_code", ["P", "S"])
      .gte("transaction_date", activityFrom),
    getEurRates(),
  ]);

  const rows = ((twoWeekRows ?? []) as BoardPurchaseRow[]).map((row) => ({
    ...row,
    eurValue: row.total_value === null ? 0 : row.currency === "EUR" ? row.total_value : (convertToEur(row.total_value, row.currency, eurRates) ?? 0),
    usdValue: row.total_value === null ? null : convertToUsd(row.total_value, row.currency, eurRates),
  }));
  const filtered = rows.filter((row) => row.eurValue <= OUTLIER_EUR_THRESHOLD);
  const currentRows = filtered.filter((row) => row.transaction_date >= currentWeek.from);
  const previousRows = filtered.filter((row) => row.transaction_date < currentWeek.from);
  const current = summarizeWeek(currentRows);
  const previous = summarizeWeek(previousRows);

  const numberFormatter = new Intl.NumberFormat(uiLocale);

  function deltaPercent(curr: number, prev: number): StatDelta | null {
    if (prev === 0) return curr === 0 ? null : { text: t("stats.new"), positive: true };
    const pct = Math.round(((curr - prev) / prev) * 100);
    return { text: `${pct >= 0 ? "+" : ""}${pct}% ${t("stats.vsPreviousWeek")}`, positive: pct >= 0 };
  }
  function deltaCount(curr: number, prev: number): StatDelta | null {
    const diff = curr - prev;
    if (diff === 0) return null;
    return { text: `${diff >= 0 ? "+" : ""}${diff} ${t("stats.vsPreviousWeek")}`, positive: diff >= 0 };
  }

  const topSignals = [...currentRows]
    .filter((row): row is typeof row & { usdValue: number } => row.usdValue !== null && row.usdValue > 0)
    .sort((a, b) => b.usdValue - a.usdValue)
    .slice(0, 3);

  const recentPurchases = filtered.slice(0, 8);

  const activityMap = new Map<string, ActivityDay>();
  for (let i = 0; i < ACTIVITY_WINDOW_DAYS; i++) {
    const date = daysAgoInBerlin(ACTIVITY_WINDOW_DAYS - 1 - i);
    activityMap.set(date, { date, buys: 0, sells: 0 });
  }
  for (const row of activityRows ?? []) {
    const bucket = activityMap.get(row.transaction_date);
    if (!bucket) continue;
    if (row.transaction_code === "P") bucket.buys += 1;
    else if (row.transaction_code === "S") bucket.sells += 1;
  }
  const activityData = [...activityMap.values()];
  const tickDateFormatter = new Intl.DateTimeFormat(uiLocale, { day: "numeric", month: "short" });
  const dateFormatter = new Intl.DateTimeFormat(uiLocale, { year: "numeric", month: "short", day: "numeric" });

  const emailName = user.email?.split("@")[0]?.split(/[._+-]/)[0] ?? "";
  const emailDerivedName = emailName ? emailName[0].toUpperCase() + emailName.slice(1) : "";
  const displayName = savedName || emailDerivedName;
  const headline = justUpgraded ? t("justUpgraded") : t("greeting.hello", { name: displayName });
  const todayLabel = new Intl.DateTimeFormat(uiLocale, { timeZone: "Europe/Berlin", weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(
    new Date()
  );

  const STAT_ICONS = {
    purchases: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    ),
    volume: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
        <circle cx="12" cy="12" r="8.5" />
        <path strokeLinecap="round" d="M12 7.5v9M9.5 15c0 1.1 1.1 2 2.5 2s2.5-.7 2.5-1.75-1-1.75-2.5-2-2.5-.9-2.5-1.75S10.6 10 12 10s2.5.6 2.5 1.5" />
      </svg>
    ),
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-balance text-foreground sm:text-4xl">{headline}</h1>
              <EditNameForm
                currentName={displayName}
                label={t("editName.label")}
                placeholder={t("editName.placeholder")}
                saveLabel={t("editName.save")}
                cancelLabel={t("editName.cancel")}
              />
            </div>
            <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-muted">{todayLabel}</p>
            <p className="mt-1 text-sm text-muted italic">&ldquo;{t("tagline")}&rdquo;</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile
            icon={STAT_ICONS.purchases}
            value={numberFormatter.format(current.count)}
            label={t("stats.purchases")}
            delta={deltaCount(current.count, previous.count)}
          />
          <StatTile
            icon={STAT_ICONS.volume}
            value={formatCompactEur(current.volumeEur, uiLocale)}
            label={t("stats.volume")}
            delta={deltaPercent(current.volumeEur, previous.volumeEur)}
          />
          <StatTile
            icon={<BuySignalIcon tier="strong" label={tBuySignal("strong")} size={20} />}
            value={numberFormatter.format(current.strongSignals)}
            label={t("stats.strongSignals")}
            delta={deltaCount(current.strongSignals, previous.strongSignals)}
          />
          <StatTile
            icon={<BuySignalIcon tier="medium" label={tBuySignal("medium")} size={20} />}
            value={numberFormatter.format(current.mediumSignals)}
            label={t("stats.mediumSignals")}
            delta={deltaCount(current.mediumSignals, previous.mediumSignals)}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{t("topSignals.heading")}</h2>
                  <p className="mt-1 text-sm text-muted">{t("topSignals.subheading")}</p>
                </div>
                <Link href="/insider-kaeufe" className="shrink-0 text-sm font-medium text-gradient hover:opacity-80">
                  {t("viewAll")}
                </Link>
              </div>

              {topSignals.length === 0 ? (
                <p className="mt-6 text-sm text-muted">{t("topSignals.empty")}</p>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {topSignals.map((row) => {
                    const tier = buySignalTier(row.usdValue);
                    return (
                    <div key={row.id} className="rounded-xl border border-border bg-surface-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <TickerBadge ticker={row.issuer_ticker} issuerName={row.issuer_name} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">{row.issuer_ticker ?? row.issuer_name}</div>
                            <div className="truncate text-xs text-muted">{row.issuer_name}</div>
                          </div>
                        </div>
                        {tier !== null && <BuySignalIcon tier={tier} label={tBuySignal(tier)} />}
                      </div>
                      <div className="mt-3 truncate text-xs text-muted">{row.owner_name}</div>
                      <div className="mt-1 text-lg font-bold text-foreground">
                        {row.total_value !== null
                          ? new Intl.NumberFormat(uiLocale, { style: "currency", currency: row.currency, maximumFractionDigits: 0 }).format(
                              row.total_value
                            )
                          : "—"}
                      </div>
                      {row.shares !== null && row.price_per_share !== null && (
                        <div className="mt-0.5 text-xs text-muted">
                          {numberFormatter.format(row.shares)} ×{" "}
                          {new Intl.NumberFormat(uiLocale, { style: "currency", currency: row.currency }).format(row.price_per_share)}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {row.owner_title && (
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-muted">
                            {translateTitle(row.owner_title, locale)}
                          </span>
                        )}
                        <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-from)_18%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-from)]">
                          {t("topSignals.buy")}
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{t("recent.heading")}</h2>
                  <p className="mt-1 text-sm text-muted">{t("recent.subheading")}</p>
                </div>
                <Link href="/insider-kaeufe" className="shrink-0 text-sm font-medium text-gradient hover:opacity-80">
                  {t("viewAll")}
                </Link>
              </div>

              {recentPurchases.length === 0 ? (
                <p className="mt-6 text-sm text-muted">{t("recent.empty")}</p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
                        <th className="py-2.5 pr-4 font-medium">{t("recent.table.company")}</th>
                        <th className="py-2.5 pr-4 font-medium">{t("recent.table.insider")}</th>
                        <th className="py-2.5 pr-4 font-medium">{t("recent.table.date")}</th>
                        <th className="py-2.5 pr-4 text-right font-medium">{t("recent.table.value")}</th>
                        <th className="py-2.5 pl-4 text-right font-medium">{t("recent.table.buySignal")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPurchases.map((row) => {
                        const tier = buySignalTier(row.usdValue);
                        return (
                        <tr key={row.id} className="border-b border-border/60 last:border-0">
                          <td className="py-3 pr-4">
                            <div className="font-medium text-foreground">{row.issuer_name}</div>
                            <div className="text-xs text-muted">
                              {row.issuer_ticker ? `${row.issuer_ticker} · ` : ""}
                              {countryLabel(row.source_country, locale)}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="text-foreground">{row.owner_name}</div>
                            {row.owner_title && <div className="text-xs text-muted">{translateTitle(row.owner_title, locale)}</div>}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap text-muted">{dateFormatter.format(new Date(row.transaction_date))}</td>
                          <td className="py-3 pr-4 text-right whitespace-nowrap font-medium text-foreground">
                            {row.total_value !== null
                              ? new Intl.NumberFormat(uiLocale, { style: "currency", currency: row.currency, maximumFractionDigits: 0 }).format(
                                  row.total_value
                                )
                              : "—"}
                          </td>
                          <td className="py-3 pl-4 text-right whitespace-nowrap">
                            {tier !== null ? <BuySignalIcon tier={tier} label={tBuySignal(tier)} /> : <span className="text-muted">—</span>}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">{t("activity.heading")}</h2>
                <div className="mt-4">
                  <ActivityChart
                    data={activityData}
                    buysLabel={t("activity.buys")}
                    sellsLabel={t("activity.sells")}
                    emptyLabel={t("activity.empty")}
                    formatTickDate={(iso) => tickDateFormatter.format(new Date(iso))}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">{t("sector.heading")}</h2>
                <div className="mt-4 flex h-40 items-center justify-center px-4 text-center text-sm text-muted">{t("sector.unavailable")}</div>
              </section>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="text-base font-semibold text-foreground">{t("markets.heading")}</h2>
              <div className="mt-4 flex h-28 items-center justify-center px-4 text-center text-sm text-muted">{t("markets.unavailable")}</div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6">
              <blockquote className="text-sm leading-relaxed text-foreground">&ldquo;{tHome("quote.text")}&rdquo;</blockquote>
              <p className="mt-3 text-xs text-muted">{tHome("quote.attribution")}</p>
            </section>

            {isPro ? (
              <section className="rounded-2xl border border-border bg-surface p-5">
                <span className="inline-flex items-center rounded-full bg-gradient-accent px-3 py-1 text-xs font-semibold text-white">
                  {tKonto("proBadge")}
                </span>
                <p className="mt-3 text-sm text-muted">{tKonto("proDescription")}</p>

                {subscription && (
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-muted">Tarif</dt>
                    <dd className="text-right text-foreground">{subscription.planLabel}</dd>
                    <dt className="text-muted">Preis</dt>
                    <dd className="text-right text-foreground">{subscription.price}</dd>
                    <dt className="text-muted">Beginn</dt>
                    <dd className="text-right text-foreground">{subscription.startedAt}</dd>
                    <dt className="text-muted">Nächste Abrechnung</dt>
                    <dd className="text-right text-foreground">{subscription.nextBilling}</dd>
                    <dt className="text-muted">Status</dt>
                    <dd className="text-right text-foreground">{subscription.status}</dd>
                  </dl>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href="/insider-kaeufe"
                    className="rounded-full bg-gradient-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {t("subscription.openInsiderKaeufe")}
                  </Link>
                  <form action={openBillingPortal}>
                    <button
                      type="submit"
                      className="w-full rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                    >
                      {tKonto("manageSubscription")}
                    </button>
                  </form>
                  <Link
                    href="/vertrag-kuendigen"
                    className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                  >
                    {tFooter("cancelContract")}
                  </Link>
                  <Link
                    href="/vertrag-widerrufen"
                    className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                  >
                    {tFooter("withdrawContract")}
                  </Link>
                </div>
              </section>
            ) : (
              <UpgradeSection
                heading={tKonto("upgradeHeading")}
                description={tKonto("upgradeDescription")}
                monthlyLabel={tKonto("monthly")}
                yearlyLabel={tKonto("yearly")}
              />
            )}
          </div>
        </div>

        <section className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/[0.14] bg-surface px-6 py-8 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("cta.heading")}</h2>
            <p className="mt-1 text-sm text-muted">{t("cta.description")}</p>
          </div>
          <Link
            href="/trading-intelligence"
            className="shrink-0 rounded-full bg-gradient-accent px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white transition-opacity hover:opacity-90"
          >
            {t("cta.cta")}
          </Link>
        </section>

        <form action={logout} className="mt-8">
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            {tKonto("logout")}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
