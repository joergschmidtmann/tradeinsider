import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CategoryKey, Recommendation } from "@/lib/analysis/model";
import {
  SCORE_CATEGORIES,
  RECOMMENDATION_THRESHOLDS,
  MIN_COVERAGE_FOR_ACTION,
  STRONG_CONFIRMATION_SCORE,
  DEFAULT_ANALYSIS_HORIZON_MONTHS,
  METHODOLOGY_VERSION,
} from "@/lib/methodology";

// TODO LEGAL REVIEW – Kapitalmarktrecht / MAR: Die deutsche Fassung ist die
// verbindliche Beschreibung der Empfehlungsmethodik (Delegierte VO (EU)
// 2016/958). Gewichte/Schwellen kommen direkt aus lib/methodology.ts, damit
// Doku und Berechnung nicht auseinanderlaufen.

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = { de: "Methodik & Transparenz", en: "Methodology & Transparency", es: "Metodología y Transparencia" }[locale];
  return { title: `${title} — tradeinsider` };
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

const CATEGORY_LABELS: Record<Locale, Record<CategoryKey, string>> = {
  de: {
    technical: "Technische Analyse",
    quality: "Fundamental: Qualität",
    growth: "Fundamental: Wachstum",
    valuation: "Fundamental: Bewertung",
    analysts: "Analysten-Konsens",
    insider: "Insider-Aktivität",
  },
  en: {
    technical: "Technical analysis",
    quality: "Fundamentals: quality",
    growth: "Fundamentals: growth",
    valuation: "Fundamentals: valuation",
    analysts: "Analyst consensus",
    insider: "Insider activity",
  },
  es: {
    technical: "Análisis técnico",
    quality: "Fundamental: calidad",
    growth: "Fundamental: crecimiento",
    valuation: "Fundamental: valoración",
    analysts: "Consenso de analistas",
    insider: "Actividad de insiders",
  },
};

const RECOMMENDATION_LABELS: Record<Locale, Record<Recommendation, string>> = {
  de: { STRONG_BUY: "Starker Kauf", BUY: "Kaufen", HOLD: "Halten", SELL: "Verkaufen", STRONG_SELL: "Starker Verkauf" },
  en: { STRONG_BUY: "Strong Buy", BUY: "Buy", HOLD: "Hold", SELL: "Sell", STRONG_SELL: "Strong Sell" },
  es: { STRONG_BUY: "Compra fuerte", BUY: "Comprar", HOLD: "Mantener", SELL: "Vender", STRONG_SELL: "Venta fuerte" },
};

function WeightTable({ locale }: { locale: Locale }) {
  return (
    <table className="mt-2 w-full text-left text-sm">
      <tbody>
        {SCORE_CATEGORIES.map((c) => (
          <tr key={c.key} className="border-b border-border/60 last:border-0">
            <td className="py-1.5 text-foreground">{CATEGORY_LABELS[locale][c.key]}</td>
            <td className="py-1.5 text-right text-muted">{Math.round(c.weight * 100)} %</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RecommendationTable({ locale }: { locale: Locale }) {
  return (
    <table className="mt-2 w-full text-left text-sm">
      <tbody>
        {RECOMMENDATION_THRESHOLDS.map((r, i) => {
          const upper = i === 0 ? 100 : RECOMMENDATION_THRESHOLDS[i - 1].minScore - 1;
          return (
            <tr key={r.recommendation} className="border-b border-border/60 last:border-0">
              <td className="py-1.5 font-medium text-foreground">{RECOMMENDATION_LABELS[locale][r.recommendation]}</td>
              <td className="py-1.5 text-right text-muted">
                {r.minScore}–{upper}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const coveragePct = Math.round(MIN_COVERAGE_FOR_ACTION * 100);

function MethodikDE() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Methodik &amp; Transparenz</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Diese Seite beschreibt, wie die Aktien-Empfehlungen in{" "}
        <Link href={{ pathname: "/trading-intelligence", query: { category: "aktien" } }} className="underline hover:text-foreground">
          Trading Intelligence
        </Link>{" "}
        berechnet werden. Die Empfehlungen entstehen vollautomatisch und regelbasiert — ohne manuelle Eingriffe in
        einzelne Werte. Analysiert werden alle Aktien aus S&amp;P 500, Nasdaq-100 und STOXX Europe 600; die
        Berechnung läuft an jedem Handelstag nach US-Börsenschluss.
      </p>

      <Section heading="Gesamtscore (0–100)">
        <p>Der Gesamtscore ist der gewichtete Durchschnitt aus sechs Kategorien, die jeweils 0–100 Punkte erreichen:</p>
        <WeightTable locale="de" />
        <p>
          Fehlen für eine Kategorie Daten, wird sie ausgelassen und die übrigen Gewichte werden anteilig
          hochgerechnet. Der Anteil der Gewichte mit echten Daten wird als „Datenabdeckung“ ausgewiesen.
        </p>
      </Section>

      <Section heading="Technische Analyse">
        <ul className="list-disc space-y-1 pl-5">
          <li>Trend (30 %): Kurs über/unter 50- und 200-Tage-Linie, Lage der Linien zueinander, Steigung der 200-Tage-Linie</li>
          <li>Momentum (30 %): 12-Monats-Performance ohne den letzten Monat sowie 3-Monats-Performance</li>
          <li>MACD (15 %): Lage und Richtung des MACD-Histogramms (12/26/9)</li>
          <li>RSI (15 %): 14-Tage-RSI; Werte zwischen 55 und 70 gelten als gesunder Aufwärtstrend, über 80 als überkauft</li>
          <li>Abstand zum 52-Wochen-Hoch (10 %)</li>
        </ul>
      </Section>

      <Section heading="Fundamentalanalyse">
        <p>
          <strong className="text-foreground">Qualität:</strong> Eigenkapitalrendite, operative Marge, Nettomarge,
          Verschuldungsgrad und Current Ratio.
        </p>
        <p>
          <strong className="text-foreground">Wachstum:</strong> Umsatzwachstum (Vorjahresquartal und 3 Jahre p. a.),
          Gewinnwachstum sowie das vom Analystenkonsens erwartete Gewinnwachstum im nächsten Geschäftsjahr.
        </p>
        <p>
          <strong className="text-foreground">Bewertung:</strong> erwartetes und aktuelles KGV, EV/EBITDA,
          Kurs-Umsatz-, Kurs-Buchwert- und PEG-Verhältnis werden mit allen Unternehmen derselben Branche im
          Analyse-Universum verglichen (Perzentilrang; günstiger = besser). Dazu kommt die Free-Cashflow-Rendite.
          Verlustbringende Unternehmen erhalten in der Bewertung einen niedrigen Wert.
        </p>
      </Section>

      <Section heading="Analysten-Konsens">
        <p>
          Grundlage ist die Verteilung der Analystenempfehlungen (Strong Buy bis Strong Sell) und das
          durchschnittliche Konsens-Kursziel. Der Konsens (60 %) und das Potenzial zum Kursziel (40 %) ergeben den
          Kategoriewert. Bei weniger als acht Analysten wird der Wert anteilig Richtung neutral (50) gezogen, weil
          einzelne Meinungen wenig belastbar sind.
        </p>
      </Section>

      <Section heading="Insider-Aktivität">
        <p>
          Gemeldete Käufe und Verkäufe von Vorständen und Aufsichtsräten der letzten 90 Tage (siehe{" "}
          <Link href="/insider-kaeufe" className="underline hover:text-foreground">
            Insider-Käufe
          </Link>
          ). Keine Meldungen gelten als neutral (50 Punkte); Käufe wirken deutlich positiv, Verkäufe nur
          abgeschwächt negativ, da sie häufig private Gründe haben.
        </p>
      </Section>

      <Section heading="Empfehlungen">
        <p>Aus dem Gesamtscore ergibt sich die Empfehlung (Horizont: {DEFAULT_ANALYSIS_HORIZON_MONTHS} Monate):</p>
        <RecommendationTable locale="de" />
        <p>Zusätzliche Regeln:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Liegt die Datenabdeckung unter {coveragePct} %, wird unabhängig vom Score „Halten“ ausgewiesen.
          </li>
          <li>
            „Starker Kauf“ setzt voraus, dass weder Technik noch Analysten-Konsens unter {STRONG_CONFIRMATION_SCORE}{" "}
            Punkten liegen (sonst „Kaufen“); spiegelbildlich gilt dies für „Starker Verkauf“.
          </li>
        </ul>
        <p>
          Jede Empfehlung wird mit Datum, Kurs und Methodik-Version gespeichert; Änderungen gegenüber der vorherigen
          Empfehlung werden auf der Analyseseite ausgewiesen.
        </p>
      </Section>

      <Section heading="Datenquellen und Datenstand">
        <p>
          Kurse, Fundamentaldaten und Analysten-Konsens: EODHD (End-of-Day-Daten). Insider-Meldungen: SEC EDGAR,
          EQS/BaFin, CNMV, Finansinspektionen, AFM, FSMA. Datenstand und Analysezeitpunkt werden je Aktie angezeigt.
        </p>
      </Section>

      <Section heading="Grenzen der Methodik">
        <p>
          Automatisiert berechnete Scores und Empfehlungen können Fehleinschätzungen enthalten, insbesondere bei
          lückenhaften, verzögerten oder fehlerhaften Ausgangsdaten. Sie berücksichtigen keine persönlichen
          Verhältnisse und ersetzen keine eigene Prüfung und keine individuelle Anlageberatung.
        </p>
      </Section>

      <Section heading="Interessenkonflikte und Risiken">
        <p>
          Siehe{" "}
          <Link href="/interessenkonflikte" className="underline hover:text-foreground">
            Interessenkonflikte
          </Link>{" "}
          und{" "}
          <Link href="/risikohinweise" className="underline hover:text-foreground">
            Risikohinweise
          </Link>
          .
        </p>
        <p className="text-xs">Methodik-Version: {METHODOLOGY_VERSION}</p>
      </Section>
    </>
  );
}

function MethodikEN() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Methodology &amp; Transparency</h1>
      <p className="mt-2 text-xs text-muted">
        This is an English translation for convenience. The German version is legally binding.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        This page describes how the stock ratings in{" "}
        <Link href={{ pathname: "/trading-intelligence", query: { category: "aktien" } }} className="underline hover:text-foreground">
          Trading Intelligence
        </Link>{" "}
        are calculated. Ratings are produced fully automatically and rule-based, without manual intervention in
        individual values. All stocks in the S&amp;P 500, Nasdaq-100 and STOXX Europe 600 are analyzed every trading
        day after the US close.
      </p>

      <Section heading="Overall score (0–100)">
        <p>The overall score is the weighted average of six categories, each scored 0–100:</p>
        <WeightTable locale="en" />
        <p>
          If data for a category is missing, it is left out and the remaining weights are scaled up proportionally.
          The share of weights backed by real data is shown as “data coverage”.
        </p>
      </Section>

      <Section heading="Technical analysis">
        <ul className="list-disc space-y-1 pl-5">
          <li>Trend (30%): price vs. 50- and 200-day moving averages, their relative position, slope of the 200-day MA</li>
          <li>Momentum (30%): 12-month performance excluding the last month, plus 3-month performance</li>
          <li>MACD (15%): position and direction of the MACD histogram (12/26/9)</li>
          <li>RSI (15%): 14-day RSI; 55–70 counts as a healthy uptrend, above 80 as overbought</li>
          <li>Distance from the 52-week high (10%)</li>
        </ul>
      </Section>

      <Section heading="Fundamental analysis">
        <p>
          <strong className="text-foreground">Quality:</strong> return on equity, operating margin, net margin,
          debt/equity and current ratio.
        </p>
        <p>
          <strong className="text-foreground">Growth:</strong> revenue growth (year-over-year quarter and 3-year
          CAGR), earnings growth and the consensus-expected earnings growth for the next fiscal year.
        </p>
        <p>
          <strong className="text-foreground">Valuation:</strong> forward and trailing P/E, EV/EBITDA, price/sales,
          price/book and PEG are ranked against all companies in the same sector within the analysis universe
          (percentile rank; cheaper = better), plus free cash flow yield. Loss-making companies get a low valuation
          score.
        </p>
      </Section>

      <Section heading="Analyst consensus">
        <p>
          Based on the distribution of analyst ratings (Strong Buy to Strong Sell) and the average consensus price
          target. Consensus (60%) and upside to target (40%) form the category score. With fewer than eight
          analysts the score is pulled proportionally towards neutral (50).
        </p>
      </Section>

      <Section heading="Insider activity">
        <p>
          Reported purchases and sales by executives and directors over the last 90 days (see{" "}
          <Link href="/insider-kaeufe" className="underline hover:text-foreground">
            insider purchases
          </Link>
          ). No filings count as neutral (50); purchases are clearly positive, sales only mildly negative.
        </p>
      </Section>

      <Section heading="Ratings">
        <p>The rating follows from the overall score (horizon: {DEFAULT_ANALYSIS_HORIZON_MONTHS} months):</p>
        <RecommendationTable locale="en" />
        <ul className="list-disc space-y-1 pl-5">
          <li>Below {coveragePct}% data coverage the rating is always “Hold”.</li>
          <li>
            “Strong Buy” requires neither technicals nor analyst consensus to be below {STRONG_CONFIRMATION_SCORE}{" "}
            (otherwise “Buy”); the mirror rule applies to “Strong Sell”.
          </li>
        </ul>
        <p>Every rating is stored with its date, price and methodology version; changes are shown on the analysis page.</p>
      </Section>

      <Section heading="Data sources">
        <p>
          Prices, fundamentals and analyst consensus: EODHD (end-of-day data). Insider filings: SEC EDGAR,
          EQS/BaFin, CNMV, Finansinspektionen, AFM, FSMA.
        </p>
      </Section>

      <Section heading="Limitations of the methodology">
        <p>
          Automatically calculated scores and ratings can be wrong, especially with incomplete, delayed, or
          inaccurate input data. They do not take personal circumstances into account and do not replace your own
          due diligence or individual investment advice.
        </p>
      </Section>

      <Section heading="Conflicts of interest and risks">
        <p>
          See{" "}
          <Link href="/interessenkonflikte" className="underline hover:text-foreground">
            Conflicts of Interest
          </Link>{" "}
          and{" "}
          <Link href="/risikohinweise" className="underline hover:text-foreground">
            Risk Disclosures
          </Link>
          .
        </p>
        <p className="text-xs">Methodology version: {METHODOLOGY_VERSION}</p>
      </Section>
    </>
  );
}

function MethodikES() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Metodología y Transparencia</h1>
      <p className="mt-2 text-xs text-muted">
        Esta es una traducción al español a título informativo. La versión en alemán es la legalmente vinculante.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Esta página describe cómo se calculan las recomendaciones de acciones en{" "}
        <Link href={{ pathname: "/trading-intelligence", query: { category: "aktien" } }} className="underline hover:text-foreground">
          Trading Intelligence
        </Link>
        . Se generan de forma totalmente automática y basada en reglas, sin intervención manual. Se analizan todas
        las acciones del S&amp;P 500, Nasdaq-100 y STOXX Europe 600 cada día hábil tras el cierre de EE. UU.
      </p>

      <Section heading="Puntuación total (0–100)">
        <p>La puntuación total es la media ponderada de seis categorías, cada una de 0 a 100:</p>
        <WeightTable locale="es" />
        <p>
          Si faltan datos de una categoría, se omite y los pesos restantes se escalan proporcionalmente. La
          proporción de pesos con datos reales se muestra como «cobertura de datos».
        </p>
      </Section>

      <Section heading="Análisis técnico">
        <ul className="list-disc space-y-1 pl-5">
          <li>Tendencia (30 %): precio frente a las medias de 50 y 200 días, posición relativa y pendiente de la media de 200 días</li>
          <li>Momentum (30 %): rentabilidad a 12 meses excluyendo el último mes, más rentabilidad a 3 meses</li>
          <li>MACD (15 %): posición y dirección del histograma MACD (12/26/9)</li>
          <li>RSI (15 %): RSI de 14 días; entre 55 y 70 indica una tendencia alcista sana, por encima de 80 sobrecompra</li>
          <li>Distancia al máximo de 52 semanas (10 %)</li>
        </ul>
      </Section>

      <Section heading="Análisis fundamental">
        <p>
          <strong className="text-foreground">Calidad:</strong> rentabilidad sobre fondos propios, margen operativo,
          margen neto, deuda/patrimonio y ratio de liquidez.
        </p>
        <p>
          <strong className="text-foreground">Crecimiento:</strong> crecimiento de ingresos (trimestre interanual y
          3 años anualizado), crecimiento de beneficios y crecimiento esperado por el consenso para el próximo
          ejercicio.
        </p>
        <p>
          <strong className="text-foreground">Valoración:</strong> PER estimado y actual, EV/EBITDA, precio/ventas,
          precio/valor contable y PEG se comparan con todas las empresas del mismo sector del universo analizado
          (percentil; más barato = mejor), más la rentabilidad del flujo de caja libre.
        </p>
      </Section>

      <Section heading="Consenso de analistas">
        <p>
          Se basa en la distribución de recomendaciones (Strong Buy a Strong Sell) y el precio objetivo medio de
          consenso: consenso (60 %) y potencial al precio objetivo (40 %). Con menos de ocho analistas, la
          puntuación se acerca proporcionalmente a neutral (50).
        </p>
      </Section>

      <Section heading="Actividad de insiders">
        <p>
          Compras y ventas comunicadas por directivos y consejeros en los últimos 90 días (véase{" "}
          <Link href="/insider-kaeufe" className="underline hover:text-foreground">
            compras de insiders
          </Link>
          ). Sin notificaciones = neutral (50); las compras son claramente positivas, las ventas solo levemente
          negativas.
        </p>
      </Section>

      <Section heading="Recomendaciones">
        <p>La recomendación se deriva de la puntuación total (horizonte: {DEFAULT_ANALYSIS_HORIZON_MONTHS} meses):</p>
        <RecommendationTable locale="es" />
        <ul className="list-disc space-y-1 pl-5">
          <li>Con una cobertura de datos inferior al {coveragePct} % la recomendación es siempre «Mantener».</li>
          <li>
            «Compra fuerte» exige que ni el técnico ni el consenso de analistas estén por debajo de{" "}
            {STRONG_CONFIRMATION_SCORE} (si no, «Comprar»); la regla inversa se aplica a «Venta fuerte».
          </li>
        </ul>
        <p>Cada recomendación se guarda con fecha, precio y versión de la metodología.</p>
      </Section>

      <Section heading="Fuentes de datos">
        <p>
          Cotizaciones, fundamentales y consenso de analistas: EODHD (datos de cierre). Notificaciones de insiders:
          SEC EDGAR, EQS/BaFin, CNMV, Finansinspektionen, AFM, FSMA.
        </p>
      </Section>

      <Section heading="Limitaciones de la metodología">
        <p>
          Las puntuaciones y recomendaciones calculadas automáticamente pueden ser incorrectas, especialmente con
          datos incompletos, tardíos o inexactos. No tienen en cuenta circunstancias personales ni sustituyen tu
          propia diligencia debida ni el asesoramiento de inversión individual.
        </p>
      </Section>

      <Section heading="Conflictos de interés y riesgos">
        <p>
          Véase{" "}
          <Link href="/interessenkonflikte" className="underline hover:text-foreground">
            Conflictos de Interés
          </Link>{" "}
          y{" "}
          <Link href="/risikohinweise" className="underline hover:text-foreground">
            Advertencias de Riesgo
          </Link>
          .
        </p>
        <p className="text-xs">Versión de la metodología: {METHODOLOGY_VERSION}</p>
      </Section>
    </>
  );
}

const CONTENT: Record<Locale, () => React.ReactElement> = {
  de: MethodikDE,
  en: MethodikEN,
  es: MethodikES,
};

export default async function MethodikPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const Content = CONTENT[locale];

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <Content />
    </div>
  );
}
