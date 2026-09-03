import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/components/ComingSoon";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("tradingAcademyTitle") };
}

export default async function Page() {
  const t = await getTranslations("tradingAcademy");
  return <ComingSoon title={t("title")} description={t("description")} />;
}
