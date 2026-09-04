import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { stripe, PRO_MONTHLY_LOOKUP_KEY } from "@/lib/stripe";
import { logout, openBillingPortal } from "./actions";
import { UpgradeSection } from "./UpgradeSection";

const INTL_LOCALES: Record<Locale, string> = { de: "de-DE", en: "en-US", es: "es-ES" };

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

export default async function KontoPage({ searchParams }: { searchParams: Promise<{ upgraded?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect({ href: { pathname: "/login", query: { next: "/konto" } }, locale });
    return null;
  }

  const t = await getTranslations("auth.konto");
  const locale = await getLocale();
  const sp = await searchParams;
  const justUpgraded = sp.upgraded === "1";
  const { data: profile } = await supabase.from("profiles").select("tier, stripe_subscription_id").eq("id", user.id).single();
  const isPro = profile?.tier === "pro";
  const subscription = isPro && profile?.stripe_subscription_id ? await loadSubscriptionSummary(profile.stripe_subscription_id, locale as Locale) : null;

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{justUpgraded ? "Willkommen bei TradeInsider Intelligence" : t("heading")}</h1>
      <p className="mt-2 text-sm text-muted">{t("loggedInAs", { email: user.email ?? "" })}</p>

      {isPro ? (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
          <span className="inline-flex items-center rounded-full bg-gradient-accent px-3 py-1 text-xs font-semibold text-white">
            {t("proBadge")}
          </span>
          <p className="mt-3 text-sm text-muted">{t("proDescription")}</p>

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
              Insider-Käufe öffnen
            </Link>
            <form action={openBillingPortal}>
              <button
                type="submit"
                className="w-full rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                {t("manageSubscription")}
              </button>
            </form>
            <Link
              href="/vertrag-kuendigen"
              className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              Vertrag kündigen
            </Link>
            <Link
              href="/vertrag-widerrufen"
              className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              Vertrag widerrufen
            </Link>
          </div>
        </div>
      ) : (
        <UpgradeSection
          heading={t("upgradeHeading")}
          description={t("upgradeDescription")}
          monthlyLabel={t("monthly")}
          yearlyLabel={t("yearly")}
        />
      )}

      <form action={logout} className="mt-8">
        <button
          type="submit"
          className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
        >
          {t("logout")}
        </button>
      </form>
    </div>
  );
}
