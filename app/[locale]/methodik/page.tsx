import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { SCORE_CATEGORIES, SCORE_BANDS, RATING_THRESHOLDS, DEFAULT_ANALYSIS_HORIZON_MONTHS, METHODOLOGY_VERSION } from "@/lib/methodology";

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

function WeightTable() {
  return (
    <table className="mt-2 w-full text-left text-sm">
      <tbody>
        {SCORE_CATEGORIES.map((c) => (
          <tr key={c.key} className="border-b border-border/60 last:border-0">
            <td className="py-1.5 text-foreground">{c.label}</td>
            <td className="py-1.5 text-right text-muted">{Math.round(c.weight * 100)} %</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ScoreBandTable() {
  return (
    <table className="mt-2 w-full text-left text-sm">
      <tbody>
        {SCORE_BANDS.map((b) => (
          <tr key={b.label} className="border-b border-border/60 last:border-0">
            <td className="py-1.5 text-foreground">
              {b.min}–{b.max}
            </td>
            <td className="py-1.5 text-right text-muted">{b.label}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RatingTable() {
  return (
    <table className="mt-2 w-full text-left text-sm">
      <tbody>
        {RATING_THRESHOLDS.map((r) => (
          <tr key={r.rating} className="border-b border-border/60 last:border-0">
            <td className="py-1.5 font-medium text-foreground">{r.rating}</td>
            <td className="py-1.5 text-right text-muted">{r.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MethodikDE() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Methodik &amp; Transparenz</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Diese Seite beschreibt, wie der TradeInsider-Score, Ratings und Kursziele berechnet werden sollen.{" "}
        <strong className="text-foreground">
          Hinweis: Die Intelligence-Funktion befindet sich noch in Vorbereitung — die hier beschriebene Methodik
          ist ein Entwurf und noch nicht final festgelegt.
        </strong>
      </p>
      {/* TODO – Methodik vor Launch final festlegen */}
      {/* TODO LEGAL REVIEW – Rating-System */}

      <Section heading="TradeInsider Score (0–100)">
        <p>Der Score fasst fünf Kategorien mit folgender vorläufiger Gewichtung zusammen:</p>
        <WeightTable />
        <p className="text-xs">
          Genaue Berechnungsformel je Kategorie: TODO – Methodik vor Launch final festlegen.
        </p>
      </Section>

      <Section heading="Bedeutung der Score-Bänder">
        <ScoreBandTable />
        <p>Der Score ist ein zusammenfassender Indikator, keine Wahrscheinlichkeit und keine Erfolgsgarantie.</p>
      </Section>

      <Section heading="BUY/HOLD/SELL">
        <p>Mögliche Definition (Analyse-Horizont: {DEFAULT_ANALYSIS_HORIZON_MONTHS} Monate):</p>
        <RatingTable />
      </Section>

      <Section heading="Kursziele">
        <p>Kursziele sollen sich aus einer Kombination mehrerer Modelle ergeben, u. a.:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Discounted-Cashflow-Modell (DCF)</li>
          <li>Multiples-Vergleich mit Peer-Unternehmen</li>
          <li>Analystenschätzungen Dritter</li>
        </ul>
        <p>Dabei werden drei Szenarien ausgewiesen: Bear Case, Base Case, Bull Case.</p>
      </Section>

      <Section heading="Datenquellen und Datenstand">
        <p>
          Jede Analyse weist ihre Datenquellen, den Datenstand, den Analysezeitpunkt und die
          Veröffentlichungszeit gesondert aus (siehe Transparenz-&amp;-Disclosure-Block je Analyse).
          Aktualisierungsintervalle und die konkrete Methodik-Version werden dort ebenfalls angegeben.
        </p>
      </Section>

      <Section heading="Grenzen der Methodik">
        <p>
          Automatisiert berechnete Scores und Ratings können Fehleinschätzungen enthalten, insbesondere bei
          lückenhaften, verzögerten oder fehlerhaften Ausgangsdaten. Sie ersetzen keine eigene Prüfung und keine
          individuelle Anlageberatung.
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
        <p className="text-xs">Methodik-Version: {METHODOLOGY_VERSION} (Entwurf)</p>
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
        This page describes how the TradeInsider score, ratings, and price targets are intended to be
        calculated.{" "}
        <strong className="text-foreground">
          Note: the Intelligence feature is still in preparation — the methodology described here is a draft and
          not yet finalized.
        </strong>
      </p>

      <Section heading="TradeInsider Score (0–100)">
        <p>The score combines five categories with the following preliminary weighting:</p>
        <WeightTable />
        <p className="text-xs">Exact per-category formula: TODO — to be finalized before launch.</p>
      </Section>

      <Section heading="Meaning of the score bands">
        <ScoreBandTable />
        <p>The score is a summary indicator, not a probability and not a guarantee of success.</p>
      </Section>

      <Section heading="BUY/HOLD/SELL">
        <p>Possible definition (analysis horizon: {DEFAULT_ANALYSIS_HORIZON_MONTHS} months):</p>
        <RatingTable />
      </Section>

      <Section heading="Price targets">
        <p>Price targets are intended to result from a combination of several models, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Discounted cash flow model (DCF)</li>
          <li>Multiples comparison with peer companies</li>
          <li>Third-party analyst estimates</li>
        </ul>
        <p>Three scenarios are shown: Bear Case, Base Case, Bull Case.</p>
      </Section>

      <Section heading="Data sources and data status">
        <p>
          Each analysis states its data sources, data status, analysis date, and publication time separately (see
          the Transparency &amp; Disclosure block for each analysis). Update intervals and the specific
          methodology version are also stated there.
        </p>
      </Section>

      <Section heading="Limitations of the methodology">
        <p>
          Automatically calculated scores and ratings can be wrong, especially with incomplete, delayed, or
          inaccurate input data. They do not replace your own due diligence or individual investment advice.
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
        <p className="text-xs">Methodology version: {METHODOLOGY_VERSION} (draft)</p>
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
        Esta página describe cómo está previsto calcular la puntuación TradeInsider, los ratings y los precios
        objetivo.{" "}
        <strong className="text-foreground">
          Nota: la función Intelligence todavía está en preparación — la metodología aquí descrita es un borrador
          y aún no está definida de forma definitiva.
        </strong>
      </p>

      <Section heading="Puntuación TradeInsider (0–100)">
        <p>La puntuación combina cinco categorías con la siguiente ponderación preliminar:</p>
        <WeightTable />
        <p className="text-xs">Fórmula exacta por categoría: pendiente de definir antes del lanzamiento.</p>
      </Section>

      <Section heading="Significado de las bandas de puntuación">
        <ScoreBandTable />
        <p>La puntuación es un indicador resumen, no una probabilidad ni una garantía de éxito.</p>
      </Section>

      <Section heading="BUY/HOLD/SELL">
        <p>Definición posible (horizonte de análisis: {DEFAULT_ANALYSIS_HORIZON_MONTHS} meses):</p>
        <RatingTable />
      </Section>

      <Section heading="Precios objetivo">
        <p>Está previsto que los precios objetivo resulten de una combinación de varios modelos, entre ellos:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Modelo de flujo de caja descontado (DCF)</li>
          <li>Comparación de múltiplos con empresas comparables</li>
          <li>Estimaciones de analistas de terceros</li>
        </ul>
        <p>Se muestran tres escenarios: Bear Case, Base Case, Bull Case.</p>
      </Section>

      <Section heading="Fuentes y fecha de los datos">
        <p>
          Cada análisis indica por separado sus fuentes de datos, la fecha de los datos, la fecha del análisis y
          la hora de publicación (véase el bloque de Transparencia y Divulgación de cada análisis). Los
          intervalos de actualización y la versión concreta de la metodología también se indican allí.
        </p>
      </Section>

      <Section heading="Limitaciones de la metodología">
        <p>
          Las puntuaciones y ratings calculados automáticamente pueden ser incorrectos, especialmente con datos de
          entrada incompletos, tardíos o inexactos. No sustituyen tu propia diligencia debida ni el asesoramiento
          de inversión individual.
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
        <p className="text-xs">Versión de la metodología: {METHODOLOGY_VERSION} (borrador)</p>
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
