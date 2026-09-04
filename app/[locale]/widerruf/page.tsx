import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = { de: "Widerrufsbelehrung", en: "Right of Withdrawal", es: "Derecho de Desistimiento" }[locale];
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

function WiderrufDE() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Widerrufsbelehrung</h1>
      <p className="mt-2 text-xs text-muted">
        Nachfolgend die gesetzliche Muster-Widerrufsbelehrung (Anlage 1 zu Art. 246a § 1 Abs. 2 EGBGB), ausgefüllt
        mit unseren Angaben.
      </p>

      <Section heading="Widerrufsrecht">
        <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>
        <p>Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.</p>
        <p>
          Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (designz e.K., Jörg Schmidtmann, Bornumer Weg 17, 30457
          Hannover, Deutschland, E-Mail:{" "}
          <a href="mailto:info@tradeinsider.io" className="underline hover:text-foreground">
            info@tradeinsider.io
          </a>
          ) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über
          Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das unten stehende
          Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Sie können auch unser{" "}
          <Link href="/vertrag-widerrufen" className="underline hover:text-foreground">
            Online-Widerrufsformular
          </Link>{" "}
          nutzen.
        </p>
        <p>
          Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des
          Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
        </p>
      </Section>

      <Section heading="Folgen des Widerrufs">
        <p>
          Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben,
          unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
          Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe
          Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen
          wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung
          Entgelte berechnet.
        </p>
        <p>
          Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie
          uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der
          Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten
          Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
        </p>
      </Section>

      <Section heading="Besonderer Hinweis auf vorzeitiges Erlöschen des Widerrufsrechts">
        <p>
          Ihr Widerrufsrecht erlischt vorzeitig, wenn wir die Dienstleistung vollständig erbracht haben und mit
          der Ausführung der Dienstleistung erst begonnen haben, nachdem Sie dazu Ihre ausdrückliche Zustimmung
          gegeben haben und gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie Ihr Widerrufsrecht bei
          vollständiger Vertragserfüllung durch uns verlieren.
        </p>
        <p className="text-xs">
          TODO LEGAL REVIEW – genaue Formulierung abhängig von rechtlicher Einordnung als Dienstleistung/digitale
          Leistung: Ob TradeInsider Intelligence als „Dienstleistung“ oder als „digitale Inhalte, die nicht auf
          einem körperlichen Datenträger geliefert werden“ im Sinne des § 356 Abs. 5 BGB einzuordnen ist, ist vor
          Launch rechtlich zu klären — davon hängt die exakte Formulierung dieses Abschnitts sowie der
          Zustimmungs-Checkbox im Checkout ab.
        </p>
      </Section>

      <Section heading="Muster-Widerrufsformular">
        <p>(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)</p>
        <div className="rounded-lg border border-border bg-surface-2 p-4 text-foreground">
          <p>
            An designz e.K., Bornumer Weg 17, 30457 Hannover, Deutschland, E-Mail: info@tradeinsider.io:
          </p>
          <p className="mt-3">
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der
            folgenden Dienstleistung (*)
          </p>
          <p className="mt-3">Bestellt am (*)/erhalten am (*)</p>
          <p className="mt-3">Name des/der Verbraucher(s)</p>
          <p className="mt-3">Anschrift des/der Verbraucher(s)</p>
          <p className="mt-3">Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</p>
          <p className="mt-3">Datum</p>
        </div>
        <p className="text-xs">(*) Unzutreffendes streichen.</p>
        <p>
          Einfacher geht es über unser{" "}
          <Link href="/vertrag-widerrufen" className="underline hover:text-foreground">
            Online-Widerrufsformular
          </Link>
          .
        </p>
      </Section>
    </>
  );
}

function WiderrufEN() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Right of Withdrawal</h1>
      <p className="mt-2 text-xs text-muted">
        This is an English translation of the German statutory withdrawal notice, for convenience only. The
        German version is legally binding.
      </p>

      <Section heading="Right of withdrawal">
        <p>You have the right to withdraw from this contract within fourteen days without giving any reason.</p>
        <p>The withdrawal period is fourteen days from the day the contract was concluded.</p>
        <p>
          To exercise your right of withdrawal, you must inform us (designz e.K., Jörg Schmidtmann, Bornumer Weg
          17, 30457 Hannover, Germany, email:{" "}
          <a href="mailto:info@tradeinsider.io" className="underline hover:text-foreground">
            info@tradeinsider.io
          </a>
          ) by means of a clear statement (e.g. a letter sent by post or an email) of your decision to withdraw
          from this contract. You may use the model withdrawal form below, although it is not mandatory. You may
          also use our{" "}
          <Link href="/vertrag-widerrufen" className="underline hover:text-foreground">
            online withdrawal form
          </Link>
          .
        </p>
        <p>To meet the withdrawal deadline, it is sufficient for you to send your communication concerning the exercise of the right of withdrawal before the withdrawal period has expired.</p>
      </Section>

      <Section heading="Effects of withdrawal">
        <p>
          If you withdraw from this contract, we shall reimburse all payments received from you without undue
          delay and, in any event, no later than fourteen days from the day on which we received notice of your
          withdrawal. We will use the same means of payment as you used for the original transaction, unless
          expressly agreed otherwise; in no event will you be charged fees for this reimbursement.
        </p>
        <p>
          If you requested that the services begin during the withdrawal period, you must pay us a reasonable
          amount corresponding to the proportion of services already provided up to the point at which you inform
          us of the exercise of the right of withdrawal, compared to the total scope of services under the
          contract.
        </p>
      </Section>

      <Section heading="Special note on early expiry of the right of withdrawal">
        <p>
          Your right of withdrawal expires early if we have fully performed the service and have only started
          performance after you gave your express consent and simultaneously confirmed your knowledge that you
          would lose your right of withdrawal upon full performance of the contract by us.
        </p>
        <p className="text-xs">
          TODO LEGAL REVIEW — exact wording depends on the legal classification as a service or digital content:
          whether TradeInsider Intelligence qualifies as a &quot;service&quot; or as &quot;digital content not
          supplied on a tangible medium&quot; under German law (§ 356(5) BGB) must be clarified before launch —
          the exact wording of this section and of the checkout consent checkbox depends on that.
        </p>
      </Section>

      <Section heading="Model withdrawal form">
        <p>(If you want to withdraw from the contract, please fill in this form and send it back.)</p>
        <div className="rounded-lg border border-border bg-surface-2 p-4 text-foreground">
          <p>To designz e.K., Bornumer Weg 17, 30457 Hannover, Germany, email: info@tradeinsider.io:</p>
          <p className="mt-3">I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service (*)</p>
          <p className="mt-3">Ordered on (*)/received on (*)</p>
          <p className="mt-3">Name of consumer(s)</p>
          <p className="mt-3">Address of consumer(s)</p>
          <p className="mt-3">Signature of consumer(s) (only if this form is notified on paper)</p>
          <p className="mt-3">Date</p>
        </div>
        <p className="text-xs">(*) Delete as appropriate.</p>
        <p>
          It&apos;s simpler via our{" "}
          <Link href="/vertrag-widerrufen" className="underline hover:text-foreground">
            online withdrawal form
          </Link>
          .
        </p>
      </Section>
    </>
  );
}

function WiderrufES() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Derecho de Desistimiento</h1>
      <p className="mt-2 text-xs text-muted">
        Esta es una traducción al español del aviso legal alemán de desistimiento, a título informativo. La
        versión en alemán es la legalmente vinculante.
      </p>

      <Section heading="Derecho de desistimiento">
        <p>Tiene usted derecho a desistir del presente contrato en un plazo de catorce días sin necesidad de justificación.</p>
        <p>El plazo de desistimiento expirará a los catorce días del día de la celebración del contrato.</p>
        <p>
          Para ejercer el derecho de desistimiento, deberá informarnos (designz e.K., Jörg Schmidtmann, Bornumer
          Weg 17, 30457 Hannover, Alemania, correo electrónico:{" "}
          <a href="mailto:info@tradeinsider.io" className="underline hover:text-foreground">
            info@tradeinsider.io
          </a>
          ) mediante una declaración clara (p. ej. una carta enviada por correo postal o un correo electrónico).
          Puede utilizar el formulario de desistimiento modelo que figura a continuación, aunque no es
          obligatorio. También puede utilizar nuestro{" "}
          <Link href="/vertrag-widerrufen" className="underline hover:text-foreground">
            formulario de desistimiento en línea
          </Link>
          .
        </p>
        <p>Para cumplir el plazo de desistimiento, basta con que la comunicación relativa al ejercicio de este derecho se envíe antes de que finalice el plazo correspondiente.</p>
      </Section>

      <Section heading="Consecuencias del desistimiento">
        <p>
          En caso de desistimiento por su parte, le devolveremos todos los pagos recibidos sin demora indebida y,
          en todo caso, a más tardar en el plazo de catorce días a partir de la fecha en la que se nos informe de
          su decisión de desistir. Procederemos a efectuar dicho reembolso utilizando el mismo medio de pago
          empleado por usted, salvo que se acuerde expresamente lo contrario; en ningún caso incurrirá en gastos
          como consecuencia del reembolso.
        </p>
        <p>
          Si usted solicitó que los servicios comenzaran durante el plazo de desistimiento, deberá abonarnos un
          importe proporcional a la parte de los servicios ya prestados hasta el momento en que nos comunique su
          decisión de desistir, en comparación con el alcance total de los servicios previstos en el contrato.
        </p>
      </Section>

      <Section heading="Aviso especial sobre la extinción anticipada del derecho de desistimiento">
        <p>
          Su derecho de desistimiento se extinguirá anticipadamente si hemos ejecutado completamente el servicio
          y solo hemos comenzado su ejecución después de que usted haya prestado su consentimiento expreso y
          confirmado simultáneamente que sabía que perdería su derecho de desistimiento en caso de ejecución
          completa del contrato por nuestra parte.
        </p>
        <p className="text-xs">
          TODO LEGAL REVIEW — la redacción exacta depende de la calificación jurídica como servicio o contenido
          digital: si TradeInsider Intelligence se clasifica como «servicio» o como «contenido digital no
          suministrado en soporte material» conforme al derecho alemán (§ 356.5 BGB) debe aclararse antes del
          lanzamiento; de ello depende la redacción exacta de esta sección y de la casilla de consentimiento en el
          proceso de compra.
        </p>
      </Section>

      <Section heading="Formulario de desistimiento modelo">
        <p>(Si desea desistir del contrato, rellene y envíe el presente formulario.)</p>
        <div className="rounded-lg border border-border bg-surface-2 p-4 text-foreground">
          <p>A designz e.K., Bornumer Weg 17, 30457 Hannover, Alemania, correo electrónico: info@tradeinsider.io:</p>
          <p className="mt-3">Por la presente desisto/desistimos (*) del contrato celebrado por mí/nosotros (*) para la prestación del siguiente servicio (*)</p>
          <p className="mt-3">Pedido el (*)/recibido el (*)</p>
          <p className="mt-3">Nombre del/de los consumidor(es)</p>
          <p className="mt-3">Domicilio del/de los consumidor(es)</p>
          <p className="mt-3">Firma del/de los consumidor(es) (solo si el presente formulario se presenta en papel)</p>
          <p className="mt-3">Fecha</p>
        </div>
        <p className="text-xs">(*) Táchese lo que no proceda.</p>
        <p>
          Es más sencillo a través de nuestro{" "}
          <Link href="/vertrag-widerrufen" className="underline hover:text-foreground">
            formulario de desistimiento en línea
          </Link>
          .
        </p>
      </Section>
    </>
  );
}

const CONTENT: Record<Locale, () => React.ReactElement> = {
  de: WiderrufDE,
  en: WiderrufEN,
  es: WiderrufES,
};

export default async function WiderrufPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const Content = CONTENT[locale];

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <Content />
    </div>
  );
}
