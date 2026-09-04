import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = { de: "Interessenkonflikte", en: "Conflicts of Interest", es: "Conflictos de Interés" }[locale];
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

function InteressenkonflikteDE() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Interessenkonflikte</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Wir legen hier offen, unter welchen Umständen bei TradeInsider Interessenkonflikte auftreten können und
        wie wir damit umgehen.
      </p>

      <Section heading="Mögliche Quellen von Interessenkonflikten">
        <p>Ein Interessenkonflikt kann insbesondere entstehen, wenn</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>der Betreiber (designz e.K.) eigene Aktien oder andere Positionen in einem analysierten Wertpapier hält,</li>
          <li>an der Erstellung einer Analyse beteiligte Personen Aktien des analysierten Unternehmens halten,</li>
          <li>Vergütungen im Zusammenhang mit einer Analyse oder einem Unternehmen bestehen,</li>
          <li>Kooperationen mit Unternehmen oder Dritten bestehen,</li>
          <li>Affiliate-Beziehungen bestehen (z. B. Provisionen für Empfehlungen von Drittanbietern),</li>
          <li>sonstige wirtschaftliche Interessen des Betreibers bestehen.</li>
        </ul>
      </Section>

      <Section heading="Offenlegung eigener Positionen">
        <p>
          Sofern der Betreiber zum Zeitpunkt der Fertigstellung einer Analyse eine Position im analysierten
          Wertpapier hält, wird dies bei der jeweiligen Analyse im Transparenz-&amp;-Disclosure-Block sichtbar
          offengelegt, zum Beispiel:
        </p>
        <p className="rounded-lg border border-border bg-surface-2 p-3 text-foreground">
          „Disclosure: Der Betreiber von TradeInsider hält zum Zeitpunkt der Fertigstellung dieser Analyse eine
          Long-Position in Aktien des analysierten Unternehmens.“
        </p>
        <p>Besteht keine Position, wird das ebenso ausdrücklich angegeben:</p>
        <p className="rounded-lg border border-border bg-surface-2 p-3 text-foreground">
          „Disclosure: Der Betreiber von TradeInsider hält zum Zeitpunkt der Fertigstellung dieser Analyse keine
          Position in Aktien des analysierten Unternehmens.“
        </p>
        <p>
          Diese Angabe stammt jeweils aus einer echten Prüfung der Positionen zum Analysezeitpunkt — es wird nicht
          pauschal „keine Interessenkonflikte“ angezeigt.
        </p>
      </Section>

      <Section heading="Aktueller Stand">
        <p>
          Aktuell veröffentlicht TradeInsider noch keine Einzelanalysen mit Ratings, Kurszielen oder
          Positionsangaben — die Intelligence-Funktion ist in Vorbereitung (siehe{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Methodik &amp; Transparenz
          </Link>
          ). Sobald einzelne Analysen veröffentlicht werden, erscheint die konkrete Offenlegung wie oben
          beschrieben direkt bei der jeweiligen Analyse.
        </p>
      </Section>

      <Section heading="Weiterführende Hinweise">
        <p>
          Siehe auch{" "}
          <Link href="/risikohinweise" className="underline hover:text-foreground">
            Risikohinweise
          </Link>{" "}
          und{" "}
          <Link href="/agb" className="underline hover:text-foreground">
            AGB
          </Link>
          .
        </p>
      </Section>
    </>
  );
}

function InteressenkonflikteEN() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Conflicts of Interest</h1>
      <p className="mt-2 text-xs text-muted">
        This is an English translation for convenience. The German version is legally binding.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Here we disclose the circumstances under which conflicts of interest may arise at TradeInsider and how we
        handle them.
      </p>

      <Section heading="Possible sources of conflicts of interest">
        <p>A conflict of interest can arise in particular when:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>the operator (designz e.K.) holds shares or other positions in an analyzed security,</li>
          <li>persons involved in preparing an analysis hold shares of the analyzed company,</li>
          <li>compensation exists in connection with an analysis or a company,</li>
          <li>cooperations with companies or third parties exist,</li>
          <li>affiliate relationships exist (e.g. commissions for third-party referrals),</li>
          <li>other economic interests of the operator exist.</li>
        </ul>
      </Section>

      <Section heading="Disclosure of own positions">
        <p>
          If the operator holds a position in the analyzed security at the time an analysis is completed, this is
          disclosed visibly in the Transparency &amp; Disclosure block for that analysis, for example:
        </p>
        <p className="rounded-lg border border-border bg-surface-2 p-3 text-foreground">
          &quot;Disclosure: The operator of TradeInsider holds a long position in shares of the analyzed company
          at the time this analysis was completed.&quot;
        </p>
        <p>If no position is held, this is stated equally explicitly:</p>
        <p className="rounded-lg border border-border bg-surface-2 p-3 text-foreground">
          &quot;Disclosure: The operator of TradeInsider holds no position in shares of the analyzed company at
          the time this analysis was completed.&quot;
        </p>
        <p>
          This statement is based on an actual check of positions at the time of analysis — we do not display a
          blanket &quot;no conflicts of interest&quot; statement.
        </p>
      </Section>

      <Section heading="Current status">
        <p>
          TradeInsider does not currently publish individual analyses with ratings, price targets, or position
          disclosures — the Intelligence feature is in preparation (see{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Methodology &amp; Transparency
          </Link>
          ). Once individual analyses are published, the specific disclosure described above will appear directly
          with each analysis.
        </p>
      </Section>

      <Section heading="Further information">
        <p>
          See also{" "}
          <Link href="/risikohinweise" className="underline hover:text-foreground">
            Risk Disclosures
          </Link>{" "}
          and{" "}
          <Link href="/agb" className="underline hover:text-foreground">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </Section>
    </>
  );
}

function InteressenkonflikteES() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Conflictos de Interés</h1>
      <p className="mt-2 text-xs text-muted">
        Esta es una traducción al español a título informativo. La versión en alemán es la legalmente vinculante.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Aquí explicamos en qué circunstancias pueden surgir conflictos de interés en TradeInsider y cómo los
        gestionamos.
      </p>

      <Section heading="Posibles fuentes de conflictos de interés">
        <p>Un conflicto de interés puede surgir, en particular, cuando:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>el operador (designz e.K.) mantiene acciones u otras posiciones en un valor analizado,</li>
          <li>personas involucradas en la elaboración de un análisis poseen acciones de la empresa analizada,</li>
          <li>existe una remuneración relacionada con un análisis o una empresa,</li>
          <li>existen colaboraciones con empresas o terceros,</li>
          <li>existen relaciones de afiliación (p. ej. comisiones por recomendaciones de terceros),</li>
          <li>existen otros intereses económicos del operador.</li>
        </ul>
      </Section>

      <Section heading="Divulgación de posiciones propias">
        <p>
          Si el operador mantiene una posición en el valor analizado en el momento de finalizar un análisis, esto
          se divulga de forma visible en el bloque de Transparencia y Divulgación de dicho análisis, por ejemplo:
        </p>
        <p className="rounded-lg border border-border bg-surface-2 p-3 text-foreground">
          «Divulgación: el operador de TradeInsider mantiene una posición larga en acciones de la empresa
          analizada en el momento de finalizar este análisis.»
        </p>
        <p>Si no existe posición, se indica igualmente de forma explícita:</p>
        <p className="rounded-lg border border-border bg-surface-2 p-3 text-foreground">
          «Divulgación: el operador de TradeInsider no mantiene ninguna posición en acciones de la empresa
          analizada en el momento de finalizar este análisis.»
        </p>
        <p>
          Esta indicación procede siempre de una comprobación real de las posiciones en el momento del análisis —
          no mostramos de forma genérica «sin conflictos de interés».
        </p>
      </Section>

      <Section heading="Estado actual">
        <p>
          Actualmente TradeInsider aún no publica análisis individuales con ratings, precios objetivo o
          divulgación de posiciones — la función Intelligence está en preparación (véase{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Metodología y Transparencia
          </Link>
          ). En cuanto se publiquen análisis individuales, la divulgación concreta descrita arriba aparecerá
          directamente junto a cada análisis.
        </p>
      </Section>

      <Section heading="Más información">
        <p>
          Véase también{" "}
          <Link href="/risikohinweise" className="underline hover:text-foreground">
            Advertencias de Riesgo
          </Link>{" "}
          y{" "}
          <Link href="/agb" className="underline hover:text-foreground">
            Términos y Condiciones
          </Link>
          .
        </p>
      </Section>
    </>
  );
}

const CONTENT: Record<Locale, () => React.ReactElement> = {
  de: InteressenkonflikteDE,
  en: InteressenkonflikteEN,
  es: InteressenkonflikteES,
};

export default async function InteressenkonfliktePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const Content = CONTENT[locale];

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <Content />
    </div>
  );
}
