import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

async function setTierByUserId(userId: string, fields: { tier: "free" | "pro"; stripe_customer_id?: string; stripe_subscription_id?: string | null }) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("profiles").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", userId);
}

async function setTierByCustomerId(customerId: string, tier: "free" | "pro", subscriptionId: string | null) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("profiles")
    .update({ tier, stripe_subscription_id: subscriptionId, updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", customerId);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    return NextResponse.json({ error: `Invalid signature: ${(error as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId && typeof session.customer === "string") {
        await setTierByUserId(userId, {
          tier: "pro",
          stripe_customer_id: session.customer,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const isActive = subscription.status === "active" || subscription.status === "trialing";
      await setTierByCustomerId(customerId, isActive ? "pro" : "free", isActive ? subscription.id : null);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
