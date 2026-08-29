import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Trading Intelligence — TradeInsider" };

export default function Page() {
  return (
    <ComingSoon
      title="Trading Intelligence"
      description="Fundamentale und technische Analysen zu Aktien folgen in Kürze."
    />
  );
}
