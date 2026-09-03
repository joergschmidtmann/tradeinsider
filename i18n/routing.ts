import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en", "es"],
  defaultLocale: "de",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
