import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { SourceToggle } from "@/components/SourceToggle";
import { NewsList, type NewsRow } from "@/components/NewsList";

export const metadata: Metadata = {
  title: "Wirtschaftsnews — TradeInsider",
  description: "Wirtschaftsnachrichten von EZB, Destatis und Unternehmen in Echtzeit.",
};

const PAGE_SIZE = 30;

const SOURCES = ["all", "ecb", "destatis", "eqs_corporate"] as const;
type Source = (typeof SOURCES)[number];

function isSource(value: string): value is Source {
  return (SOURCES as readonly string[]).includes(value);
}

interface PageProps {
  searchParams: Promise<{ page?: string; source?: string }>;
}

export default async function WirtschaftsnewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const source: Source = isSource(params.source ?? "") ? (params.source as Source) : "all";
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createSupabaseReadClient();
  let query = supabase
    .from("news_items")
    .select("id, source, headline, summary, url, published_at", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, to);

  if (source !== "all") {
    query = query.eq("source", source);
  }

  const { data, error, count } = await query;
  const rows = (data ?? []) as NewsRow[];
  const hasNextPage = count !== null && to + 1 < count;

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28">
        <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
          Live-Daten von EZB, Destatis &amp; Unternehmen
        </span>
        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          <span className="text-gradient">Wirtschaftsnews.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted text-balance">
          Zinsentscheidungen, Konjunkturdaten und Unternehmensnews auf einen Blick.
        </p>
        <div className="mt-8 flex justify-center">
          <SourceToggle activeCode={source} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        {error ? (
          <p className="text-sm text-red-400">Daten konnten gerade nicht geladen werden. Bitte gleich nochmal versuchen.</p>
        ) : (
          <>
            <NewsList rows={rows} />
            <div className="mt-6 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link
                  href={{ pathname: "/wirtschaftsnews", query: { source, page: page - 1 } }}
                  className="text-muted hover:text-foreground"
                >
                  ← Zurück
                </Link>
              ) : (
                <span />
              )}
              {hasNextPage && (
                <Link
                  href={{ pathname: "/wirtschaftsnews", query: { source, page: page + 1 } }}
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
