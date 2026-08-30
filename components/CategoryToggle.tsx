import Link from "next/link";

const CATEGORIES = [
  { code: "etfs", label: "ETFs" },
  { code: "krypto", label: "Krypto" },
  { code: "aktien", label: "Aktien" },
] as const;

export function CategoryToggle({ activeCode }: { activeCode: string }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-1 text-sm">
      {CATEGORIES.map((category) => {
        const isActive = category.code === activeCode;
        return (
          <Link
            key={category.code}
            href={{ pathname: "/trading-intelligence", query: { category: category.code } }}
            className={
              isActive
                ? "rounded-full bg-gradient-accent px-4 py-1.5 font-medium text-white"
                : "rounded-full px-4 py-1.5 text-muted transition-colors hover:text-foreground"
            }
          >
            {category.label}
          </Link>
        );
      })}
    </div>
  );
}
