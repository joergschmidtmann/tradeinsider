import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Trading Academy — TradeInsider" };

export default function Page() {
  return (
    <ComingSoon
      title="Trading Academy"
      description="Kurse und Guides rund ums Trading folgen in Kürze."
    />
  );
}
