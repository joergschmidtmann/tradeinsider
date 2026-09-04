import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = { de: "Datenschutzerklärung", en: "Privacy Policy", es: "Política de Privacidad" }[locale];
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
  { id: "verantwortlicher", label: "1. Verantwortlicher" },
  { id: "allgemein", label: "2. Allgemeine Datenverarbeitung" },
  { id: "rechtsgrundlagen", label: "3. Rechtsgrundlagen" },
  { id: "hosting", label: "4. Hosting – Vercel" },
  { id: "analytics", label: "5. Vercel Web Analytics" },
  { id: "registrierung", label: "6. Registrierung / Nutzerkonto" },
  { id: "supabase", label: "7. Supabase" },
  { id: "cookies", label: "8. Sessions, Cookies und Browser-Speicher" },
  { id: "abos", label: "9. Kostenpflichtige Abos" },
  { id: "stripe", label: "10. Stripe" },
  { id: "strato", label: "11. E-Mail-Versand (STRATO)" },
  { id: "kontakt", label: "12. Kontakt" },
  { id: "servicemails", label: "13. Vertrags- und Service-E-Mails" },
  { id: "newsletter", label: "14. Newsletter" },
  { id: "empfaenger", label: "15. Empfänger" },
  { id: "drittland", label: "16. Drittlandübermittlung" },
  { id: "speicherdauer", label: "17. Speicherdauer" },
  { id: "sicherheit", label: "18. Sicherheit" },
  { id: "rechte", label: "19. Betroffenenrechte" },
  { id: "beschwerde", label: "20. Beschwerderecht" },
  { id: "automatisiert", label: "21. Automatisierte Entscheidungen" },
  { id: "aenderungen", label: "22. Änderungen" },
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

function DatenschutzDE() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Datenschutzerklärung</h1>
      <Toc items={SECTIONS_DE} />

      <Section id="verantwortlicher" heading="1. Verantwortlicher">
        <p>
          designz e.K., Jörg Schmidtmann, Bornumer Weg 17, 30457 Hannover, Deutschland
          <br />
          E-Mail: info@tradeinsider.io
        </p>
      </Section>

      <Section id="allgemein" heading="2. Allgemeine Datenverarbeitung">
        <p>
          Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung
          einer funktionsfähigen Website sowie unserer Inhalte und Leistungen erforderlich ist.
        </p>
      </Section>

      <Section id="rechtsgrundlagen" heading="3. Rechtsgrundlagen">
        <p>Je nach Verarbeitung stützen wir uns auf:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Einwilligung des Nutzers (Art. 6 Abs. 1 lit. a DSGVO),</li>
          <li>Erfüllung eines Vertrags oder vorvertragliche Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO),</li>
          <li>Erfüllung einer rechtlichen Verpflichtung, z. B. steuerrechtlicher Aufbewahrungspflichten (Art. 6 Abs. 1 lit. c DSGVO),</li>
          <li>berechtigte Interessen, sofern nicht die Interessen oder Grundrechte des Nutzers überwiegen (Art. 6 Abs. 1 lit. f DSGVO).</li>
        </ul>
        <p>Die jeweilige Rechtsgrundlage ist bei den einzelnen Verarbeitungen unten angegeben.</p>
      </Section>

      <Section id="hosting" heading="4. Hosting – Vercel">
        <p>
          Diese Website wird bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA, gehostet. Vercel
          verarbeitet dabei automatisch Server-Logfiles (z. B. IP-Adresse, Datum und Uhrzeit der Anfrage,
          angeforderte Seite, Referrer-URL, verwendeter Browser), um die Website technisch bereitzustellen und
          auszuliefern. Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren, funktionsfähigen
          Auslieferung der Website (Art. 6 Abs. 1 lit. f DSGVO). Mit Vercel besteht ein Vertrag zur
          Auftragsverarbeitung.
        </p>
        <p className="text-xs">
          TODO: Die genaue Vercel-Serverregion für die Laufzeit dieser Anwendung (nicht nur die Build-Region) ist
          aus dem Code nicht ablesbar und im Vercel-Dashboard zu verifizieren.
        </p>
      </Section>

      <Section id="analytics" heading="5. Vercel Web Analytics">
        <p>
          Wir nutzen Vercel Web Analytics zur anonymisierten, aggregierten Auswertung von Besucherzahlen und
          Seitenaufrufen. Der Dienst setzt nach Angaben von Vercel keine Cookies und erstellt keine
          personenbezogenen Nutzerprofile. Rechtsgrundlage ist unser berechtigtes Interesse an der statistischen
          Analyse des Nutzerverhaltens zur Verbesserung unseres Angebots (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </Section>

      <Section id="registrierung" heading="6. Registrierung / Nutzerkonto">
        <p>
          Für die Nutzung bestimmter Funktionen (insbesondere kostenpflichtiger Inhalte) können sich Nutzer mit
          E-Mail-Adresse und einem selbst gewählten Passwort registrieren. Die Verarbeitung erfolgt zur Erfüllung
          des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
      </Section>

      <Section id="supabase" heading="7. Supabase">
        <p>
          Für Authentifizierung, Nutzerkonten und die technische Datenhaltung setzen wir Supabase Inc., 970 Toa
          Payoh North #07-04, Singapur, als Auftragsverarbeiter ein. Passwörter werden verschlüsselt (gehasht)
          gespeichert, nicht im Klartext. Mit Supabase besteht ein Vertrag zur Auftragsverarbeitung.
        </p>
        <p className="text-xs">
          TODO: Die konkrete Supabase-Projektregion (Speicherort der Datenbank) ist aus dem Code nicht ablesbar und
          im Supabase-Dashboard zu verifizieren, um Abschnitt 16 (Drittlandübermittlung) exakt zu belegen.
        </p>
      </Section>

      <Section id="cookies" heading="8. Sessions, Cookies und Browser-Speicher">
        <p>
          Wir setzen ausschließlich technisch notwendige Cookies ein: einen Session-Cookie zur Aufrechterhaltung
          Ihrer Anmeldung (gesetzt über Supabase Auth) sowie einen Cookie zur Speicherung Ihrer Sprachpräferenz
          (Deutsch/Englisch/Spanisch). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO (Erfüllung des
          Nutzungsvertrags bzw. berechtigtes Interesse an einer funktionierenden Website); eine Einwilligung ist
          für rein technisch notwendige Cookies nicht erforderlich. Lokalen Browser-Speicher (Local/Session
          Storage) verwenden wir aktuell nicht.
        </p>
      </Section>

      <Section id="abos" heading="9. Kostenpflichtige Abos">
        <p>
          Für kostenpflichtige Abonnements (TradeInsider Intelligence, künftig ggf. TradeInsider Academy)
          verarbeiten wir zusätzlich zu den Kontodaten Angaben zum gebuchten Tarif, Abrechnungsintervall und
          Abo-Status, um den Vertrag zu erfüllen und zu verwalten (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
      </Section>

      <Section id="stripe" heading="10. Stripe">
        <p>
          Für den Abschluss und die Abrechnung kostenpflichtiger Abonnements nutzen wir den Zahlungsdienstleister
          Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin, Irland (bzw. verbundene Unternehmen
          der Stripe-Gruppe, einschließlich Stripe Inc., USA). Die für die Zahlungsabwicklung erforderlichen Daten
          (u. a. Name, Zahlungsmittelinformationen, Rechnungsadresse) werden direkt an Stripe übermittelt; wir
          selbst erhalten und speichern keine vollständigen Zahlungskartendaten. Rechtsgrundlage ist die
          Erfüllung des Abonnementvertrags (Art. 6 Abs. 1 lit. b DSGVO). Die Datenschutzhinweise von Stripe finden
          Sie unter{" "}
          <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            stripe.com/de/privacy
          </a>
          .
        </p>
      </Section>

      <Section id="strato" heading="11. E-Mail-Versand (STRATO)">
        <p>
          Für den Versand von E-Mails soll nach aktuellem Stand STRATO als E-Mail-Anbieter genutzt werden.
        </p>
        <p className="text-xs">
          TODO: Ob und für welche konkreten E-Mails (siehe Ziffer 13) STRATO tatsächlich als Versanddienst bzw.
          SMTP-Relay eingesetzt wird, ist aus dem Quellcode dieser Anwendung nicht ersichtlich — die
          Auth-Bestätigungs- und Passwort-Reset-Mails werden, sofern nicht per Custom-SMTP konfiguriert, technisch
          über den Standard-Mailer von Supabase Auth versendet. Dieser Abschnitt ist entsprechend der tatsächlichen
          Konfiguration im Supabase-Dashboard zu verifizieren und zu präzisieren, bevor er kommerziell verlässlich
          ist.
        </p>
      </Section>

      <Section id="kontakt" heading="12. Kontakt">
        <p>
          Bei Kontaktaufnahme per E-Mail werden die von Ihnen mitgeteilten Daten zur Bearbeitung der Anfrage
          gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO, je nachdem, ob die Anfrage in
          Zusammenhang mit einem Vertrag steht.
        </p>
      </Section>

      <Section id="servicemails" heading="13. Vertrags- und Service-E-Mails">
        <p>
          Im Zusammenhang mit Ihrem Nutzerkonto und Abonnement versenden wir bzw. unsere Dienstleister
          automatisiert E-Mails, u. a. zur Registrierung/E-Mail-Bestätigung, zum Zurücksetzen des Passworts, zur
          Vertragsbestätigung, zu Zahlungs-/Rechnungsinformationen sowie zur Bestätigung von Kündigungen und
          Widerrufen. Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
      </Section>

      <Section id="newsletter" heading="14. Newsletter">
        <p>Wir bieten aktuell keinen Newsletter an. Sollte künftig ein Newsletter eingeführt werden, wird diese Erklärung vorab um die entsprechenden Angaben (Rechtsgrundlage, Anbieter, Widerrufsmöglichkeit) ergänzt.</p>
      </Section>

      <Section id="empfaenger" heading="15. Empfänger">
        <p>
          Empfänger Ihrer Daten sind, soweit für die jeweilige Verarbeitung erforderlich, die oben genannten
          Auftragsverarbeiter (Vercel, Supabase, Stripe sowie ggf. STRATO), nicht jedoch sonstige Dritte, sofern
          nicht gesetzlich zur Weitergabe verpflichtet.
        </p>
      </Section>

      <Section id="drittland" heading="16. Drittlandübermittlung">
        <p>
          Einige der von uns eingesetzten Dienstleister (Vercel, Supabase, Stripe) verarbeiten Daten auch in den
          USA bzw. außerhalb der EU/des EWR. Soweit Daten in Länder ohne Angemessenheitsbeschluss der
          EU-Kommission übermittelt werden, erfolgt dies auf Grundlage von EU-Standardvertragsklauseln gemäß
          Art. 46 DSGVO.
        </p>
      </Section>

      <Section id="speicherdauer" heading="17. Speicherdauer">
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie dies für den jeweiligen Zweck erforderlich ist
          oder gesetzliche Aufbewahrungspflichten (insbesondere handels- und steuerrechtliche, regelmäßig 6–10
          Jahre für Rechnungs-/Buchhaltungsunterlagen) bestehen. Kontodaten werden bei Löschung des Nutzerkontos
          gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </p>
        <p className="text-xs">TODO: exakte Löschfristen je Datenkategorie vor Launch final festlegen.</p>
      </Section>

      <Section id="sicherheit" heading="18. Sicherheit">
        <p>
          Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten gegen Verlust, Missbrauch und
          unbefugten Zugriff zu schützen, u. a. Verschlüsselung der Datenübertragung (TLS) und verschlüsselte
          Speicherung von Passwörtern. Diese Maßnahmen werden dem Stand der Technik entsprechend fortlaufend
          angepasst.
        </p>
      </Section>

      <Section id="rechte" heading="19. Betroffenenrechte">
        <p>Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
          <li>Recht auf Berichtigung oder Löschung (Art. 16, 17 DSGVO)</li>
          <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruchsrecht gegen die Verarbeitung (Art. 21 DSGVO)</li>
          <li>Recht auf Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
        </ul>
      </Section>

      <Section id="beschwerde" heading="20. Beschwerderecht">
        <p>
          Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer
          personenbezogenen Daten durch uns zu beschweren, z. B. bei der Landesbeauftragten für Datenschutz und
          Informationsfreiheit Niedersachsen.
        </p>
      </Section>

      <Section id="automatisiert" heading="21. Automatisierte Entscheidungen">
        <p>
          Wir setzen keine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von Art. 22 DSGVO
          ein, die Ihnen gegenüber rechtliche Wirkung entfaltet oder Sie in ähnlicher Weise erheblich
          beeinträchtigt. Von TradeInsider veröffentlichte Scores und Ratings (siehe{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Methodik
          </Link>
          ) sind allgemeine Analyseinhalte, keine automatisierten Einzelfallentscheidungen über Sie als Person.
        </p>
      </Section>

      <Section id="aenderungen" heading="22. Änderungen">
        <p>
          Wir passen diese Datenschutzerklärung an, sobald sich die Datenverarbeitung oder die Rechtslage ändern.
          Es gilt jeweils die auf dieser Seite veröffentlichte Fassung.
        </p>
      </Section>
    </>
  );
}

const SECTIONS_EN = SECTIONS_DE.map((s, i) => ({
  id: s.id,
  label: [
    "1. Controller",
    "2. General Data Processing",
    "3. Legal Bases",
    "4. Hosting – Vercel",
    "5. Vercel Web Analytics",
    "6. Registration / User Account",
    "7. Supabase",
    "8. Sessions, Cookies and Browser Storage",
    "9. Paid Subscriptions",
    "10. Stripe",
    "11. Email Delivery (STRATO)",
    "12. Contact",
    "13. Contract and Service Emails",
    "14. Newsletter",
    "15. Recipients",
    "16. Third-Country Transfers",
    "17. Retention Period",
    "18. Security",
    "19. Your Rights",
    "20. Right to Complain",
    "21. Automated Decisions",
    "22. Changes",
  ][i],
}));

function DatenschutzEN() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-xs text-muted">This is an English translation for convenience. The German version is legally binding and governs.</p>
      <Toc items={SECTIONS_EN} />

      <Section id="verantwortlicher" heading="1. Controller">
        <p>
          designz e.K., Jörg Schmidtmann, Bornumer Weg 17, 30457 Hannover, Germany
          <br />
          Email: info@tradeinsider.io
        </p>
      </Section>

      <Section id="allgemein" heading="2. General Data Processing">
        <p>We process personal data of our users only to the extent necessary to provide a functioning website and our content and services.</p>
      </Section>

      <Section id="rechtsgrundlagen" heading="3. Legal Bases">
        <p>Depending on the processing, we rely on:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>user consent (Art. 6(1)(a) GDPR),</li>
          <li>performance of a contract or pre-contractual measures (Art. 6(1)(b) GDPR),</li>
          <li>compliance with a legal obligation, e.g. tax retention duties (Art. 6(1)(c) GDPR),</li>
          <li>legitimate interests, unless overridden by your interests or fundamental rights (Art. 6(1)(f) GDPR).</li>
        </ul>
        <p>The applicable legal basis is stated for each processing activity below.</p>
      </Section>

      <Section id="hosting" heading="4. Hosting – Vercel">
        <p>
          This website is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA. Vercel
          automatically processes server log files (e.g. IP address, date and time of the request, requested
          page, referrer URL, browser used) to technically deliver the website. Legal basis is our legitimate
          interest in a secure, functional delivery of the website (Art. 6(1)(f) GDPR). A data processing
          agreement is in place with Vercel.
        </p>
        <p className="text-xs">TODO: the exact Vercel runtime server region (not just the build region) is not evident from the code and must be verified in the Vercel dashboard.</p>
      </Section>

      <Section id="analytics" heading="5. Vercel Web Analytics">
        <p>
          We use Vercel Web Analytics for anonymized, aggregated analysis of visitor numbers and page views.
          According to Vercel, the service does not use cookies and does not create personal user profiles. Legal
          basis is our legitimate interest in statistically analyzing usage to improve our offering (Art. 6(1)(f)
          GDPR).
        </p>
      </Section>

      <Section id="registrierung" heading="6. Registration / User Account">
        <p>
          To use certain features (in particular paid content), users can register with an email address and a
          self-chosen password. Processing takes place to fulfill the usage agreement (Art. 6(1)(b) GDPR).
        </p>
      </Section>

      <Section id="supabase" heading="7. Supabase">
        <p>
          We use Supabase Inc., 970 Toa Payoh North #07-04, Singapore, as a processor for authentication, user
          accounts, and technical data storage. Passwords are stored encrypted (hashed), never in plain text. A
          data processing agreement is in place with Supabase.
        </p>
        <p className="text-xs">TODO: the specific Supabase project region (database storage location) is not evident from the code and must be verified in the Supabase dashboard to precisely support Section 16 (third-country transfers).</p>
      </Section>

      <Section id="cookies" heading="8. Sessions, Cookies and Browser Storage">
        <p>
          We use only strictly necessary cookies: a session cookie to keep you signed in (set via Supabase Auth)
          and a cookie storing your language preference (German/English/Spanish). Legal basis is Art. 6(1)(b) or
          (f) GDPR (performance of the usage agreement / legitimate interest in a functioning website); consent
          is not required for strictly necessary cookies. We do not currently use local/session browser storage.
        </p>
      </Section>

      <Section id="abos" heading="9. Paid Subscriptions">
        <p>
          For paid subscriptions (TradeInsider Intelligence, potentially TradeInsider Academy in the future), we
          additionally process information about the booked plan, billing interval, and subscription status to
          fulfill and manage the contract (Art. 6(1)(b) GDPR).
        </p>
      </Section>

      <Section id="stripe" heading="10. Stripe">
        <p>
          For concluding and billing paid subscriptions we use the payment provider Stripe Payments Europe, Ltd.,
          1 Grand Canal Street Lower, Dublin, Ireland (and affiliated Stripe group companies, including Stripe
          Inc., USA). Data required for payment processing (e.g. name, payment method information, billing
          address) is transmitted directly to Stripe; we do not receive or store full card details ourselves.
          Legal basis is the performance of the subscription contract (Art. 6(1)(b) GDPR). Stripe&apos;s privacy
          notice is available at{" "}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            stripe.com/privacy
          </a>
          .
        </p>
      </Section>

      <Section id="strato" heading="11. Email Delivery (STRATO)">
        <p>As of now, STRATO is intended to be used as the email provider for sending emails.</p>
        <p className="text-xs">
          TODO: whether, and for which specific emails (see Section 13), STRATO is actually used as the sending
          service / SMTP relay is not evident from this application&apos;s source code — auth confirmation and
          password reset emails are, unless configured via custom SMTP, technically sent via Supabase
          Auth&apos;s default mailer. This section must be verified against the actual configuration in the
          Supabase dashboard and made precise before it can be relied on commercially.
        </p>
      </Section>

      <Section id="kontakt" heading="12. Contact">
        <p>If you contact us by email, the data you provide is stored to process your inquiry. Legal basis is Art. 6(1)(b) or (f) GDPR, depending on whether the inquiry relates to a contract.</p>
      </Section>

      <Section id="servicemails" heading="13. Contract and Service Emails">
        <p>
          In connection with your user account and subscription, we (or our providers) automatically send
          emails, including for registration/email confirmation, password reset, contract confirmation,
          payment/billing information, and confirmation of cancellations and withdrawals. Legal basis is
          performance of the contract (Art. 6(1)(b) GDPR).
        </p>
      </Section>

      <Section id="newsletter" heading="14. Newsletter">
        <p>We do not currently offer a newsletter. Should a newsletter be introduced in the future, this policy will be updated in advance with the relevant details (legal basis, provider, opt-out option).</p>
      </Section>

      <Section id="empfaenger" heading="15. Recipients">
        <p>
          Recipients of your data are, to the extent necessary for the respective processing, the processors
          named above (Vercel, Supabase, Stripe, and potentially STRATO), but not other third parties unless we
          are legally required to disclose data.
        </p>
      </Section>

      <Section id="drittland" heading="16. Third-Country Transfers">
        <p>
          Some of the service providers we use (Vercel, Supabase, Stripe) also process data in the US or outside
          the EU/EEA. Where data is transferred to countries without an adequacy decision by the European
          Commission, this is based on EU Standard Contractual Clauses pursuant to Art. 46 GDPR.
        </p>
      </Section>

      <Section id="speicherdauer" heading="17. Retention Period">
        <p>
          We retain personal data only for as long as necessary for the respective purpose, or as required by
          statutory retention obligations (in particular commercial and tax law, typically 6–10 years for
          invoicing/accounting records). Account data is deleted upon deletion of the user account, unless
          statutory retention obligations apply.
        </p>
        <p className="text-xs">TODO: finalize exact retention periods per data category before launch.</p>
      </Section>

      <Section id="sicherheit" heading="18. Security">
        <p>
          We employ technical and organizational measures to protect your data against loss, misuse, and
          unauthorized access, including encrypted data transmission (TLS) and encrypted storage of passwords.
          These measures are continuously adapted to the state of the art.
        </p>
      </Section>

      <Section id="rechte" heading="19. Your Rights">
        <p>You have the following rights regarding your personal data:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Right of access (Art. 15 GDPR)</li>
          <li>Right to rectification or erasure (Art. 16, 17 GDPR)</li>
          <li>Right to restriction of processing (Art. 18 GDPR)</li>
          <li>Right to data portability (Art. 20 GDPR)</li>
          <li>Right to object to processing (Art. 21 GDPR)</li>
          <li>Right to withdraw consent given (Art. 7(3) GDPR)</li>
        </ul>
      </Section>

      <Section id="beschwerde" heading="20. Right to Complain">
        <p>You have the right to lodge a complaint with a data protection supervisory authority, e.g. the Landesbeauftragte für Datenschutz und Informationsfreiheit Niedersachsen.</p>
      </Section>

      <Section id="automatisiert" heading="21. Automated Decisions">
        <p>
          We do not use automated decision-making, including profiling, within the meaning of Art. 22 GDPR that
          produces legal effects concerning you or similarly significantly affects you. Scores and ratings
          published by TradeInsider (see{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Methodology
          </Link>
          ) are general analytical content, not automated individual decisions about you as a person.
        </p>
      </Section>

      <Section id="aenderungen" heading="22. Changes">
        <p>We update this privacy policy whenever processing or the legal situation changes. The version published on this page applies.</p>
      </Section>
    </>
  );
}

const SECTIONS_ES = SECTIONS_DE.map((s, i) => ({
  id: s.id,
  label: [
    "1. Responsable",
    "2. Tratamiento General de Datos",
    "3. Bases Legales",
    "4. Alojamiento – Vercel",
    "5. Vercel Web Analytics",
    "6. Registro / Cuenta de Usuario",
    "7. Supabase",
    "8. Sesiones, Cookies y Almacenamiento del Navegador",
    "9. Suscripciones de Pago",
    "10. Stripe",
    "11. Envío de Correos (STRATO)",
    "12. Contacto",
    "13. Correos de Contrato y Servicio",
    "14. Boletín (Newsletter)",
    "15. Destinatarios",
    "16. Transferencias a Terceros Países",
    "17. Plazo de Conservación",
    "18. Seguridad",
    "19. Sus Derechos",
    "20. Derecho de Reclamación",
    "21. Decisiones Automatizadas",
    "22. Cambios",
  ][i],
}));

function DatenschutzES() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Política de Privacidad</h1>
      <p className="mt-2 text-xs text-muted">
        Esta es una traducción al español a título informativo. La versión en alemán es la legalmente vinculante.
      </p>
      <Toc items={SECTIONS_ES} />

      <Section id="verantwortlicher" heading="1. Responsable">
        <p>
          designz e.K., Jörg Schmidtmann, Bornumer Weg 17, 30457 Hannover, Alemania
          <br />
          Correo electrónico: info@tradeinsider.io
        </p>
      </Section>

      <Section id="allgemein" heading="2. Tratamiento General de Datos">
        <p>Solo procesamos datos personales de nuestros usuarios en la medida necesaria para ofrecer un sitio web funcional, así como nuestros contenidos y servicios.</p>
      </Section>

      <Section id="rechtsgrundlagen" heading="3. Bases Legales">
        <p>Según el tratamiento, nos basamos en:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>el consentimiento del usuario (art. 6.1.a RGPD),</li>
          <li>la ejecución de un contrato o medidas precontractuales (art. 6.1.b RGPD),</li>
          <li>el cumplimiento de una obligación legal, p. ej. obligaciones fiscales de conservación (art. 6.1.c RGPD),</li>
          <li>intereses legítimos, salvo que prevalezcan sus intereses o derechos fundamentales (art. 6.1.f RGPD).</li>
        </ul>
        <p>La base legal aplicable se indica en cada tratamiento a continuación.</p>
      </Section>

      <Section id="hosting" heading="4. Alojamiento – Vercel">
        <p>
          Este sitio web está alojado por Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, EE. UU. Vercel
          procesa automáticamente archivos de registro del servidor (p. ej. dirección IP, fecha y hora de la
          solicitud, página solicitada, URL de referencia, navegador utilizado) para entregar técnicamente el
          sitio web. La base legal es nuestro interés legítimo en una entrega segura y funcional del sitio web
          (art. 6.1.f RGPD). Existe un contrato de encargo de tratamiento con Vercel.
        </p>
        <p className="text-xs">TODO: la región exacta del servidor de Vercel en tiempo de ejecución (no solo la región de compilación) no se desprende del código y debe verificarse en el panel de Vercel.</p>
      </Section>

      <Section id="analytics" heading="5. Vercel Web Analytics">
        <p>
          Utilizamos Vercel Web Analytics para el análisis anonimizado y agregado del número de visitantes y
          páginas vistas. Según Vercel, el servicio no utiliza cookies ni crea perfiles de usuario personales. La
          base legal es nuestro interés legítimo en analizar estadísticamente el uso para mejorar nuestra oferta
          (art. 6.1.f RGPD).
        </p>
      </Section>

      <Section id="registrierung" heading="6. Registro / Cuenta de Usuario">
        <p>
          Para utilizar determinadas funciones (en particular contenido de pago), los usuarios pueden registrarse
          con una dirección de correo electrónico y una contraseña de su elección. El tratamiento se realiza para
          la ejecución del contrato de uso (art. 6.1.b RGPD).
        </p>
      </Section>

      <Section id="supabase" heading="7. Supabase">
        <p>
          Utilizamos Supabase Inc., 970 Toa Payoh North #07-04, Singapur, como encargado del tratamiento para la
          autenticación, las cuentas de usuario y el almacenamiento técnico de datos. Las contraseñas se
          almacenan cifradas (hash), nunca en texto plano. Existe un contrato de encargo de tratamiento con
          Supabase.
        </p>
        <p className="text-xs">TODO: la región concreta del proyecto de Supabase (ubicación de almacenamiento de la base de datos) no se desprende del código y debe verificarse en el panel de Supabase para fundamentar con precisión el punto 16 (transferencias a terceros países).</p>
      </Section>

      <Section id="cookies" heading="8. Sesiones, Cookies y Almacenamiento del Navegador">
        <p>
          Solo utilizamos cookies estrictamente necesarias: una cookie de sesión para mantener su inicio de
          sesión (establecida por Supabase Auth) y una cookie que almacena su preferencia de idioma
          (alemán/inglés/español). La base legal es el art. 6.1.b o 6.1.f RGPD (ejecución del contrato de uso o
          interés legítimo en un sitio web funcional); no se requiere consentimiento para cookies estrictamente
          necesarias. Actualmente no utilizamos almacenamiento local/de sesión del navegador.
        </p>
      </Section>

      <Section id="abos" heading="9. Suscripciones de Pago">
        <p>
          Para las suscripciones de pago (TradeInsider Intelligence, posiblemente TradeInsider Academy en el
          futuro), procesamos adicionalmente información sobre el plan contratado, el intervalo de facturación y
          el estado de la suscripción para ejecutar y gestionar el contrato (art. 6.1.b RGPD).
        </p>
      </Section>

      <Section id="stripe" heading="10. Stripe">
        <p>
          Para la celebración y facturación de suscripciones de pago utilizamos el proveedor de pagos Stripe
          Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublín, Irlanda (y empresas afiliadas del grupo
          Stripe, incluida Stripe Inc., EE. UU.). Los datos necesarios para el procesamiento del pago (p. ej.
          nombre, datos del método de pago, dirección de facturación) se transmiten directamente a Stripe;
          nosotros no recibimos ni almacenamos los datos completos de la tarjeta. La base legal es la ejecución
          del contrato de suscripción (art. 6.1.b RGPD). El aviso de privacidad de Stripe está disponible en{" "}
          <a href="https://stripe.com/es/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            stripe.com/es/privacy
          </a>
          .
        </p>
      </Section>

      <Section id="strato" heading="11. Envío de Correos (STRATO)">
        <p>Según el estado actual, está previsto utilizar STRATO como proveedor de correo electrónico.</p>
        <p className="text-xs">
          TODO: si STRATO se utiliza realmente como servicio de envío / relay SMTP y para qué correos concretos
          (véase el punto 13) no se desprende del código fuente de esta aplicación — los correos de confirmación
          y restablecimiento de contraseña de Auth se envían técnicamente, salvo configuración SMTP
          personalizada, a través del proveedor de correo predeterminado de Supabase Auth. Este apartado debe
          verificarse conforme a la configuración real en el panel de Supabase y precisarse antes de poder
          considerarse fiable a nivel comercial.
        </p>
      </Section>

      <Section id="kontakt" heading="12. Contacto">
        <p>Si nos contacta por correo electrónico, almacenamos los datos proporcionados para gestionar su solicitud. La base legal es el art. 6.1.b o 6.1.f RGPD, según si la solicitud está relacionada con un contrato.</p>
      </Section>

      <Section id="servicemails" heading="13. Correos de Contrato y Servicio">
        <p>
          En relación con su cuenta de usuario y suscripción, nosotros (o nuestros proveedores) enviamos correos
          automatizados, entre otros, para el registro/confirmación de correo, el restablecimiento de contraseña,
          la confirmación del contrato, la información de pago/facturación y la confirmación de cancelaciones y
          desistimientos. La base legal es la ejecución del contrato (art. 6.1.b RGPD).
        </p>
      </Section>

      <Section id="newsletter" heading="14. Boletín (Newsletter)">
        <p>Actualmente no ofrecemos boletín informativo. Si en el futuro se introduce uno, esta política se actualizará previamente con los datos correspondientes (base legal, proveedor, opción de baja).</p>
      </Section>

      <Section id="empfaenger" heading="15. Destinatarios">
        <p>
          Los destinatarios de sus datos son, en la medida necesaria para el tratamiento correspondiente, los
          encargados del tratamiento mencionados arriba (Vercel, Supabase, Stripe y, en su caso, STRATO), pero no
          otros terceros, salvo obligación legal de divulgación.
        </p>
      </Section>

      <Section id="drittland" heading="16. Transferencias a Terceros Países">
        <p>
          Algunos de los proveedores que utilizamos (Vercel, Supabase, Stripe) también procesan datos en EE. UU. o
          fuera de la UE/EEE. Cuando los datos se transfieren a países sin una decisión de adecuación de la
          Comisión Europea, esto se basa en las Cláusulas Contractuales Tipo de la UE conforme al art. 46 RGPD.
        </p>
      </Section>

      <Section id="speicherdauer" heading="17. Plazo de Conservación">
        <p>
          Conservamos los datos personales solo durante el tiempo necesario para la finalidad correspondiente, o
          mientras existan obligaciones legales de conservación (en particular mercantiles y fiscales,
          habitualmente de 6 a 10 años para documentos de facturación/contabilidad). Los datos de la cuenta se
          eliminan al eliminar la cuenta de usuario, salvo que existan obligaciones legales de conservación.
        </p>
        <p className="text-xs">TODO: definir los plazos exactos de conservación por categoría de datos antes del lanzamiento.</p>
      </Section>

      <Section id="sicherheit" heading="18. Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas para proteger sus datos frente a pérdida, uso indebido y
          acceso no autorizado, entre ellas el cifrado de la transmisión de datos (TLS) y el almacenamiento
          cifrado de las contraseñas. Estas medidas se adaptan continuamente al estado de la técnica.
        </p>
      </Section>

      <Section id="rechte" heading="19. Sus Derechos">
        <p>Usted tiene los siguientes derechos respecto a sus datos personales:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Derecho de acceso (art. 15 RGPD)</li>
          <li>Derecho de rectificación o supresión (art. 16, 17 RGPD)</li>
          <li>Derecho a la limitación del tratamiento (art. 18 RGPD)</li>
          <li>Derecho a la portabilidad de los datos (art. 20 RGPD)</li>
          <li>Derecho de oposición al tratamiento (art. 21 RGPD)</li>
          <li>Derecho a revocar el consentimiento otorgado (art. 7.3 RGPD)</li>
        </ul>
      </Section>

      <Section id="beschwerde" heading="20. Derecho de Reclamación">
        <p>Tiene derecho a presentar una reclamación ante una autoridad de control en materia de protección de datos, p. ej. la Landesbeauftragte für Datenschutz und Informationsfreiheit Niedersachsen.</p>
      </Section>

      <Section id="automatisiert" heading="21. Decisiones Automatizadas">
        <p>
          No utilizamos decisiones automatizadas, incluida la elaboración de perfiles, en el sentido del art. 22
          RGPD que produzcan efectos jurídicos sobre usted o le afecten significativamente de forma similar. Las
          puntuaciones y ratings publicados por TradeInsider (véase{" "}
          <Link href="/methodik" className="underline hover:text-foreground">
            Metodología
          </Link>
          ) son contenido analítico general, no decisiones automatizadas individuales sobre usted como persona.
        </p>
      </Section>

      <Section id="aenderungen" heading="22. Cambios">
        <p>Actualizamos esta política de privacidad cuando cambian el tratamiento de datos o la situación legal. Se aplica la versión publicada en esta página.</p>
      </Section>
    </>
  );
}

const CONTENT: Record<Locale, () => React.ReactElement> = {
  de: DatenschutzDE,
  en: DatenschutzEN,
  es: DatenschutzES,
};

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const Content = CONTENT[locale];

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <Content />
    </div>
  );
}
