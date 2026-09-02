import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { SearchBar } from "@/components/SearchBar";
import { RoleToggle } from "@/components/RoleToggle";
import { TransactionsTable, type TransactionRow } from "@/components/TransactionsTable";
import { applyBaseFilters, fetchDistinctValues } from "@/lib/columnFilters";
import { getEurRates } from "@/lib/fxRates";

export const metadata: Metadata = {
  title: "Insider-Käufe — tradeinsider",
  description: "Insider-Käufe von Vorständen, Aufsichtsräten und Politikern in Echtzeit, auf Basis offizieller Meldungen.",
};

const PAGE_SIZE = 50;

const ROLES = ["management_board", "politician", "hedge_fund"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

function roleCopy(role: Role) {
  if (role === "politician") {
    return {
      eyebrow: "Live-Daten von House Stock Watcher (US-Kongress)",
      highlight: "von US-Politikern.",
      subjectNominative: "US-Politiker",
    };
  }
  if (role === "hedge_fund") {
    return {
      eyebrow: "Live-Daten von SEC EDGAR (13F, vierteljährlich)",
      highlight: "von Hedgefonds.",
      subjectNominative: "Hedgefonds",
    };
  }
  return {
    eyebrow: "Live-Daten von SEC EDGAR & EQS News",
    highlight: "von Vorständen.",
    subjectNominative: "Vorstände",
  };
}

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    role?: string;
    company?: string;
    insider?: string;
    country?: string;
  }>;
}

export default async function InsiderKaeufePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(params.page) || 1);
  const role: Role = isRole(params.role ?? "") ? (params.role as Role) : "management_board";
  const company = (params.company ?? "").trim().slice(0, 200) || undefined;
  const insider = (params.insider ?? "").trim().slice(0, 200) || undefined;
  const country = (params.country ?? "").trim().slice(0, 10) || undefined;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const heroCopy = roleCopy(role);
  const isVorstand = role === "management_board";
  // "Vorstand" in the UI covers both management_board and supervisory_board
  // rows — Germany/Austria's two-tier board structure doesn't cleanly map to
  // a single "insider" category otherwise, and per-row owner_title still
  // shows which one a given transaction actually was.
  const roles = isVorstand ? ["management_board", "supervisory_board"] : [role];
  const baseFilters = { roles, q };

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
    .range(from, to);

  if (company) query = query.eq("issuer_name", company);
  if (insider) query = query.eq("owner_name", insider);
  if (country) query = query.eq("source_country", country);

  const [{ data, error, count }, companyOptions, insiderOptions, countryOptions, eurRates] = await Promise.all([
    query,
    fetchDistinctValues(supabase, "issuer_name", baseFilters),
    fetchDistinctValues(supabase, "owner_name", baseFilters),
    isVorstand ? fetchDistinctValues(supabase, "source_country", baseFilters) : Promise.resolve([]),
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
          Insider-Käufe <span className="text-gradient">{heroCopy.highlight}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted text-balance">
          Wenn {heroCopy.subjectNominative} eigenes Geld in die eigene Aktie stecken, lohnt sich ein zweiter Blick.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <RoleToggle activeCode={role} q={q} />
          {isVorstand && (
            <p className="text-xs text-muted">Aktuell verfügbar: USA, Deutschland, Österreich, Spanien, Schweden, Niederlande, Belgien</p>
          )}
          {role === "hedge_fund" && (
            <p className="max-w-md text-xs text-muted">
              Basiert auf vierteljährlichen SEC-13F-Meldungen (bis zu 45 Tage verzögert). Preis ist eine Schätzung zum
              Quartalsende, kein tatsächlicher Kaufpreis.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="border-b border-border pb-6">
          <h2 className="text-xl font-semibold">Aktuelle Käufe</h2>
        </div>

        <div className="mt-6">
          <SearchBar initialQuery={q} role={role} company={company} insider={insider} country={country} />
        </div>

        {error ? (
          <p className="text-sm text-red-400">Daten konnten gerade nicht geladen werden. Bitte gleich nochmal versuchen.</p>
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
                  ← Zurück
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
                  Weiter →
                </Link>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
