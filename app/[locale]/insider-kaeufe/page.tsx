import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/SearchBar";
import { RoleToggle } from "@/components/RoleToggle";
import { TransactionsTable, type TransactionRow } from "@/components/TransactionsTable";
import { PaywallCard } from "@/components/PaywallCard";
import { applyBaseFilters, fetchDistinctValues } from "@/lib/columnFilters";
import { getEurRates } from "@/lib/fxRates";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("insiderKaeufeTitle"), description: t("insiderKaeufeDescription") };
}

const PAGE_SIZE = 50;

const ROLES = ["management_board", "politician", "hedge_fund"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

const ROLE_KEYS: Record<Role, "managementBoard" | "politician" | "hedgeFund"> = {
  management_board: "managementBoard",
  politician: "politician",
  hedge_fund: "hedgeFund",
};

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    role?: string;
    company?: string;
    insider?: string;
    country?: string;
  }>;
}

export default async function InsiderKaeufePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("insiderKaeufe");
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);
  const role: Role = isRole(sp.role ?? "") ? (sp.role as Role) : "management_board";
  const company = (sp.company ?? "").trim().slice(0, 200) || undefined;
  const insider = (sp.insider ?? "").trim().slice(0, 200) || undefined;
  const country = (sp.country ?? "").trim().slice(0, 10) || undefined;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const roleKey = ROLE_KEYS[role];
  const heroCopy = {
    eyebrow: t(`hero.${roleKey}.eyebrow`),
    highlight: t(`hero.${roleKey}.highlight`),
    subject: t(`hero.${roleKey}.subject`),
  };
  const isVorstand = role === "management_board";
  // "Vorstand" in the UI covers both management_board and supervisory_board
  // rows — Germany/Austria's two-tier board structure doesn't cleanly map to
  // a single "insider" category otherwise, and per-row owner_title still
  // shows which one a given transaction actually was.
  const roles = isVorstand ? ["management_board", "supervisory_board"] : [role];
  const baseFilters = { roles, q };

  // Vorstand/Aufsichtsrat data is Pro-only — check before running any query
  // so free/logged-out visitors never receive the underlying rows at all.
  let isLoggedIn = false;
  let isPro = false;
  if (isVorstand) {
    const authClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    isLoggedIn = !!user;
    if (user) {
      const { data: profile } = await authClient.from("profiles").select("tier").eq("id", user.id).single();
      isPro = profile?.tier === "pro";
    }
  }
  const gated = isVorstand && !isPro;

  const supabase = createSupabaseReadClient();
  let query = applyBaseFilters(
    supabase
      .from("transactions")
      .select(
        "id, issuer_name, issuer_ticker, owner_name, owner_title, source_country, transaction_date, shares, price_per_share, total_value, amount_range, currency, filing_url, insider_score",
        { count: "exact" }
      ),
    baseFilters
  )
    .order("transaction_date", { ascending: false })
    .order("issuer_name", { ascending: true })
    .range(from, to);

  if (company) query = query.eq("issuer_name", company);
  if (insider) query = query.eq("owner_name", insider);
  if (country) query = query.eq("source_country", country);

  const [{ data, error, count }, companyOptions, insiderOptions, countryOptions, eurRates] = gated
    ? [{ data: [], error: null, count: 0 }, [], [], [], {}]
    : await Promise.all([
        query,
        fetchDistinctValues(supabase, "issuer_name", baseFilters, locale),
        fetchDistinctValues(supabase, "owner_name", baseFilters, locale),
        isVorstand ? fetchDistinctValues(supabase, "source_country", baseFilters, locale) : Promise.resolve([]),
        getEurRates(),
      ]);
  const rows = (data ?? []) as TransactionRow[];
  const hasNextPage = count !== null && to + 1 < count;

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28">
        <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
          {heroCopy.eyebrow}
        </span>
        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          {t("titlePrefix")} <span className="text-gradient">{heroCopy.highlight}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted text-balance">
          {t("subtitleTemplate", { subject: heroCopy.subject })}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <RoleToggle activeCode={role} q={q} />
          {isVorstand && <p className="text-xs text-muted">{t("availability")}</p>}
          {role === "hedge_fund" && <p className="max-w-md text-xs text-muted">{t("hedgeFundNote")}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="border-b border-border pb-6">
          <h2 className="text-xl font-semibold">{t("recentPurchases")}</h2>
        </div>

        {gated ? (
          <div className="mt-6">
            <PaywallCard isLoggedIn={isLoggedIn} />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <SearchBar initialQuery={q} role={role} company={company} insider={insider} country={country} locale={locale} />
            </div>

            {error ? (
              <p className="text-sm text-red-400">{t("loadError")}</p>
            ) : (
              <>
                <TransactionsTable
                  rows={rows}
                  companyOptions={companyOptions}
                  insiderOptions={insiderOptions}
                  countryOptions={countryOptions}
                  role={role}
                  q={q}
                  company={company}
                  insider={insider}
                  country={country}
                  showScore={isVorstand}
                  showCountry={isVorstand}
                  eurRates={eurRates}
                  locale={locale}
                />
                <div className="mt-6 flex items-center justify-between text-sm">
                  {page > 1 ? (
                    <Link
                      href={{
                        pathname: "/insider-kaeufe",
                        query: {
                          ...(q ? { q } : {}),
                          role,
                          ...(company ? { company } : {}),
                          ...(insider ? { insider } : {}),
                          ...(country ? { country } : {}),
                          page: page - 1,
                        },
                      }}
                      className="text-muted hover:text-foreground"
                    >
                      {t("back")}
                    </Link>
                  ) : (
                    <span />
                  )}
                  {hasNextPage && (
                    <Link
                      href={{
                        pathname: "/insider-kaeufe",
                        query: {
                          ...(q ? { q } : {}),
                          role,
                          ...(company ? { company } : {}),
                          ...(insider ? { insider } : {}),
                          ...(country ? { country } : {}),
                          page: page + 1,
                        },
                      }}
                      className="text-muted hover:text-foreground"
                    >
                      {t("next")}
                    </Link>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
