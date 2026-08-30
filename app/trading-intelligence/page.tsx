import type { Metadata } from "next";
import { CategoryToggle } from "@/components/CategoryToggle";

export const metadata: Metadata = { title: "Trading Intelligence — tradeinsider" };

const CATEGORIES = ["etfs", "krypto", "aktien"] as const;
type Category = (typeof CATEGORIES)[number];

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

const DESCRIPTIONS: Record<Category, string> = {
  etfs: "Fundamentale und technische Analysen zu ETFs folgen in Kürze.",
  krypto: "Fundamentale und technische Analysen zu Kryptowährungen folgen in Kürze.",
  aktien: "Fundamentale und technische Analysen zu Aktien folgen in Kürze.",
};

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const category: Category = isCategory(params.category ?? "") ? (params.category as Category) : "aktien";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center sm:px-6">
      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
        Bald verfügbar
      </span>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">Trading Intelligence</h1>
      <p className="mt-4 text-lg text-muted">{DESCRIPTIONS[category]}</p>
      <div className="mt-8">
        <CategoryToggle activeCode={category} />
      </div>
    </div>
  );
}
