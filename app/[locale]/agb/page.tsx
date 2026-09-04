import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = { de: "AGB", en: "Terms & Conditions", es: "Términos y Condiciones" }[locale];
  return { title: `${title} — tradeinsider` };
}

function Section({ id, heading, children }: { id: string; heading: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-20">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

const SECTIONS_DE = [
  { id: "anbieter", label: "1. Anbieter und Geltungsbereich" },
  { id: "leistungsangebot", label: "2. Leistungsangebot" },
  { id: "registrierung", label: "3. Registrierung und Nutzerkonto" },
  { id: "kostenlos", label: "4. Kostenlose Leistungen" },
  { id: "intelligence", label: "5. TradeInsider Intelligence" },
  { id: "keine-beratung", label: "6. Keine individuelle Anlageberatung" },
  { id: "academy", label: "7. TradeInsider Academy" },
  { id: "vertragsschluss", label: "8. Vertragsschluss" },
  { id: "preise", label: "9. Preise und Zahlungsabwicklung" },
  { id: "abos", label: "10. Abonnements, Laufzeit und Verlängerung" },
  { id: "kuendigung", label: "11. Kündigung" },
  { id: "widerruf", label: "12. Widerrufsrecht" },
  { id: "verfuegbarkeit", label: "13. Verfügbarkeit" },
  { id: "datenquellen", label: "14. Daten und externe Informationsquellen" },
  { id: "nutzungsrechte", label: "15. Nutzungsrechte" },
  { id: "automatisiert", label: "16. Automatisierter Zugriff" },
  { id: "sperrung", label: "17. Pflichtverletzungen und Sperrung" },
  { id: "haftung", label: "18. Haftung" },
  { id: "aenderungen", label: "19. Änderungen der AGB" },
  { id: "recht", label: "20. Anwendbares Recht" },
  { id: "streitbeilegung", label: "21. Verbraucherstreitbeilegung" },
  { id: "kontakt", label: "22. Kontakt" },
] as const;

function Toc({ items }: { items: readonly { id: string; label: string }[] }) {
  return (
    <nav className="mt-6 rounded-2xl border border-border bg-surface p-4 text-sm">
      <ol className="grid gap-1 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="text-muted hover:text-foreground hover:underline">
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function AgbDE() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Allgemeine Geschäftsbedingungen</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Diese AGB regeln die Nutzung von tradeinsider.io. Sie gelten in ihrer bei Vertragsschluss gültigen Fassung.
      </p>
      <Toc items={SECTIONS_DE} />

      <Section id="anbieter" heading="1. Anbieter und Geltungsbereich">
        <p>
          Anbieter von tradeinsider.io ist designz e.K., Jörg Schmidtmann, Bornumer Weg 17, 30457 Hannover (siehe{" "}
          <Link href="/impressum" className="underline hover:text-foreground">
            Impressum
          </Link>
          ). Diese AGB gelten für alle Verträge zwischen designz e.K. und Nutzern von tradeinsider.io, sowohl
          Verbrauchern als auch Unternehmern. Abweichende Bedingungen des Nutzers werden nicht Vertragsbestandteil,
          es sei denn, wir stimmen ihrer Geltung ausdrücklich schriftlich zu.
        </p>
      </Section>

      <Section id="leistungsangebot" heading="2. Leistungsangebot">
        <p>
          TradeInsider stellt Informations-, Analyse- und Lerninhalte rund um Wertpapiere und Finanzmärkte bereit,
          unter anderem Übersichten zu Insider-Käufen, Marktdaten sowie — in kostenlosen und kostenpflichtigen
          Bereichen — weiterführende Auswertungen. Der konkrete Funktionsumfang kann sich weiterentwickeln.
        </p>
      </Section>

      <Section id="registrierung" heading="3. Registrierung und Nutzerkonto">
        <p>
          Für bestimmte Funktionen ist die Registrierung eines Nutzerkontos mit Email-Adresse und Passwort
          erforderlich. Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und uns über eine
          missbräuchliche Nutzung seines Kontos unverzüglich zu informieren.
        </p>
      </Section>

      <Section id="kostenlos" heading="4. Kostenlose Leistungen">
        <p>
          Bestimmte Inhalte (u. a. Insider-Trades von Politikern und Hedgefonds) stehen unentgeltlich zur
          Verfügung. Für unentgeltliche Leistungen besteht kein Anspruch auf Verfügbarkeit oder unveränderten
          Fortbestand; wir können den Umfang kostenloser Inhalte jederzeit mit Wirkung für die Zukunft anpassen.
        </p>
      </Section>

      <Section id="intelligence" heading="5. TradeInsider Intelligence">
        {/* TODO LEGAL REVIEW – Kapitalmarktrecht / MAR */}
        <p>
          TradeInsider Intelligence ist ein kostenpflichtiger Bereich, der fundamentale und technische Analysen zu
          Wertpapieren enthalten soll, einschließlich Scores, Ratings (z. B. BUY/HOLD/SELL), Kurszielen und
          Prognosen. Einzelheiten zur Berechnung finden sich unter{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Methodik &amp; Transparenz
          </Link>
          . Diese Inhalte sind allgemeiner Natur und stellen keine individuelle Anlageberatung dar (siehe Ziffer
          6). Mögliche Interessenkonflikte werden gemäß{" "}
          <Link href="/interessenkonflikte" className="underline hover:text-foreground">
            Interessenkonflikte
          </Link>{" "}
          offengelegt.
        </p>
        <p className="text-xs">
          TODO LEGAL REVIEW – Kapitalmarktrecht / MAR: Die genaue rechtliche Einordnung von Scores, Ratings und
          Kurszielen (insbesondere Art. 20 MAR und die Delegierte Verordnung (EU) 2016/958 zur sachgerechten
          Darstellung von Anlageempfehlungen) ist vor dem kommerziellen Launch fachanwaltlich zu prüfen.
        </p>
      </Section>

      <Section id="keine-beratung" heading="6. Keine individuelle Anlageberatung">
        <p>
          TradeInsider erbringt keine individuelle Anlageberatung, keine Finanzportfolioverwaltung und keine
          Anlagevermittlung im Sinne des Wertpapierhandelsgesetzes. Sämtliche Inhalte berücksichtigen nicht die
          persönlichen finanziellen Verhältnisse, Kenntnisse, Erfahrungen oder Ziele einzelner Nutzer. Nutzer
          treffen Anlageentscheidungen eigenverantwortlich. Siehe ergänzend{" "}
          <Link href="/risikohinweise" className="underline hover:text-foreground">
            Risikohinweise
          </Link>
          .
        </p>
      </Section>

      <Section id="academy" heading="7. TradeInsider Academy">
        <p>
          Die TradeInsider Academy dient der allgemeinen Wissensvermittlung rund um Trading und Finanzmärkte.
          Kurse, Guides, Beispiele und Musterportfolios sind zur Veranschaulichung gedacht und stellen keine
          Anlageempfehlung dar. Es besteht keine Erfolgsgarantie hinsichtlich des Lernerfolgs oder wirtschaftlicher
          Ergebnisse, die auf Grundlage der Academy-Inhalte erzielt werden.
        </p>
      </Section>

      <Section id="vertragsschluss" heading="8. Vertragsschluss">
        <p>
          Der Vertrag über ein kostenpflichtiges Abonnement kommt zustande, wenn der Nutzer den Bestellvorgang im
          Checkout abschließt und wir den Zahlungseingang bzw. die Zahlungsbestätigung unseres
          Zahlungsdienstleisters erhalten. Der Nutzer erhält eine Bestätigung über den Vertragsschluss.
        </p>
      </Section>

      <Section id="preise" heading="9. Preise und Zahlungsabwicklung">
        <p>
          Es gelten die zum Zeitpunkt der Bestellung im Checkout angezeigten Preise, jeweils inklusive der
          gesetzlichen Umsatzsteuer, soweit diese anfällt. Die Zahlungsabwicklung erfolgt über den
          Zahlungsdienstleister Stripe. Näheres dazu in unserer{" "}
          <Link href="/datenschutz" className="underline hover:text-foreground">
            Datenschutzerklärung
          </Link>
          .
        </p>
      </Section>

      <Section id="abos" heading="10. Abonnements, Laufzeit und Verlängerung">
        <p>
          Kostenpflichtige Abonnements werden wahlweise monatlich oder jährlich abgerechnet und verlängern sich
          automatisch um den jeweils gebuchten Zeitraum, sofern sie nicht vor Ablauf der laufenden Periode
          gekündigt werden. Die Abrechnung erfolgt jeweils im Voraus für den kommenden Abrechnungszeitraum.
        </p>
      </Section>

      <Section id="kuendigung" heading="11. Kündigung">
        <p>
          Nutzer können ihr Abonnement jederzeit zum Ende der laufenden Abrechnungsperiode kündigen — entweder
          direkt über die Kontoverwaltung (Stripe Billing Portal, sofortige Wirkung) oder über{" "}
          <Link href="/vertrag-kuendigen" className="underline hover:text-foreground">
            unser Kündigungsformular
          </Link>
          . Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
        </p>
      </Section>

      <Section id="widerruf" heading="12. Widerrufsrecht">
        <p>
          Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Einzelheiten dazu in unserer{" "}
          <Link href="/widerruf" className="underline hover:text-foreground">
            Widerrufsbelehrung
          </Link>
          . Widerrufe können über{" "}
          <Link href="/vertrag-widerrufen" className="underline hover:text-foreground">
            unser Widerrufsformular
          </Link>{" "}
          erklärt werden.
        </p>
      </Section>

      <Section id="verfuegbarkeit" heading="13. Verfügbarkeit">
        <p>
          Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit von tradeinsider.io, können jedoch
          keine ununterbrochene Verfügbarkeit garantieren, insbesondere nicht bei Wartungsarbeiten, höherer Gewalt
          oder Störungen bei eingesetzten Dienstleistern (u. a. Vercel, Supabase, Stripe).
        </p>
      </Section>

      <Section id="datenquellen" heading="14. Daten und externe Informationsquellen">
        <p>
          Die auf TradeInsider dargestellten Daten stammen unter anderem von SEC EDGAR, House Stock Watcher, EQS
          News sowie weiteren nationalen Meldestellen und Finanzdatenanbietern. Wir übernehmen keine Gewähr für
          die Richtigkeit, Vollständigkeit oder Aktualität dieser von Dritten stammenden Daten. Nutzer sollten die
          jeweils verlinkte Original-Meldung prüfen.
        </p>
      </Section>

      <Section id="nutzungsrechte" heading="15. Nutzungsrechte">
        <p>
          Inhalte auf TradeInsider dürfen für den persönlichen, nicht-kommerziellen Gebrauch genutzt werden.
          Kostenpflichtige Inhalte dürfen nicht systematisch vervielfältigt, weiterverkauft oder öffentlich
          verbreitet werden, insbesondere nicht an Dritte, die selbst keinen entsprechenden Zugang gebucht haben.
        </p>
      </Section>

      <Section id="automatisiert" heading="16. Automatisierter Zugriff">
        <p>
          Automatisierte Abrufe (Scraping, Bots, APIs) sind nur zulässig, soweit wir dies ausdrücklich gestatten,
          und dürfen die Funktionsfähigkeit von TradeInsider nicht beeinträchtigen. Unzulässiger automatisierter
          Zugriff kann zur Sperrung führen (siehe Ziffer 17).
        </p>
      </Section>

      <Section id="sperrung" heading="17. Pflichtverletzungen und Sperrung">
        <p>
          Bei Verstößen gegen diese AGB, insbesondere gegen Ziffer 15 oder 16, können wir den Zugang zum
          Nutzerkonto vorübergehend oder dauerhaft sperren. Gesetzliche Ansprüche bleiben hiervon unberührt.
        </p>
      </Section>

      <Section id="haftung" heading="18. Haftung">
        <p>
          Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach den Vorschriften des
          Produkthaftungsgesetzes, bei Verletzung von Leben, Körper oder Gesundheit. Bei leicht fahrlässiger
          Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) ist die Haftung auf den vertragstypisch
          vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.
          Für die inhaltliche Richtigkeit von Analysen, Scores, Ratings und Kurszielen sowie für wirtschaftliche
          Ergebnisse aufgrund der Nutzung von TradeInsider wird keine Haftung übernommen, soweit gesetzlich
          zulässig.
        </p>
      </Section>

      <Section id="aenderungen" heading="19. Änderungen der AGB">
        <p>
          Wir können diese AGB mit Wirkung für die Zukunft ändern, soweit dies zur Anpassung an geänderte
          rechtliche oder technische Rahmenbedingungen erforderlich ist. Über Änderungen informieren wir
          registrierte Nutzer in Textform mit angemessener Frist vor Inkrafttreten.
        </p>
      </Section>

      <Section id="recht" heading="20. Anwendbares Recht">
        <p>
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Bei Verbrauchern gilt dies nur insoweit, als
          nicht zwingende Verbraucherschutzvorschriften des Staates, in dem der Verbraucher seinen gewöhnlichen
          Aufenthalt hat, entgegenstehen.
        </p>
      </Section>

      <Section id="streitbeilegung" heading="21. Verbraucherstreitbeilegung">
        <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </Section>

      <Section id="kontakt" heading="22. Kontakt">
        <p>
          designz e.K., Bornumer Weg 17, 30457 Hannover — E-Mail:{" "}
          <a href="mailto:info@tradeinsider.io" className="underline hover:text-foreground">
            info@tradeinsider.io
          </a>
        </p>
      </Section>
    </>
  );
}

const SECTIONS_EN = SECTIONS_DE.map((s, i) => ({
  id: s.id,
  label: [
    "1. Provider and Scope",
    "2. Services",
    "3. Registration and User Account",
    "4. Free Services",
    "5. TradeInsider Intelligence",
    "6. No Individual Investment Advice",
    "7. TradeInsider Academy",
    "8. Formation of Contract",
    "9. Prices and Payment",
    "10. Subscriptions, Term and Renewal",
    "11. Cancellation",
    "12. Right of Withdrawal",
    "13. Availability",
    "14. Data and External Sources",
    "15. Usage Rights",
    "16. Automated Access",
    "17. Breaches and Suspension",
    "18. Liability",
    "19. Changes to these Terms",
    "20. Governing Law",
    "21. Consumer Dispute Resolution",
    "22. Contact",
  ][i],
}));

function AgbEN() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Terms &amp; Conditions</h1>
      <p className="mt-2 text-xs text-muted">This is an English translation for convenience. The German version is legally binding.</p>
      <Toc items={SECTIONS_EN} />

      <Section id="anbieter" heading="1. Provider and Scope">
        <p>
          The provider of tradeinsider.io is designz e.K., Jörg Schmidtmann, Bornumer Weg 17, 30457 Hannover,
          Germany (see{" "}
          <Link href="/impressum" className="underline hover:text-foreground">
            Legal Notice
          </Link>
          ). These Terms apply to all contracts between designz e.K. and users of tradeinsider.io, both consumers
          and businesses. Deviating terms of the user do not become part of the contract unless we expressly
          agree to them in writing.
        </p>
      </Section>

      <Section id="leistungsangebot" heading="2. Services">
        <p>
          TradeInsider provides information, analysis, and educational content related to securities and
          financial markets, including overviews of insider trades, market data, and — in free and paid areas —
          further analysis. The specific scope of features may evolve over time.
        </p>
      </Section>

      <Section id="registrierung" heading="3. Registration and User Account">
        <p>
          Certain features require registering a user account with an email address and password. The user must
          keep their credentials confidential and inform us immediately of any misuse of their account.
        </p>
      </Section>

      <Section id="kostenlos" heading="4. Free Services">
        <p>
          Certain content (e.g. insider trades by politicians and hedge funds) is available free of charge. There
          is no entitlement to the availability or unchanged continuation of free services; we may adjust the
          scope of free content at any time with effect for the future.
        </p>
      </Section>

      <Section id="intelligence" heading="5. TradeInsider Intelligence">
        <p>
          TradeInsider Intelligence is a paid area intended to contain fundamental and technical analyses of
          securities, including scores, ratings (e.g. BUY/HOLD/SELL), price targets, and forecasts. Details on
          how it is calculated are available under{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Methodology &amp; Transparency
          </Link>
          . This content is general in nature and does not constitute individual investment advice (see Section
          6). Potential conflicts of interest are disclosed pursuant to{" "}
          <Link href="/interessenkonflikte" className="underline hover:text-foreground">
            Conflicts of Interest
          </Link>
          .
        </p>
        <p className="text-xs">
          TODO LEGAL REVIEW — capital markets law / MAR: the precise legal classification of scores, ratings, and
          price targets (in particular Art. 20 MAR and Delegated Regulation (EU) 2016/958 on the fair presentation
          of investment recommendations) requires legal review before commercial launch.
        </p>
      </Section>

      <Section id="keine-beratung" heading="6. No Individual Investment Advice">
        <p>
          TradeInsider does not provide individual investment advice, portfolio management, or investment
          brokerage within the meaning of German securities trading law. All content disregards the personal
          financial situation, knowledge, experience, or objectives of individual users. Users make investment
          decisions on their own responsibility. See also{" "}
          <Link href="/risikohinweise" className="underline hover:text-foreground">
            Risk Disclosures
          </Link>
          .
        </p>
      </Section>

      <Section id="academy" heading="7. TradeInsider Academy">
        <p>
          TradeInsider Academy provides general education on trading and financial markets. Courses, guides,
          examples, and sample portfolios are illustrative and do not constitute investment recommendations.
          There is no guarantee of learning outcomes or economic results achieved based on Academy content.
        </p>
      </Section>

      <Section id="vertragsschluss" heading="8. Formation of Contract">
        <p>
          The contract for a paid subscription is formed when the user completes the checkout process and we
          receive payment confirmation from our payment provider. The user receives confirmation of the contract.
        </p>
      </Section>

      <Section id="preise" heading="9. Prices and Payment">
        <p>
          The prices shown at checkout apply, including statutory VAT where applicable. Payment is processed via
          the payment provider Stripe. Further details in our{" "}
          <Link href="/datenschutz" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Section id="abos" heading="10. Subscriptions, Term and Renewal">
        <p>
          Paid subscriptions are billed monthly or annually, as selected, and renew automatically for the same
          period unless cancelled before the end of the current period. Billing occurs in advance for the
          upcoming billing period.
        </p>
      </Section>

      <Section id="kuendigung" heading="11. Cancellation">
        <p>
          Users may cancel their subscription at any time, effective at the end of the current billing period —
          either directly via account management (Stripe Billing Portal, immediate effect) or via{" "}
          <Link href="/vertrag-kuendigen" className="underline hover:text-foreground">
            our cancellation form
          </Link>
          . The right to extraordinary termination for good cause remains unaffected.
        </p>
      </Section>

      <Section id="widerruf" heading="12. Right of Withdrawal">
        <p>
          Consumers have a statutory right of withdrawal. Details in our{" "}
          <Link href="/widerruf" className="underline hover:text-foreground">
            Withdrawal Notice
          </Link>
          . Withdrawals can be declared via{" "}
          <Link href="/vertrag-widerrufen" className="underline hover:text-foreground">
            our withdrawal form
          </Link>
          .
        </p>
      </Section>

      <Section id="verfuegbarkeit" heading="13. Availability">
        <p>
          We aim for uninterrupted availability of tradeinsider.io but cannot guarantee continuous availability,
          in particular during maintenance, force majeure, or disruptions at third-party providers we use
          (including Vercel, Supabase, Stripe).
        </p>
      </Section>

      <Section id="datenquellen" heading="14. Data and External Sources">
        <p>
          Data shown on TradeInsider comes from sources including SEC EDGAR, House Stock Watcher, EQS News, and
          other national disclosure bodies and financial data providers. We give no warranty for the accuracy,
          completeness, or timeliness of this third-party data. Users should check the linked original filing.
        </p>
      </Section>

      <Section id="nutzungsrechte" heading="15. Usage Rights">
        <p>
          Content on TradeInsider may be used for personal, non-commercial purposes. Paid content may not be
          systematically reproduced, resold, or publicly redistributed, in particular not to third parties who
          have not booked corresponding access themselves.
        </p>
      </Section>

      <Section id="automatisiert" heading="16. Automated Access">
        <p>
          Automated access (scraping, bots, APIs) is only permitted to the extent we expressly allow it, and must
          not impair the functioning of TradeInsider. Unauthorized automated access may lead to suspension (see
          Section 17).
        </p>
      </Section>

      <Section id="sperrung" heading="17. Breaches and Suspension">
        <p>
          In case of violations of these Terms, in particular Sections 15 or 16, we may temporarily or
          permanently suspend access to the user account. Statutory claims remain unaffected.
        </p>
      </Section>

      <Section id="haftung" heading="18. Liability">
        <p>
          We are liable without limitation for intent and gross negligence, under the German Product Liability
          Act, and for injury to life, body, or health. For slightly negligent breach of material contractual
          obligations, liability is limited to foreseeable, typical damage. Otherwise, liability for slight
          negligence is excluded. We assume no liability for the factual accuracy of analyses, scores, ratings,
          and price targets, nor for economic results from using TradeInsider, to the extent permitted by law.
        </p>
      </Section>

      <Section id="aenderungen" heading="19. Changes to these Terms">
        <p>
          We may amend these Terms with effect for the future to the extent necessary to adapt to changed legal
          or technical circumstances. We will inform registered users of changes in text form with reasonable
          notice before they take effect.
        </p>
      </Section>

      <Section id="recht" heading="20. Governing Law">
        <p>
          German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. For
          consumers, this applies only to the extent that mandatory consumer protection provisions of the
          consumer&apos;s habitual residence do not conflict with it.
        </p>
      </Section>

      <Section id="streitbeilegung" heading="21. Consumer Dispute Resolution">
        <p>We are not willing and not obligated to participate in dispute resolution proceedings before a consumer arbitration board.</p>
      </Section>

      <Section id="kontakt" heading="22. Contact">
        <p>
          designz e.K., Bornumer Weg 17, 30457 Hannover, Germany — Email:{" "}
          <a href="mailto:info@tradeinsider.io" className="underline hover:text-foreground">
            info@tradeinsider.io
          </a>
        </p>
      </Section>
    </>
  );
}

const SECTIONS_ES = SECTIONS_DE.map((s, i) => ({
  id: s.id,
  label: [
    "1. Proveedor y Ámbito de Aplicación",
    "2. Oferta de Servicios",
    "3. Registro y Cuenta de Usuario",
    "4. Servicios Gratuitos",
    "5. TradeInsider Intelligence",
    "6. Sin Asesoramiento de Inversión Individual",
    "7. TradeInsider Academy",
    "8. Celebración del Contrato",
    "9. Precios y Procesamiento de Pagos",
    "10. Suscripciones, Duración y Renovación",
    "11. Cancelación",
    "12. Derecho de Desistimiento",
    "13. Disponibilidad",
    "14. Datos y Fuentes Externas",
    "15. Derechos de Uso",
    "16. Acceso Automatizado",
    "17. Incumplimientos y Bloqueo",
    "18. Responsabilidad",
    "19. Modificaciones de estos Términos",
    "20. Derecho Aplicable",
    "21. Resolución de Litigios con Consumidores",
    "22. Contacto",
  ][i],
}));

function AgbES() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Términos y Condiciones</h1>
      <p className="mt-2 text-xs text-muted">
        Esta es una traducción al español a título informativo. La versión en alemán es la legalmente vinculante.
      </p>
      <Toc items={SECTIONS_ES} />

      <Section id="anbieter" heading="1. Proveedor y Ámbito de Aplicación">
        <p>
          El proveedor de tradeinsider.io es designz e.K., Jörg Schmidtmann, Bornumer Weg 17, 30457 Hannover,
          Alemania (véase{" "}
          <Link href="/impressum" className="underline hover:text-foreground">
            Aviso Legal
          </Link>
          ). Estos Términos se aplican a todos los contratos entre designz e.K. y los usuarios de tradeinsider.io,
          tanto consumidores como empresas. Las condiciones divergentes del usuario no forman parte del contrato,
          salvo que las aceptemos expresamente por escrito.
        </p>
      </Section>

      <Section id="leistungsangebot" heading="2. Oferta de Servicios">
        <p>
          TradeInsider ofrece contenido de información, análisis y educación relacionado con valores y mercados
          financieros, incluyendo resúmenes de operaciones de insiders, datos de mercado y, en áreas gratuitas y
          de pago, análisis adicionales. El alcance concreto de las funciones puede evolucionar.
        </p>
      </Section>

      <Section id="registrierung" heading="3. Registro y Cuenta de Usuario">
        <p>
          Determinadas funciones requieren registrar una cuenta de usuario con dirección de correo electrónico y
          contraseña. El usuario debe mantener sus credenciales en secreto e informarnos inmediatamente de
          cualquier uso indebido de su cuenta.
        </p>
      </Section>

      <Section id="kostenlos" heading="4. Servicios Gratuitos">
        <p>
          Determinado contenido (p. ej. operaciones de insiders de políticos y fondos de cobertura) está
          disponible de forma gratuita. No existe derecho a la disponibilidad ni a la continuidad inalterada de
          los servicios gratuitos; podemos ajustar el alcance del contenido gratuito en cualquier momento con
          efecto futuro.
        </p>
      </Section>

      <Section id="intelligence" heading="5. TradeInsider Intelligence">
        <p>
          TradeInsider Intelligence es un área de pago destinada a contener análisis fundamentales y técnicos de
          valores, incluyendo puntuaciones, ratings (p. ej. BUY/HOLD/SELL), precios objetivo y previsiones. Los
          detalles de cálculo están disponibles en{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Metodología y Transparencia
          </Link>
          . Este contenido es de carácter general y no constituye asesoramiento de inversión individual (véase
          el punto 6). Los posibles conflictos de interés se divulgan conforme a{" "}
          <Link href="/interessenkonflikte" className="underline hover:text-foreground">
            Conflictos de Interés
          </Link>
          .
        </p>
        <p className="text-xs">
          TODO LEGAL REVIEW — derecho de los mercados de capitales / MAR: la clasificación jurídica exacta de
          puntuaciones, ratings y precios objetivo (en particular el art. 20 MAR y el Reglamento Delegado (UE)
          2016/958 sobre la presentación imparcial de las recomendaciones de inversión) debe revisarse legalmente
          antes del lanzamiento comercial.
        </p>
      </Section>

      <Section id="keine-beratung" heading="6. Sin Asesoramiento de Inversión Individual">
        <p>
          TradeInsider no presta asesoramiento de inversión individual, gestión de carteras ni intermediación de
          inversión en el sentido de la ley alemana del mercado de valores. Todo el contenido no tiene en cuenta
          la situación financiera personal, los conocimientos, la experiencia ni los objetivos de cada usuario.
          Los usuarios toman sus decisiones de inversión bajo su propia responsabilidad. Véase también{" "}
          <Link href="/risikohinweise" className="underline hover:text-foreground">
            Advertencias de Riesgo
          </Link>
          .
        </p>
      </Section>

      <Section id="academy" heading="7. TradeInsider Academy">
        <p>
          TradeInsider Academy ofrece formación general sobre trading y mercados financieros. Cursos, guías,
          ejemplos y carteras modelo son ilustrativos y no constituyen recomendaciones de inversión. No existe
          garantía de resultados de aprendizaje ni de resultados económicos obtenidos a partir del contenido de
          la Academy.
        </p>
      </Section>

      <Section id="vertragsschluss" heading="8. Celebración del Contrato">
        <p>
          El contrato de una suscripción de pago se celebra cuando el usuario completa el proceso de compra y
          recibimos la confirmación de pago de nuestro proveedor de pagos. El usuario recibe una confirmación de
          la celebración del contrato.
        </p>
      </Section>

      <Section id="preise" heading="9. Precios y Procesamiento de Pagos">
        <p>
          Se aplican los precios mostrados en el proceso de compra, incluido el IVA legal cuando corresponda. El
          procesamiento de pagos se realiza a través del proveedor de pagos Stripe. Más detalles en nuestra{" "}
          <Link href="/datenschutz" className="underline hover:text-foreground">
            Política de Privacidad
          </Link>
          .
        </p>
      </Section>

      <Section id="abos" heading="10. Suscripciones, Duración y Renovación">
        <p>
          Las suscripciones de pago se facturan mensual o anualmente, según se elija, y se renuevan
          automáticamente por el mismo período salvo que se cancelen antes de que finalice el período en curso. La
          facturación se realiza por adelantado para el próximo período de facturación.
        </p>
      </Section>

      <Section id="kuendigung" heading="11. Cancelación">
        <p>
          Los usuarios pueden cancelar su suscripción en cualquier momento, con efecto al final del período de
          facturación en curso — directamente a través de la gestión de la cuenta (portal de facturación de
          Stripe, efecto inmediato) o mediante{" "}
          <Link href="/vertrag-kuendigen" className="underline hover:text-foreground">
            nuestro formulario de cancelación
          </Link>
          . El derecho de rescisión extraordinaria por causa justificada permanece inalterado.
        </p>
      </Section>

      <Section id="widerruf" heading="12. Derecho de Desistimiento">
        <p>
          Los consumidores tienen un derecho de desistimiento legal. Detalles en nuestra{" "}
          <Link href="/widerruf" className="underline hover:text-foreground">
            Información sobre el Derecho de Desistimiento
          </Link>
          . El desistimiento puede declararse mediante{" "}
          <Link href="/vertrag-widerrufen" className="underline hover:text-foreground">
            nuestro formulario de desistimiento
          </Link>
          .
        </p>
      </Section>

      <Section id="verfuegbarkeit" heading="13. Disponibilidad">
        <p>
          Nos esforzamos por ofrecer la disponibilidad más ininterrumpida posible de tradeinsider.io, pero no
          podemos garantizar una disponibilidad continua, en particular durante trabajos de mantenimiento, casos
          de fuerza mayor o interrupciones en los proveedores externos utilizados (incluidos Vercel, Supabase y
          Stripe).
        </p>
      </Section>

      <Section id="datenquellen" heading="14. Datos y Fuentes Externas">
        <p>
          Los datos mostrados en TradeInsider proceden, entre otras, de SEC EDGAR, House Stock Watcher, EQS News y
          otros organismos nacionales de divulgación y proveedores de datos financieros. No garantizamos la
          exactitud, integridad o actualidad de estos datos de terceros. Los usuarios deben consultar la
          publicación original enlazada.
        </p>
      </Section>

      <Section id="nutzungsrechte" heading="15. Derechos de Uso">
        <p>
          El contenido de TradeInsider puede utilizarse para uso personal y no comercial. El contenido de pago no
          puede reproducirse sistemáticamente, revenderse ni difundirse públicamente, en particular a terceros que
          no hayan contratado el acceso correspondiente por sí mismos.
        </p>
      </Section>

      <Section id="automatisiert" heading="16. Acceso Automatizado">
        <p>
          El acceso automatizado (scraping, bots, APIs) solo está permitido en la medida en que lo autoricemos
          expresamente, y no debe perjudicar el funcionamiento de TradeInsider. El acceso automatizado no
          autorizado puede dar lugar al bloqueo (véase el punto 17).
        </p>
      </Section>

      <Section id="sperrung" heading="17. Incumplimientos y Bloqueo">
        <p>
          En caso de infracción de estos Términos, en particular de los puntos 15 o 16, podemos bloquear temporal o
          permanentemente el acceso a la cuenta de usuario. Los derechos legales permanecen inalterados.
        </p>
      </Section>

      <Section id="haftung" heading="18. Responsabilidad">
        <p>
          Respondemos sin limitación por dolo y negligencia grave, conforme a la ley alemana de responsabilidad
          por productos, y por daños a la vida, el cuerpo o la salud. En caso de incumplimiento levemente
          negligente de obligaciones contractuales esenciales, la responsabilidad se limita al daño previsible y
          típico del contrato. En lo demás, se excluye la responsabilidad por negligencia leve. No asumimos
          responsabilidad por la exactitud del contenido de análisis, puntuaciones, ratings y precios objetivo, ni
          por resultados económicos derivados del uso de TradeInsider, en la medida permitida por la ley.
        </p>
      </Section>

      <Section id="aenderungen" heading="19. Modificaciones de estos Términos">
        <p>
          Podemos modificar estos Términos con efecto futuro en la medida necesaria para adaptarlos a
          circunstancias legales o técnicas modificadas. Informaremos a los usuarios registrados de los cambios
          por escrito con un plazo razonable antes de su entrada en vigor.
        </p>
      </Section>

      <Section id="recht" heading="20. Derecho Aplicable">
        <p>
          Se aplica el derecho alemán, con exclusión de la Convención de las Naciones Unidas sobre los Contratos
          de Compraventa Internacional de Mercaderías. Para los consumidores, esto se aplica únicamente en la
          medida en que no se opongan disposiciones imperativas de protección al consumidor del país de residencia
          habitual del consumidor.
        </p>
      </Section>

      <Section id="streitbeilegung" heading="21. Resolución de Litigios con Consumidores">
        <p>No estamos dispuestos ni obligados a participar en procedimientos de resolución de litigios ante un organismo de arbitraje de consumo.</p>
      </Section>

      <Section id="kontakt" heading="22. Contacto">
        <p>
          designz e.K., Bornumer Weg 17, 30457 Hannover, Alemania — Correo electrónico:{" "}
          <a href="mailto:info@tradeinsider.io" className="underline hover:text-foreground">
            info@tradeinsider.io
          </a>
        </p>
      </Section>
    </>
  );
}

const CONTENT: Record<Locale, () => React.ReactElement> = {
  de: AgbDE,
  en: AgbEN,
  es: AgbES,
};

export default async function AgbPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const Content = CONTENT[locale];

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <Content />
    </div>
  );
}
