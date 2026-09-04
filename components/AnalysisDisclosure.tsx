import { Link } from "@/i18n/navigation";
import type { StockAnalysis } from "@/lib/analysis/types";

// TODO LEGAL REVIEW – Kapitalmarktrecht / MAR: Diese Komponente ist für eine
// künftige Analyseseite vorbereitet, aber aktuell an keine bestehende Seite
// angebunden — es gibt noch keine echten Analysen/Ratings im Produkt. Nicht
// mit erfundenen Beispieldaten einbinden. Labels sind bewusst noch nicht über
// next-intl übersetzt (kein Verbraucher sieht diese Komponente aktuell) —
// beim Anbinden an eine echte Seite entsprechend in messages/*.json überführen.

const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function AnalysisDisclosure({ analysis }: { analysis: StockAnalysis }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
      <h3 className="text-sm font-semibold text-foreground">Transparenz &amp; Disclosure</h3>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Analyse erstellt</dt>
          <dd className="text-foreground">{formatDate(analysis.analysisCompletedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Analyse veröffentlicht</dt>
          <dd className="text-foreground">{formatDate(analysis.publishedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Analyse-Horizont</dt>
          <dd className="text-foreground">{analysis.investmentHorizonMonths} Monate</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Rating</dt>
          <dd className="text-foreground">{analysis.rating}</dd>
        </div>
        {analysis.fairValue !== null && (
          <div>
            <dt className="text-xs text-muted">Kursziel</dt>
            <dd className="text-foreground">
              {analysis.fairValue} {analysis.currency}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-muted">Datenstand</dt>
          <dd className="text-foreground">{formatDate(analysis.dataTimestamp)}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-border pt-3">
        <dt className="text-xs text-muted">Interessenkonflikte</dt>
        <dd className="mt-1 text-foreground">{analysis.conflictDisclosure}</dd>
      </div>

      <p className="mt-4 text-xs text-muted">
        Methodik: <Link href="/methodik" className="underline hover:text-foreground">/methodik</Link> (Version {analysis.methodologyVersion}) ·{" "}
        Risiken: <Link href="/risikohinweise" className="underline hover:text-foreground">/risikohinweise</Link> ·{" "}
        Interessenkonflikte: <Link href="/interessenkonflikte" className="underline hover:text-foreground">/interessenkonflikte</Link>
      </p>
      {analysis.sourceList.length > 0 && (
        <p className="mt-2 text-xs text-muted">Quellen: {analysis.sourceList.join(", ")}</p>
      )}
    </div>
  );
}
