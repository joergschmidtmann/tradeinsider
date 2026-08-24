import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Saisonalitäten — TradeInsider" };

export default function Page() {
  return (
    <ComingSoon
      title="Saisonalitäten"
      description="Saisonale Muster und Zyklen an den Märkten folgen in Kürze."
    />
  );
}
