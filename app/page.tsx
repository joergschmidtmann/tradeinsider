import Link from "next/link";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { SearchBar } from "@/components/SearchBar";
import { TypeToggle } from "@/components/TypeToggle";
import { TransactionsTable, type TransactionRow } from "@/components/TransactionsTable";
import { Footer } from "@/components/Footer";

const PAGE_SIZE = 50;

const TRANSACTION_TYPES = {
  P: { label: "Purchases", heading: "CEO Insider Purchases", description: "Open-market stock purchases reported by company CEOs, sourced from SEC Form 4 filings." },
  S: { label: "Sales", heading: "CEO Insider Sales", description: "Open-market stock sales reported by company CEOs, sourced from SEC Form 4 filings." },
} as const;
type TransactionType = keyof typeof TRANSACTION_TYPES;

function isTransactionType(value: string): value is TransactionType {
  return value === "P" || value === "S";
}

interface HomeProps {
  searchParams: Promise<{ q?: string; page?: string; type?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(params.page) || 1);
  const type: TransactionType = isTransactionType(params.type ?? "") ? (params.type as TransactionType) : "P";
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createSupabaseReadClient();
  let query = supabase
    .from("transactions")
    .select(
      "id, issuer_name, issuer_ticker, owner_name, owner_title, transaction_date, shares, price_per_share, total_value, filing_url",
      { count: "exact" }
    )
    .eq("is_ceo", true)
    .eq("transaction_code", type)
    .order("transaction_date", { ascending: false })
    .range(from, to);

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
    <div className="flex min-h-full flex-col">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold">{TRANSACTION_TYPES[type].heading}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{TRANSACTION_TYPES[type].description}</p>

        <div className="mt-6">
          <TypeToggle activeCode={type} q={q} />
        </div>
        <div className="mt-4">
          <SearchBar initialQuery={q} type={type} />
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Could not load data right now. Please try again shortly.
          </p>
        ) : (
          <>
            <TransactionsTable rows={rows} />
            <div className="mt-6 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link
                  href={{ pathname: "/", query: { ...(q ? { q } : {}), type, page: page - 1 } }}
                  className="underline hover:no-underline"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              {hasNextPage && (
                <Link
                  href={{ pathname: "/", query: { ...(q ? { q } : {}), type, page: page + 1 } }}
                  className="underline hover:no-underline"
                >
                  Next →
                </Link>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
