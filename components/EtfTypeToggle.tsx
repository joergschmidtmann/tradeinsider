import Link from "next/link";

const ETF_TYPES = [
  { code: "etfs", label: "ETFs" },
  { code: "leveraged", label: "Gehebelte ETFs" },
  { code: "active", label: "Aktiv gemanagte Fonds" },
] as const;

export function EtfTypeToggle({ activeCode }: { activeCode: string }) {
  return (
    <div className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-border bg-surface p-1 text-sm">
      {ETF_TYPES.map((etfType) => {
        const isActive = etfType.code === activeCode;
        return (
          <Link
            key={etfType.code}
            href={{ pathname: "/trading-intelligence", query: { category: "etfs", etfType: etfType.code } }}
            className={
              isActive
                ? "rounded-full bg-gradient-accent px-4 py-1.5 font-medium text-white"
                : "rounded-full px-4 py-1.5 text-muted transition-colors hover:text-foreground"
            }
          >
            {etfType.label}
          </Link>
        );
      })}
    </div>
  );
}
