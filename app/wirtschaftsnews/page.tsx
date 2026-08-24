import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Wirtschaftsnews — TradeInsider" };

export default function Page() {
  return (
    <ComingSoon
      title="Wirtschaftsnews"
      description="Aktuelle Wirtschaftsnachrichten folgen in Kürze."
    />
  );
}
