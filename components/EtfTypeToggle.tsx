import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const ETF_TYPES = ["etfs", "leveraged", "active", "commodity"] as const;

export function EtfTypeToggle({ activeCode }: { activeCode: string }) {
  const t = useTranslations("tradingIntelligence.etfTypes");

  return (
    <div className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-border bg-surface p-1 text-sm">
      {ETF_TYPES.map((code) => {
        const isActive = code === activeCode;
        return (
          <Link
            key={code}
            href={{ pathname: "/trading-intelligence", query: { category: "etfs", etfType: code } }}
            className={
              isActive
                ? "rounded-full bg-gradient-accent px-4 py-1.5 font-medium text-white"
                : "rounded-full px-4 py-1.5 text-muted transition-colors hover:text-foreground"
            }
          >
            {t(code)}
          </Link>
        );
      })}
    </div>
  );
}
