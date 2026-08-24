import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Aktienanalyse — TradeInsider" };

export default function Page() {
  return (
    <ComingSoon
      title="Aktienanalyse"
      description="Fundamentale und technische Analysen zu Aktien folgen in Kürze."
    />
  );
}
