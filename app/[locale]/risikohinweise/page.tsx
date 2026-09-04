import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = { de: "Risikohinweise", en: "Risk Disclosures", es: "Advertencias de Riesgo" }[locale];
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

function RisikohinweiseDE() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Risikohinweise</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        TradeInsider ist eine Informations-, Analyse- und Bildungsplattform — keine Anlageberatung. Bitte lies
        diese Hinweise, bevor du Inhalte von TradeInsider für deine Anlageentscheidungen nutzt.
      </p>

      <Section heading="Keine individuelle Beratung">
        <p>
          Die allgemeinen Inhalte von TradeInsider berücksichtigen nicht die persönlichen finanziellen
          Verhältnisse, Anlageziele, Kenntnisse, Erfahrungen oder die persönliche Risikobereitschaft einzelner
          Nutzer. Sie ersetzen keine individuelle Anlageberatung durch eine dazu befugte Person oder Institution.
        </p>
      </Section>

      <Section heading="Ratings, Scores und Prognosen">
        <p>
          Wir veröffentlichen Ratings, Scores, Kursziele und Prognosen. Die tatsächliche Entwicklung kann
          erheblich von diesen Einschätzungen abweichen. Es besteht keine Garantie für steigende Kurse, das
          Erreichen von Kurszielen, Gewinne oder die Vermeidung von Verlusten.
        </p>
      </Section>

      <Section heading="Kapitalmarktrisiken">
        <p>
          Wertpapiere können im Wert steigen oder fallen. Ein vollständiger Verlust des eingesetzten Kapitals ist
          möglich. Die historische Wertentwicklung ist kein verlässlicher Indikator für die zukünftige
          Entwicklung.
        </p>
      </Section>

      <Section heading="Grundlage unserer Prognosen">
        <p>
          Prognosen beruhen auf Annahmen und den zum Analysezeitpunkt verfügbaren Daten. Daten können fehlerhaft,
          unvollständig, verzögert oder überholt sein.
        </p>
      </Section>

      <Section heading="Einzelne Kennzahlen nicht isoliert betrachten">
        <p>
          Triff Anlageentscheidungen nicht ausschließlich auf Basis eines einzelnen Scores oder Ratings. Achte
          stets auf Analysezeitpunkt und Datenstand der jeweiligen Information — beides wird bei jeder Analyse im
          Transparenz-&amp;-Disclosure-Block ausgewiesen.
        </p>
      </Section>

      <Section heading="Interessenkonflikte">
        <p>
          Mögliche Interessenkonflikte (z. B. eigene Positionen des Betreibers) werden separat offengelegt, siehe{" "}
          <Link href="/interessenkonflikte" className="underline hover:text-foreground">
            Interessenkonflikte
          </Link>
          .
        </p>
      </Section>

      <Section heading="TradeInsider Academy">
        <p>
          Die Inhalte der TradeInsider Academy dienen der allgemeinen Wissensvermittlung. Sie berücksichtigen
          nicht die persönliche finanzielle Situation, Anlageziele oder individuelle Risikobereitschaft. Beispiele,
          Strategien und Musterportfolios dienen der Veranschaulichung, nicht der Empfehlung.
        </p>
      </Section>

      <Section heading="Methodik">
        <p>
          Details zur Berechnung von Scores und Ratings findest du unter{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Methodik &amp; Transparenz
          </Link>
          .
        </p>
      </Section>
    </>
  );
}

function RisikohinweiseEN() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Risk Disclosures</h1>
      <p className="mt-2 text-xs text-muted">
        This is an English translation for convenience. The German version is legally binding.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        TradeInsider is an information, analysis, and education platform — not investment advice. Please read
        these disclosures before using TradeInsider content for your investment decisions.
      </p>

      <Section heading="No individual advice">
        <p>
          The general content on TradeInsider does not take into account the personal financial situation,
          investment objectives, knowledge, experience, or individual risk tolerance of any user. It does not
          replace individual investment advice from an authorized person or institution.
        </p>
      </Section>

      <Section heading="Ratings, scores, and forecasts">
        <p>
          We publish ratings, scores, price targets, and forecasts. Actual developments may differ significantly
          from these assessments. There is no guarantee of rising prices, reaching price targets, profits, or
          avoiding losses.
        </p>
      </Section>

      <Section heading="Capital market risks">
        <p>
          Securities can rise or fall in value. A total loss of invested capital is possible. Past performance is
          not a reliable indicator of future performance.
        </p>
      </Section>

      <Section heading="Basis of our forecasts">
        <p>Forecasts are based on assumptions and the data available at the time of analysis. Data may be inaccurate, incomplete, delayed, or outdated.</p>
      </Section>

      <Section heading="Don't rely on a single metric">
        <p>
          Do not base investment decisions solely on a single score or rating. Always note the analysis date and
          data status of the respective information — both are shown in the Transparency &amp; Disclosure block
          for each analysis.
        </p>
      </Section>

      <Section heading="Conflicts of interest">
        <p>
          Potential conflicts of interest (e.g. positions held by the operator) are disclosed separately, see{" "}
          <Link href="/interessenkonflikte" className="underline hover:text-foreground">
            Conflicts of Interest
          </Link>
          .
        </p>
      </Section>

      <Section heading="TradeInsider Academy">
        <p>
          The content of TradeInsider Academy is for general educational purposes. It does not take into account
          your personal financial situation, investment objectives, or individual risk tolerance. Examples,
          strategies, and sample portfolios are illustrative, not recommendations.
        </p>
      </Section>

      <Section heading="Methodology">
        <p>
          Details on how scores and ratings are calculated can be found under{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Methodology &amp; Transparency
          </Link>
          .
        </p>
      </Section>
    </>
  );
}

function RisikohinweiseES() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Advertencias de Riesgo</h1>
      <p className="mt-2 text-xs text-muted">
        Esta es una traducción al español a título informativo. La versión en alemán es la legalmente vinculante.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        TradeInsider es una plataforma de información, análisis y educación — no es asesoramiento de inversión.
        Lee estas advertencias antes de utilizar el contenido de TradeInsider para tus decisiones de inversión.
      </p>

      <Section heading="Sin asesoramiento individual">
        <p>
          El contenido general de TradeInsider no tiene en cuenta la situación financiera personal, los objetivos
          de inversión, los conocimientos, la experiencia ni la tolerancia individual al riesgo de cada usuario.
          No sustituye el asesoramiento de inversión individual por parte de una persona o entidad autorizada.
        </p>
      </Section>

      <Section heading="Ratings, puntuaciones y previsiones">
        <p>
          Publicamos ratings, puntuaciones, precios objetivo y previsiones. La evolución real puede diferir
          considerablemente de estas estimaciones. No existe garantía de que suban los precios, de que se alcancen
          los precios objetivo, de obtener beneficios o de evitar pérdidas.
        </p>
      </Section>

      <Section heading="Riesgos de mercado de capitales">
        <p>
          Los valores pueden subir o bajar de valor. Es posible una pérdida total del capital invertido. La
          rentabilidad histórica no es un indicador fiable de la evolución futura.
        </p>
      </Section>

      <Section heading="Base de nuestras previsiones">
        <p>Las previsiones se basan en supuestos y en los datos disponibles en el momento del análisis. Los datos pueden ser incorrectos, incompletos, tardíos u obsoletos.</p>
      </Section>

      <Section heading="No te bases en una sola métrica">
        <p>
          No tomes decisiones de inversión basándote únicamente en una sola puntuación o rating. Ten siempre en
          cuenta la fecha de análisis y la fecha de los datos de cada información — ambas se muestran en el bloque
          de Transparencia y Divulgación de cada análisis.
        </p>
      </Section>

      <Section heading="Conflictos de interés">
        <p>
          Los posibles conflictos de interés (p. ej. posiciones del operador) se divulgan por separado, véase{" "}
          <Link href="/interessenkonflikte" className="underline hover:text-foreground">
            Conflictos de Interés
          </Link>
          .
        </p>
      </Section>

      <Section heading="TradeInsider Academy">
        <p>
          El contenido de TradeInsider Academy tiene fines educativos generales. No tiene en cuenta tu situación
          financiera personal, tus objetivos de inversión ni tu tolerancia individual al riesgo. Los ejemplos,
          estrategias y carteras modelo son ilustrativos, no recomendaciones.
        </p>
      </Section>

      <Section heading="Metodología">
        <p>
          Los detalles sobre el cálculo de puntuaciones y ratings están disponibles en{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Metodología y Transparencia
          </Link>
          .
        </p>
      </Section>
    </>
  );
}

const CONTENT: Record<Locale, () => React.ReactElement> = {
  de: RisikohinweiseDE,
  en: RisikohinweiseEN,
  es: RisikohinweiseES,
};

export default async function RisikohinweisePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const Content = CONTENT[locale];

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <Content />
    </div>
  );
}
