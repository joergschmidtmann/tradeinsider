import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createSupabaseReadClient } from "@/lib/supabaseClient";
import { RecommendationBadge } from "@/components/analysis/RecommendationBadge";
import { ScoreBar } from "@/components/analysis/ScoreBar";
import { FilterPills, type Pill } from "@/components/analysis/FilterPills";
import {
  INDEX_CODES,
  LIST_COLUMNS,
  RECOMMENDATION_FILTERS,
  SORT_OPTIONS,
  fundamentalScore,
  symbolToSlug,
  type RecommendationFilter,
  type SortOption,
  type StockListRow,
} from "@/lib/stockAnalysis";
import type { Recommendation } from "@/lib/analysis/model";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("stockAnalysisTitle"), description: t("stockAnalysisDescription") };
}

const PAGE_SIZE = 50;
const PATHNAME = "/aktien-analyse";
const INTL_LOCALES: Record<Locale, string> = { de: "de-DE", en: "en-US", es: "es-ES" };

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ index?: string; rec?: string; q?: string; sort?: string; page?: string }>;
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export default async function StockAnalysisPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("stockAnalysis");

  const index = pick(sp.index, INDEX_CODES);
  const rec = pick(sp.rec, Object.keys(RECOMMENDATION_FILTERS) as RecommendationFilter[]);
  const sort: SortOption = pick(sp.sort, SORT_OPTIONS) ?? "score";
  const q = (sp.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  // Basisfilter (Index + Suche), auf die sich auch die Empfehlungszähler beziehen.
  const baseQuery = (): Record<string, string> => ({
    ...(index ? { index } : {}),
    ...(q ? { q } : {}),
    ...(sort !== "score" ? { sort } : {}),
  });

  const supabase = createSupabaseReadClient();
  // PostgREST-Filter-Sonderzeichen entfernen, damit die Suche den or()-Ausdruck nicht bricht.
  const safeQ = q.replace(/[%,().*:"\\]/g, " ").trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyBase = (query: any) => {
    let out = query;
    if (index) out = out.contains("indices", [index]);
    if (safeQ) out = out.or(`name.ilike.%${safeQ}%,ticker.ilike.${safeQ}%,isin.eq.${safeQ.toUpperCase()}`);
    return out;
  };

  let listQuery = applyBase(supabase.from("stock_analysis").select(LIST_COLUMNS, { count: "exact" }));
  if (rec) listQuery = listQuery.in("recommendation", RECOMMENDATION_FILTERS[rec]);
  switch (sort) {
    case "score_asc":
      listQuery = listQuery.order("score_overall", { ascending: true });
      break;
    case "upside":
      listQuery = listQuery.order("analyst_upside", { ascending: false, nullsFirst: false });
      break;
    case "momentum":
      listQuery = listQuery.order("return_3m", { ascending: false, nullsFirst: false });
      break;
    case "name":
      listQuery = listQuery.order("name", { ascending: true });
      break;
    default:
      listQuery = listQuery.order("score_overall", { ascending: false });
  }
  listQuery = listQuery.order("symbol", { ascending: true }).range(from, from + PAGE_SIZE - 1);

  const recs: Recommendation[] = ["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"];
  const [listResult, latestResult, ...countResults] = await Promise.all([
    listQuery,
    supabase.from("stock_analysis").select("analyzed_at").order("analyzed_at", { ascending: false }).limit(1),
    ...recs.map((r) => applyBase(supabase.from("stock_analysis").select("symbol", { count: "exact", head: true })).eq("recommendation", r)),
  ]);

  const rows = (listResult.data ?? []) as StockListRow[];
  const total = listResult.count ?? 0;
  const counts = Object.fromEntries(recs.map((r, i) => [r, countResults[i].count ?? 0])) as Record<Recommendation, number>;
  const analyzedAt = latestResult.data?.[0]?.analyzed_at as string | undefined;
  const hasNext = from + PAGE_SIZE < total;

  const uiLocale = INTL_LOCALES[locale];
  const priceFmt = new Intl.NumberFormat(uiLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pctFmt = new Intl.NumberFormat(uiLocale, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });
  const dateFmt = new Intl.DateTimeFormat(uiLocale, { dateStyle: "medium", timeStyle: "short" });

  const indexPills: Pill[] = [
    { key: "all", label: t("filters.allIndices"), query: { ...baseQuery(), ...(rec ? { rec } : {}), index: "" }, active: !index },
    ...INDEX_CODES.map((code) => ({
      key: code,
      label: t(`indices.${code}`),
      query: { ...baseQuery(), ...(rec ? { rec } : {}), index: code },
      active: index === code,
    })),
  ].map((p) => ({ ...p, query: Object.fromEntries(Object.entries(p.query).filter(([, v]) => v)) }));

  const recPills: Pill[] = [
    { key: "all", label: t("filters.allRecommendations"), query: baseQuery(), active: !rec },
    ...(Object.keys(RECOMMENDATION_FILTERS) as RecommendationFilter[]).map((r) => ({
      key: r,
      label: t(`filters.${r}`),
      query: { ...baseQuery(), rec: r },
      active: rec === r,
    })),
  ];

  const pageQuery = (p: number) => ({ ...baseQuery(), ...(rec ? { rec } : {}), ...(p > 1 ? { page: String(p) } : {}) });

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-10 text-center sm:px-6 sm:pt-28">
        <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
          {t("eyebrow")}
        </span>
        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          {t("titlePrefix")} <span className="text-gradient">{t("titleHighlight")}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted text-balance">{t("subtitle")}</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* Verteilung der Empfehlungen */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {recs.map((r) => (
            <div key={r} className="rounded-2xl border border-border bg-surface px-4 py-3">
              <RecommendationBadge value={r} />
              <div className="mt-2 font-mono text-2xl font-semibold text-foreground tabular-nums">{counts[r]}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterPills pills={indexPills} pathname={PATHNAME} />
          <FilterPills pills={recPills} pathname={PATHNAME} />
        </div>

        <form method="get" className="mt-4 flex flex-col gap-3 sm:flex-row">
          {index && <input type="hidden" name="index" value={index} />}
          {rec && <input type="hidden" name="rec" value={rec} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-white/30 focus:outline-none"
          />
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground focus:outline-none"
            aria-label={t("sort.label")}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`sort.${s}`)}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-full bg-gradient-accent px-5 py-2 text-sm font-semibold text-black">
            {t("searchButton")}
          </button>
        </form>

        {listResult.error ? (
          <p className="mt-8 text-sm text-red-400">{t("loadError")}</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-border bg-surface px-6 py-12 text-center text-sm text-muted">{t("empty")}</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("table.stock")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.recommendation")}</th>
                  <th className="w-36 px-4 py-3 font-medium">{t("table.score")}</th>
                  <th className="w-28 px-4 py-3 font-medium">{t("table.technical")}</th>
                  <th className="w-28 px-4 py-3 font-medium">{t("table.fundamental")}</th>
                  <th className="w-28 px-4 py-3 font-medium">{t("table.analysts")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("table.price")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("table.perf3m")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("table.upside")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.symbol} className="border-b border-border/60 last:border-0 hover:bg-surface-2">
                    <td className="max-w-64 px-4 py-3">
                      <Link href={`${PATHNAME}/${symbolToSlug(row.symbol)}`} className="block min-w-0">
                        <div className="truncate font-medium text-foreground hover:underline">{row.name}</div>
                        <div className="truncate text-xs text-muted">
                          {row.ticker} · {row.exchange}
                          {row.sector ? ` · ${row.sector}` : ""}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <RecommendationBadge value={row.recommendation} />
                      {row.previous_recommendation && row.recommendation_changed_at && (
                        <div className="mt-1 text-[11px] text-muted">
                          {t("table.changedFrom", { rec: t(`recommendations.${row.previous_recommendation}`) })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={row.score_overall} />
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={row.score_technical} />
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={fundamentalScore(row)} />
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={row.score_analysts} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap tabular-nums">
                      {row.price !== null ? `${priceFmt.format(row.price)} ${row.currency ?? ""}` : "–"}
                    </td>
                    <td
                      className={
                        "px-4 py-3 text-right font-mono tabular-nums " +
                        (row.return_3m === null ? "text-muted" : row.return_3m >= 0 ? "text-green-400" : "text-red-400")
                      }
                    >
                      {row.return_3m !== null ? pctFmt.format(row.return_3m) : "–"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {row.analyst_upside !== null ? pctFmt.format(row.analyst_upside) : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-sm text-muted">
          <span>{t("resultCount", { count: total })}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={{ pathname: PATHNAME, query: pageQuery(page - 1) }} className="rounded-full border border-border px-4 py-1.5 hover:text-foreground">
                {t("prev")}
              </Link>
            )}
            {hasNext && (
              <Link href={{ pathname: PATHNAME, query: pageQuery(page + 1) }} className="rounded-full border border-border px-4 py-1.5 hover:text-foreground">
                {t("next")}
              </Link>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-surface p-5 text-xs leading-relaxed text-muted">
          <p>{t("disclaimer")}</p>
          <p className="mt-2">
            {analyzedAt && <>{t("dataAsOf", { date: dateFmt.format(new Date(analyzedAt)) })} · </>}
            <Link href="/methodik" className="underline hover:text-foreground">
              {t("methodologyLink")}
            </Link>{" "}
            ·{" "}
            <Link href="/risikohinweise" className="underline hover:text-foreground">
              {t("risksLink")}
            </Link>{" "}
            ·{" "}
            <Link href="/interessenkonflikte" className="underline hover:text-foreground">
              {t("conflictsLink")}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
