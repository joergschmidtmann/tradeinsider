import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = { de: "Datenschutzerklärung", en: "Privacy Policy", es: "Política de Privacidad" }[locale];
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

function DatenschutzDE() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Datenschutzerklärung</h1>

      <Section heading="1. Verantwortlicher">
        <p>
          designz e.K., Jörg Schmidtmann, Bornumer Weg 17, 30457 Hannover, Deutschland
          <br />
          E-Mail: info@tradeinsider.io
        </p>
      </Section>

      <Section heading="2. Allgemeines zur Datenverarbeitung">
        <p>
          Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung
          einer funktionsfähigen Website sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung
          personenbezogener Daten erfolgt regelmäßig nur nach Einwilligung des Nutzers (Art. 6 Abs. 1 lit. a DSGVO),
          zur Erfüllung eines Vertrags mit dem Nutzer (Art. 6 Abs. 1 lit. b DSGVO) oder auf Grundlage berechtigter
          Interessen (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </Section>

      <Section heading="3. Hosting">
        <p>
          Diese Website wird bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA, gehostet. Vercel
          verarbeitet dabei automatisch Server-Logfiles (z. B. IP-Adresse, Datum und Uhrzeit der Anfrage,
          angeforderte Seite, Referrer-URL, verwendeter Browser), um die Website technisch bereitzustellen und
          auszuliefern. Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren, funktionsfähigen
          Auslieferung der Website (Art. 6 Abs. 1 lit. f DSGVO). Mit Vercel besteht ein Vertrag zur
          Auftragsverarbeitung.
        </p>
      </Section>

      <Section heading="4. Reichweitenmessung (Vercel Web Analytics)">
        <p>
          Wir nutzen Vercel Web Analytics zur anonymisierten, aggregierten Auswertung von Besucherzahlen und
          Seitenaufrufen. Der Dienst setzt nach Angaben von Vercel keine Cookies und erstellt keine
          personenbezogenen Nutzerprofile. Eine Zuordnung zu einzelnen Personen findet nicht statt. Rechtsgrundlage
          ist unser berechtigtes Interesse an der statistischen Analyse des Nutzerverhaltens zur Verbesserung
          unseres Angebots (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </Section>

      <Section heading="5. Registrierung und Nutzerkonto">
        <p>
          Für die Nutzung bestimmter Funktionen (insbesondere kostenpflichtiger Inhalte) können sich Nutzer mit
          E-Mail-Adresse und einem selbst gewählten Passwort registrieren. Die Passwörter werden verschlüsselt
          gespeichert. Die Verarbeitung erfolgt zur Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO).
          Für die technische Verwaltung von Nutzerkonten und Anmeldedaten setzen wir Supabase Inc., 970 Toa Payoh
          North #07-04, Singapur, als Auftragsverarbeiter ein; die Datenverarbeitung kann dabei auf Servern in der
          EU oder den USA erfolgen. Mit Supabase besteht ein Vertrag zur Auftragsverarbeitung.
        </p>
      </Section>

      <Section heading="6. Zahlungsabwicklung">
        <p>
          Für den Abschluss kostenpflichtiger Abonnements nutzen wir den Zahlungsdienstleister Stripe Payments
          Europe, Ltd., 1 Grand Canal Street Lower, Dublin, Irland (bzw. verbundene Unternehmen der Stripe-Gruppe,
          einschließlich Stripe Inc., USA). Dabei werden die für die Zahlungsabwicklung erforderlichen Daten
          (u. a. Name, Zahlungsmittelinformationen, Rechnungsadresse) direkt an Stripe übermittelt; wir selbst
          erhalten und speichern keine vollständigen Zahlungskartendaten. Rechtsgrundlage ist die Erfüllung des
          Abonnementvertrags (Art. 6 Abs. 1 lit. b DSGVO). Die Datenschutzhinweise von Stripe finden Sie unter{" "}
          <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            stripe.com/de/privacy
          </a>
          .
        </p>
      </Section>

      <Section heading="7. Kontaktaufnahme">
        <p>
          Bei Kontaktaufnahme per E-Mail werden die von Ihnen mitgeteilten Daten zur Bearbeitung der Anfrage
          gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO, je nachdem, ob die Anfrage in
          Zusammenhang mit einem Vertrag steht.
        </p>
      </Section>

      <Section heading="8. Speicherdauer">
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie dies für den jeweiligen Zweck erforderlich ist
          oder gesetzliche Aufbewahrungspflichten (insbesondere handels- und steuerrechtliche) bestehen.
          Kontodaten werden bei Löschung des Nutzerkontos gelöscht, soweit keine gesetzlichen
          Aufbewahrungspflichten entgegenstehen.
        </p>
      </Section>

      <Section heading="9. Übermittlung in Drittländer">
        <p>
          Einige der von uns eingesetzten Dienstleister (Vercel, Supabase, Stripe) verarbeiten Daten auch in den
          USA. Soweit Daten in Länder außerhalb der EU/des EWR ohne Angemessenheitsbeschluss der EU-Kommission
          übermittelt werden, erfolgt dies auf Grundlage von EU-Standardvertragsklauseln gemäß Art. 46 DSGVO.
        </p>
      </Section>

      <Section heading="10. Ihre Rechte">
        <p>Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
          <li>Recht auf Berichtigung oder Löschung (Art. 16, 17 DSGVO)</li>
          <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruchsrecht gegen die Verarbeitung (Art. 21 DSGVO)</li>
          <li>Recht auf Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
        </ul>
        <p>
          Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer
          personenbezogenen Daten durch uns zu beschweren, z. B. bei der Landesbeauftragten für Datenschutz und
          Informationsfreiheit Niedersachsen.
        </p>
      </Section>

      <Section heading="11. Änderungen dieser Datenschutzerklärung">
        <p>
          Wir passen diese Datenschutzerklärung an, sobald sich die Datenverarbeitung oder die Rechtslage ändern.
          Es gilt jeweils die auf dieser Seite veröffentlichte Fassung.
        </p>
      </Section>
    </>
  );
}

function DatenschutzEN() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-xs text-muted">
        This is an English translation for convenience. The German version is legally binding and governs.
      </p>

      <Section heading="1. Controller">
        <p>
          designz e.K., Jörg Schmidtmann, Bornumer Weg 17, 30457 Hannover, Germany
          <br />
          Email: info@tradeinsider.io
        </p>
      </Section>

      <Section heading="2. General information">
        <p>
          We process personal data of our users only to the extent necessary to provide a functioning website and
          our content and services. Processing takes place based on user consent (Art. 6(1)(a) GDPR), for the
          performance of a contract with the user (Art. 6(1)(b) GDPR), or based on our legitimate interests
          (Art. 6(1)(f) GDPR).
        </p>
      </Section>

      <Section heading="3. Hosting">
        <p>
          This website is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA. Vercel automatically
          processes server log files (e.g. IP address, date and time of the request, requested page, referrer URL,
          browser used) to technically deliver the website. Legal basis is our legitimate interest in a secure,
          functional delivery of the website (Art. 6(1)(f) GDPR). A data processing agreement is in place with
          Vercel.
        </p>
      </Section>

      <Section heading="4. Analytics (Vercel Web Analytics)">
        <p>
          We use Vercel Web Analytics for anonymized, aggregated analysis of visitor numbers and page views.
          According to Vercel, the service does not use cookies and does not create personal user profiles.
          Legal basis is our legitimate interest in statistically analyzing usage to improve our offering
          (Art. 6(1)(f) GDPR).
        </p>
      </Section>

      <Section heading="5. Registration and user account">
        <p>
          To use certain features (in particular paid content), users can register with an email address and a
          self-chosen password. Passwords are stored encrypted. Processing takes place to fulfill the usage
          agreement (Art. 6(1)(b) GDPR). We use Supabase Inc., 970 Toa Payoh North #07-04, Singapore, as a
          processor for the technical management of accounts and login data; processing may take place on servers
          in the EU or the US. A data processing agreement is in place with Supabase.
        </p>
      </Section>

      <Section heading="6. Payment processing">
        <p>
          For paid subscriptions we use the payment provider Stripe Payments Europe, Ltd., 1 Grand Canal Street
          Lower, Dublin, Ireland (and affiliated Stripe group companies, including Stripe Inc., USA). Data required
          for payment processing (e.g. name, payment method information, billing address) is transmitted directly
          to Stripe; we do not receive or store full card details ourselves. Legal basis is the performance of the
          subscription contract (Art. 6(1)(b) GDPR). Stripe&apos;s privacy notice is available at{" "}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            stripe.com/privacy
          </a>
          .
        </p>
      </Section>

      <Section heading="7. Contact">
        <p>
          If you contact us by email, the data you provide is stored to process your inquiry. Legal basis is
          Art. 6(1)(b) or (f) GDPR, depending on whether the inquiry relates to a contract.
        </p>
      </Section>

      <Section heading="8. Retention period">
        <p>
          We retain personal data only for as long as necessary for the respective purpose, or as required by
          statutory retention obligations (in particular commercial and tax law). Account data is deleted upon
          deletion of the user account, unless statutory retention obligations apply.
        </p>
      </Section>

      <Section heading="9. Transfers to third countries">
        <p>
          Some of the service providers we use (Vercel, Supabase, Stripe) also process data in the US. Where data
          is transferred to countries outside the EU/EEA without an adequacy decision by the European Commission,
          this is based on EU Standard Contractual Clauses pursuant to Art. 46 GDPR.
        </p>
      </Section>

      <Section heading="10. Your rights">
        <p>You have the following rights regarding your personal data:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Right of access (Art. 15 GDPR)</li>
          <li>Right to rectification or erasure (Art. 16, 17 GDPR)</li>
          <li>Right to restriction of processing (Art. 18 GDPR)</li>
          <li>Right to data portability (Art. 20 GDPR)</li>
          <li>Right to object to processing (Art. 21 GDPR)</li>
          <li>Right to withdraw consent given (Art. 7(3) GDPR)</li>
        </ul>
        <p>
          You also have the right to lodge a complaint with a data protection supervisory authority, e.g. the
          Landesbeauftragte für Datenschutz und Informationsfreiheit Niedersachsen.
        </p>
      </Section>

      <Section heading="11. Changes to this privacy policy">
        <p>We update this privacy policy whenever processing or the legal situation changes. The version published on this page applies.</p>
      </Section>
    </>
  );
}

function DatenschutzES() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Política de Privacidad</h1>
      <p className="mt-2 text-xs text-muted">
        Esta es una traducción al español a título informativo. La versión en alemán es la legalmente vinculante.
      </p>

      <Section heading="1. Responsable">
        <p>
          designz e.K., Jörg Schmidtmann, Bornumer Weg 17, 30457 Hannover, Alemania
          <br />
          Correo electrónico: info@tradeinsider.io
        </p>
      </Section>

      <Section heading="2. Información general">
        <p>
          Solo procesamos datos personales de nuestros usuarios en la medida necesaria para ofrecer un sitio web
          funcional, así como nuestros contenidos y servicios. El tratamiento se basa en el consentimiento del
          usuario (art. 6.1.a RGPD), en la ejecución de un contrato con el usuario (art. 6.1.b RGPD) o en nuestros
          intereses legítimos (art. 6.1.f RGPD).
        </p>
      </Section>

      <Section heading="3. Alojamiento (Hosting)">
        <p>
          Este sitio web está alojado por Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, EE. UU. Vercel
          procesa automáticamente archivos de registro del servidor (p. ej. dirección IP, fecha y hora de la
          solicitud, página solicitada, URL de referencia, navegador utilizado) para entregar técnicamente el
          sitio web. La base legal es nuestro interés legítimo en una entrega segura y funcional del sitio web
          (art. 6.1.f RGPD). Existe un contrato de encargo de tratamiento con Vercel.
        </p>
      </Section>

      <Section heading="4. Analítica (Vercel Web Analytics)">
        <p>
          Utilizamos Vercel Web Analytics para el análisis anonimizado y agregado del número de visitantes y
          páginas vistas. Según Vercel, el servicio no utiliza cookies ni crea perfiles de usuario personales. La
          base legal es nuestro interés legítimo en analizar estadísticamente el uso para mejorar nuestra oferta
          (art. 6.1.f RGPD).
        </p>
      </Section>

      <Section heading="5. Registro y cuenta de usuario">
        <p>
          Para utilizar determinadas funciones (en particular contenido de pago), los usuarios pueden registrarse
          con una dirección de correo electrónico y una contraseña de su elección. Las contraseñas se almacenan
          cifradas. El tratamiento se realiza para la ejecución del contrato de uso (art. 6.1.b RGPD). Utilizamos
          Supabase Inc., 970 Toa Payoh North #07-04, Singapur, como encargado del tratamiento para la gestión
          técnica de cuentas y datos de acceso; el tratamiento puede realizarse en servidores de la UE o de
          EE. UU. Existe un contrato de encargo de tratamiento con Supabase.
        </p>
      </Section>

      <Section heading="6. Procesamiento de pagos">
        <p>
          Para las suscripciones de pago utilizamos el proveedor de pagos Stripe Payments Europe, Ltd., 1 Grand
          Canal Street Lower, Dublín, Irlanda (y empresas afiliadas del grupo Stripe, incluida Stripe Inc.,
          EE. UU.). Los datos necesarios para el procesamiento del pago (p. ej. nombre, datos del método de pago,
          dirección de facturación) se transmiten directamente a Stripe; nosotros no recibimos ni almacenamos los
          datos completos de la tarjeta. La base legal es la ejecución del contrato de suscripción (art. 6.1.b
          RGPD). El aviso de privacidad de Stripe está disponible en{" "}
          <a href="https://stripe.com/es/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            stripe.com/es/privacy
          </a>
          .
        </p>
      </Section>

      <Section heading="7. Contacto">
        <p>
          Si nos contacta por correo electrónico, almacenamos los datos proporcionados para gestionar su
          solicitud. La base legal es el art. 6.1.b o 6.1.f RGPD, según si la solicitud está relacionada con un
          contrato.
        </p>
      </Section>

      <Section heading="8. Plazo de conservación">
        <p>
          Conservamos los datos personales solo durante el tiempo necesario para la finalidad correspondiente, o
          mientras existan obligaciones legales de conservación (en particular, mercantiles y fiscales). Los
          datos de la cuenta se eliminan al eliminar la cuenta de usuario, salvo que existan obligaciones legales
          de conservación.
        </p>
      </Section>

      <Section heading="9. Transferencias a terceros países">
        <p>
          Algunos de los proveedores que utilizamos (Vercel, Supabase, Stripe) también procesan datos en EE. UU.
          Cuando los datos se transfieren a países fuera de la UE/EEE sin una decisión de adecuación de la
          Comisión Europea, esto se basa en las Cláusulas Contractuales Tipo de la UE conforme al art. 46 RGPD.
        </p>
      </Section>

      <Section heading="10. Sus derechos">
        <p>Usted tiene los siguientes derechos respecto a sus datos personales:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Derecho de acceso (art. 15 RGPD)</li>
          <li>Derecho de rectificación o supresión (art. 16, 17 RGPD)</li>
          <li>Derecho a la limitación del tratamiento (art. 18 RGPD)</li>
          <li>Derecho a la portabilidad de los datos (art. 20 RGPD)</li>
          <li>Derecho de oposición al tratamiento (art. 21 RGPD)</li>
          <li>Derecho a revocar el consentimiento otorgado (art. 7.3 RGPD)</li>
        </ul>
        <p>
          También tiene derecho a presentar una reclamación ante una autoridad de control en materia de
          protección de datos, p. ej. la Landesbeauftragte für Datenschutz und Informationsfreiheit Niedersachsen.
        </p>
      </Section>

      <Section heading="11. Cambios en esta política de privacidad">
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
