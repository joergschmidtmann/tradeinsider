import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { openBillingPortal } from "@/app/[locale]/konto/actions";
import { CancelForm } from "./CancelForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = { de: "Vertrag kündigen", en: "Cancel Subscription", es: "Cancelar Suscripción" }[locale];
  return { title: `${title} — tradeinsider` };
}

export default async function VertragKuendigenPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isPro = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
    isPro = profile?.tier === "pro";
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Vertrag kündigen</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Du kannst dein Abonnement jederzeit zum Ende der laufenden Abrechnungsperiode kündigen. Das Recht zur
        außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
      </p>

      {isPro && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm font-medium text-foreground">Schnellster Weg</p>
          <p className="mt-1.5 text-sm text-muted">
            Du bist eingeloggt und hast ein aktives Pro-Abo. Über die Kontoverwaltung kannst du sofort kündigen.
          </p>
          <form action={openBillingPortal} className="mt-3">
            <button
              type="submit"
              className="rounded-full bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              In der Kontoverwaltung kündigen
            </button>
          </form>
        </div>
      )}

      <div className="mt-6">
        <p className="mb-3 text-sm text-muted">
          {isPro
            ? "Alternativ kannst du die Kündigung auch formlos über dieses Formular einreichen:"
            : "Kündigung formlos über dieses Formular einreichen:"}
        </p>
        <CancelForm />
      </div>
    </div>
  );
}
