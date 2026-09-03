import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const CATEGORIES = ["etfs", "krypto", "aktien"] as const;

export function CategoryToggle({ activeCode }: { activeCode: string }) {
  const t = useTranslations("tradingIntelligence.categories");

  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-1 text-sm">
      {CATEGORIES.map((code) => {
        const isActive = code === activeCode;
        return (
          <Link
            key={code}
            href={{ pathname: "/trading-intelligence", query: { category: code } }}
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
