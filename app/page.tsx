import Link from "next/link";

const SECTIONS = [
  {
    href: "/insider-kaeufe",
    title: "Insider Käufe",
    description: "Insider-Käufe und -Verkäufe von Vorständen in Echtzeit — USA (SEC) und Deutschland.",
    available: true,
  },
  {
    href: "/aktienanalyse",
    title: "Aktienanalyse",
    description: "Fundamentale und technische Analysen zu Aktien.",
    available: false,
  },
  {
    href: "/trading-academy",
    title: "Trading Academy",
    description: "Kurse und Guides rund ums Trading.",
    available: false,
  },
  {
    href: "/saisonalitaeten",
    title: "Saisonalitäten",
    description: "Saisonale Muster und Zyklen an den Märkten.",
    available: false,
  },
  {
    href: "/fk-anbieter",
    title: "FK Anbieter",
    description: "Ein Vergleich von Broker-Anbietern.",
    available: false,
  },
  {
    href: "/wirtschaftsnews",
    title: "Wirtschaftsnews",
    description: "Aktuelle Wirtschaftsnachrichten im Überblick.",
    available: false,
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-4 pt-24 pb-16 text-center sm:px-6 sm:pt-32">
        <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          Willkommen bei <span className="text-gradient">TradeInsider</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted text-balance">
          Deine Plattform für Insider-Käufe, Aktienanalysen und alles rund ums Trading.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {section.available ? (
                  <span className="h-2 w-2 rounded-full bg-gradient-accent" />
                ) : (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
                    Bald
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted">{section.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-gradient opacity-0 transition-opacity group-hover:opacity-100">
                {section.available ? "Jetzt ansehen →" : "Mehr erfahren →"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
