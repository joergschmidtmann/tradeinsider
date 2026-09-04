// TODO – Methodik vor Launch final festlegen (siehe lib/methodology.ts).
// TODO LEGAL REVIEW – Kapitalmarktrecht / MAR: Diese Typen bilden die für eine
// künftige "TradeInsider Intelligence"-Analyseseite vorgesehenen Felder ab.
// Es existiert aktuell keine Seite, die diese Daten anzeigt oder befüllt —
// nur Vorbereitung, keine Datenbankmigration (siehe supabase/schema.sql,
// Abschnitt "ENTWURF, NICHT ANGEWENDET").

import type { Rating } from "@/lib/methodology";

export interface StockAnalysis {
  analysisId: string;
  ticker: string;
  isin: string | null;
  companyName: string;
  analystName: string;

  methodologyVersion: string;
  dataTimestamp: string;
  analysisCompletedAt: string;
  publishedAt: string;
  investmentHorizonMonths: number;

  rating: Rating;
  scoreOverall: number;
  scoreFundamental: number;
  scoreGrowth: number;
  scoreValuation: number;
  scoreTechnical: number;
  scoreInsider: number;

  fairValue: number | null;
  priceAtAnalysis: number;
  currency: string;

  bullCase: string;
  baseCase: string;
  bearCase: string;

  sourceList: string[];

  /** Ob der Betreiber (designz e.K. / Jörg Schmidtmann) zum Analysezeitpunkt
   * eine Position im analysierten Wertpapier hält — siehe /interessenkonflikte. */
  operatorHasPosition: boolean;
  operatorPositionType: "long" | "short" | null;
  conflictDisclosure: string;

  sponsoredContent: boolean;
  paidRelationship: boolean;
  affiliateRelationship: boolean;
}
