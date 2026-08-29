import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { SearchBar } from "@/components/SearchBar";
import { RegionToggle } from "@/components/RegionToggle";
import { RoleToggle } from "@/components/RoleToggle";
import { TransactionsTable, type TransactionRow } from "@/components/TransactionsTable";
import { applyBaseFilters, fetchDistinctValues } from "@/lib/columnFilters";

export const metadata: Metadata = {
  title: "Insider-Käufe — TradeInsider",
  description: "Insider-Käufe von Vorständen, Aufsichtsräten und Politikern in Echtzeit, auf Basis offizieller Meldungen.",
};

const PAGE_SIZE = 50;

// Countries currently covered under the "Europa" region tab. Grows as more
// countries are added — the query below and the rest of the page don't need
// to change when that happens.
const EU_COUNTRIES = ["DE", "AT", "ES", "SE", "NL", "BE"];

const REGIONS = ["US", "EU"] as const;
type Region = (typeof REGIONS)[number];

function isRegion(value: string): value is Region {
  return (REGIONS as readonly string[]).includes(value);
}

const ROLES = ["management_board", "politician", "hedge_fund"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Eyebrow/highlight/subject copy depends on both role and region (e.g. a US
 * CEO reads naturally as "CEOs" while a German board member reads as
 * "Vorstände") — computed here rather than a flat lookup table, since most
 * of the 3 roles × 2 regions combinations share wording. */
function roleCopy(role: Role, region: Region) {
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
  const eyebrow = region === "US" ? "Live-Daten von SEC EDGAR" : "Live-Daten von EQS News";
  return region === "US"
    ? { eyebrow, highlight: "von CEOs.", subjectNominative: "CEOs" }
    : { eyebrow, highlight: "von Vorständen.", subjectNominative: "Vorstände" };
}

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    region?: string;
    role?: string;
    company?: string;
    insider?: string;
  }>;
}

export default async function InsiderKaeufePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(params.page) || 1);
  const role: Role = isRole(params.role ?? "") ? (params.role as Role) : "management_board";
  // Politician and hedge fund data only exist for the US — pin the region
  // regardless of what's in the URL so a stale role=politician&region=EU
  // link still works.
  const region: Region =
    role === "politician" || role === "hedge_fund" ? "US" : isRegion(params.region ?? "") ? (params.region as Region) : "US";
  const company = (params.company ?? "").trim().slice(0, 200) || undefined;
  const insider = (params.insider ?? "").trim().slice(0, 200) || undefined;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const heroCopy = roleCopy(role, region);
  // "Vorstand" in the UI covers both management_board and supervisory_board
  // rows — Germany/Austria's two-tier board structure doesn't cleanly map to
  // a single "insider" category otherwise, and per-row owner_title still
  // shows which one a given transaction actually was.
  const roles = role === "management_board" ? ["management_board", "supervisory_board"] : [role];
  const baseFilters = { roles, region, euCountries: EU_COUNTRIES, q };

  const supabase = createSupabaseReadClient();
  let query = applyBaseFilters(
    supabase
      .from("transactions")
      .select(
        "id, issuer_name, issuer_ticker, owner_name, owner_title, transaction_date, shares, price_per_share, total_value, amount_range, currency, filing_url, insider_score",
        { count: "exact" }
      ),
    baseFilters
  )
    .order("transaction_date", { ascending: false })
    .range(from, to);

  if (company) query = query.eq("issuer_name", company);
  if (insider) query = query.eq("owner_name", insider);

  const [{ data, error, count }, companyOptions, insiderOptions] = await Promise.all([
    query,
    fetchDistinctValues(supabase, "issuer_name", baseFilters),
    fetchDistinctValues(supabase, "owner_name", baseFilters),
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
          <RoleToggle activeCode={role} region={region} q={q} />
          {role !== "politician" && role !== "hedge_fund" && (
            <>
              <RegionToggle activeCode={region} role={role} q={q} />
              {region === "EU" && (
                <p className="text-xs text-muted">Aktuell: Deutschland, Österreich, Spanien, Schweden, Niederlande, Belgien — weitere Länder folgen</p>
              )}
            </>
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
          <SearchBar initialQuery={q} role={role} region={region} company={company} insider={insider} />
        </div>

        {error ? (
          <p className="text-sm text-red-400">Daten konnten gerade nicht geladen werden. Bitte gleich nochmal versuchen.</p>
        ) : (
          <>
            <TransactionsTable
              rows={rows}
              companyOptions={companyOptions}
              insiderOptions={insiderOptions}
              role={role}
              region={region}
              q={q}
              company={company}
              insider={insider}
              showScore={role === "management_board"}
            />
            <div className="mt-6 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link
                  href={{
                    pathname: "/insider-kaeufe",
                    query: { ...(q ? { q } : {}), role, region, ...(company ? { company } : {}), ...(insider ? { insider } : {}), page: page - 1 },
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
                    query: { ...(q ? { q } : {}), role, region, ...(company ? { company } : {}), ...(insider ? { insider } : {}), page: page + 1 },
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
