import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { WithdrawForm } from "./WithdrawForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = { de: "Vertrag widerrufen", en: "Withdraw from Contract", es: "Desistir del Contrato" }[locale];
  return { title: `${title} — tradeinsider` };
}

export default function VertragWiderrufenPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Vertrag widerrufen</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Innerhalb der gesetzlichen Widerrufsfrist kannst du deinen Vertrag hier formlos widerrufen. Details zu
        Frist und Rechtsfolgen findest du in unserer{" "}
        <Link href="/widerruf" className="underline hover:text-foreground">
          Widerrufsbelehrung
        </Link>
        .
      </p>

      <div className="mt-6">
        <WithdrawForm />
      </div>
    </div>
  );
}
