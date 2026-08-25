import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { SearchBar } from "@/components/SearchBar";
import { TypeToggle } from "@/components/TypeToggle";
import { RegionToggle } from "@/components/RegionToggle";
import { TransactionsTable, type TransactionRow } from "@/components/TransactionsTable";

export const metadata: Metadata = {
  title: "Insider-Käufe — TradeInsider",
  description: "Insider-Käufe und -Verkäufe von Vorständen in Echtzeit, auf Basis offizieller Meldungen.",
};

const PAGE_SIZE = 50;

// Countries currently covered under the "Europa" region tab. Grows as more
// countries are added — the query below and the rest of the page don't need
// to change when that happens.
const EU_COUNTRIES = ["DE"];

const TRANSACTION_TYPES = {
  P: {
    heading: "Insider-Käufe",
    description: (subject: string) => `Wenn ${subject} eigenes Geld in die eigene Aktie stecken, lohnt sich ein zweiter Blick.`,
    sectionLabel: "Aktuelle Käufe",
  },
  S: {
    heading: "Insider-Verkäufe",
    description: (subject: string) => `Alle am offenen Markt gemeldeten Verkäufe von ${subject} im Überblick.`,
    sectionLabel: "Aktuelle Verkäufe",
  },
} as const;
type TransactionType = keyof typeof TRANSACTION_TYPES;

function isTransactionType(value: string): value is TransactionType {
  return value === "P" || value === "S";
}

const REGIONS = ["US", "EU"] as const;
type Region = (typeof REGIONS)[number];

function isRegion(value: string): value is Region {
  return (REGIONS as readonly string[]).includes(value);
}

const REGION_COPY = {
  US: { eyebrow: "Live-Daten von SEC EDGAR", highlight: "von CEOs.", subject: "CEOs" },
  EU: { eyebrow: "Live-Daten von EQS News", highlight: "von Vorständen.", subject: "Vorständen" },
} as const;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; type?: string; region?: string }>;
}

export default async function InsiderKaeufePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(params.page) || 1);
  const type: TransactionType = isTransactionType(params.type ?? "") ? (params.type as TransactionType) : "P";
  const region: Region = isRegion(params.region ?? "") ? (params.region as Region) : "US";
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const copy = TRANSACTION_TYPES[type];
  const regionCopy = REGION_COPY[region];

  const supabase = createSupabaseReadClient();
  let query = supabase
    .from("transactions")
    .select(
      "id, issuer_name, issuer_ticker, owner_name, owner_title, transaction_date, shares, price_per_share, total_value, currency, filing_url",
      { count: "exact" }
    )
    .eq("is_ceo", true)
    .eq("transaction_code", type)
    .order("transaction_date", { ascending: false })
    .range(from, to);

  query = region === "US" ? query.eq("source_country", "US") : query.in("source_country", EU_COUNTRIES);

  // Postgrest's .or() mini-language uses "," and "(" ")" as structural characters,
  // so strip them from user input before building the filter string.
  const safeQuery = q.replace(/[,()]/g, "");
  if (safeQuery) {
    query = query.or(`issuer_name.ilike.%${safeQuery}%,issuer_ticker.ilike.%${safeQuery}%`);
  }

  const { data, error, count } = await query;
  const rows = (data ?? []) as TransactionRow[];
  const hasNextPage = count !== null && to + 1 < count;

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28">
        <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
          {regionCopy.eyebrow}
        </span>
        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          {copy.heading} <span className="text-gradient">{regionCopy.highlight}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted text-balance">{copy.description(regionCopy.subject)}</p>
        <div className="mt-8 flex flex-col items-center gap-2">
          <RegionToggle activeCode={region} type={type} q={q} />
          {region === "EU" && <p className="text-xs text-muted">Aktuell: Deutschland — weitere Länder folgen</p>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <h2 className="text-xl font-semibold">{copy.sectionLabel}</h2>
          <TypeToggle activeCode={type} region={region} q={q} />
        </div>

        <div className="mt-6">
          <SearchBar initialQuery={q} region={region} type={type} />
        </div>

        {error ? (
          <p className="text-sm text-red-400">Daten konnten gerade nicht geladen werden. Bitte gleich nochmal versuchen.</p>
        ) : (
          <>
            <TransactionsTable rows={rows} />
            <div className="mt-6 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link
                  href={{ pathname: "/insider-kaeufe", query: { ...(q ? { q } : {}), region, type, page: page - 1 } }}
                  className="text-muted hover:text-foreground"
                >
                  ← Zurück
                </Link>
              ) : (
                <span />
              )}
              {hasNextPage && (
                <Link
                  href={{ pathname: "/insider-kaeufe", query: { ...(q ? { q } : {}), region, type, page: page + 1 } }}
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
