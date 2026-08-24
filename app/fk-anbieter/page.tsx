import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "FK Anbieter — TradeInsider" };

export default function Page() {
  return (
    <ComingSoon
      title="FK Anbieter"
      description="Ein Vergleich von Broker-Anbietern folgt in Kürze."
    />
  );
}
