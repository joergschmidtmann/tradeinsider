import Link from "next/link";

const TABS = [
  { code: "P", label: "Purchases" },
  { code: "S", label: "Sales" },
] as const;

export function TypeToggle({ activeCode, q }: { activeCode: string; q: string }) {
  return (
    <div className="inline-flex rounded-md border border-black/15 p-0.5 text-sm dark:border-white/15">
      {TABS.map((tab) => {
        const isActive = tab.code === activeCode;
        return (
          <Link
            key={tab.code}
            href={{ pathname: "/", query: { ...(q ? { q } : {}), type: tab.code } }}
            className={
              isActive
                ? "rounded px-3 py-1 bg-black text-white dark:bg-white dark:text-black"
                : "rounded px-3 py-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
