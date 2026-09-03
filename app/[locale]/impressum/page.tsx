import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = { de: "Impressum", en: "Legal Notice", es: "Aviso Legal" }[locale];
  return { title: `${title} — tradeinsider` };
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function ImpressumDE() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Impressum</h1>
      <Section heading="Angaben gemäß § 5 DDG">
        <p>
          designz e.K.
          <br />
          Inhaber: Jörg Schmidtmann
          <br />
          Bornumer Weg 17
          <br />
          30457 Hannover
          <br />
          Deutschland
        </p>
      </Section>
      <Section heading="Kontakt">
        <p>E-Mail: info@tradeinsider.io</p>
      </Section>
      <Section heading="Registereintrag">
        <p>
          Eintragung im Handelsregister.
          <br />
          Registergericht: Amtsgericht Hannover
          <br />
          Registernummer: HRA 204576
        </p>
      </Section>
      <Section heading="Umsatzsteuer-Identifikationsnummer">
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: DE269028661</p>
      </Section>
      <Section heading="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <p>
          Jörg Schmidtmann
          <br />
          Bornumer Weg 17, 30457 Hannover
        </p>
      </Section>
      <Section heading="Verbraucherstreitbeilegung">
        <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </Section>
    </>
  );
}

function ImpressumEN() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Legal Notice</h1>
      <p className="mt-2 text-xs text-muted">
        This is an English translation for convenience. The German version is legally binding.
      </p>
      <Section heading="Information pursuant to § 5 DDG (German Digital Services Act)">
        <p>
          designz e.K.
          <br />
          Owner: Jörg Schmidtmann
          <br />
          Bornumer Weg 17
          <br />
          30457 Hannover
          <br />
          Germany
        </p>
      </Section>
      <Section heading="Contact">
        <p>Email: info@tradeinsider.io</p>
      </Section>
      <Section heading="Commercial Register">
        <p>
          Registered in the German Commercial Register.
          <br />
          Register court: Amtsgericht Hannover
          <br />
          Register number: HRA 204576
        </p>
      </Section>
      <Section heading="VAT ID">
        <p>VAT identification number pursuant to § 27a of the German VAT Act: DE269028661</p>
      </Section>
      <Section heading="Responsible for content pursuant to § 18(2) MStV">
        <p>
          Jörg Schmidtmann
          <br />
          Bornumer Weg 17, 30457 Hannover, Germany
        </p>
      </Section>
      <Section heading="Consumer dispute resolution">
        <p>We are not willing and not obligated to participate in dispute resolution proceedings before a consumer arbitration board.</p>
      </Section>
    </>
  );
}

function ImpressumES() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Aviso Legal</h1>
      <p className="mt-2 text-xs text-muted">
        Esta es una traducción al español a título informativo. La versión en alemán es la legalmente vinculante.
      </p>
      <Section heading="Información según el § 5 DDG (Ley alemana de Servicios Digitales)">
        <p>
          designz e.K.
          <br />
          Titular: Jörg Schmidtmann
          <br />
          Bornumer Weg 17
          <br />
          30457 Hannover
          <br />
          Alemania
        </p>
      </Section>
      <Section heading="Contacto">
        <p>Correo electrónico: info@tradeinsider.io</p>
      </Section>
      <Section heading="Registro Mercantil">
        <p>
          Inscrito en el Registro Mercantil alemán.
          <br />
          Juzgado de registro: Amtsgericht Hannover
          <br />
          Número de registro: HRA 204576
        </p>
      </Section>
      <Section heading="NIF-IVA">
        <p>Número de identificación fiscal a efectos del IVA según el § 27a de la Ley alemana del IVA: DE269028661</p>
      </Section>
      <Section heading="Responsable del contenido según el § 18(2) MStV">
        <p>
          Jörg Schmidtmann
          <br />
          Bornumer Weg 17, 30457 Hannover, Alemania
        </p>
      </Section>
      <Section heading="Resolución de litigios con consumidores">
        <p>No estamos dispuestos ni obligados a participar en procedimientos de resolución de litigios ante un organismo de arbitraje de consumo.</p>
      </Section>
    </>
  );
}

const CONTENT: Record<Locale, () => React.ReactElement> = {
  de: ImpressumDE,
  en: ImpressumEN,
  es: ImpressumES,
};

export default async function ImpressumPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const Content = CONTENT[locale];

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <Content />
    </div>
  );
}
