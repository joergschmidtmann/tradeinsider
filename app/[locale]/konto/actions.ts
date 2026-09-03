"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect as localizedRedirect, getPathname } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { stripe, PRO_MONTHLY_LOOKUP_KEY, PRO_YEARLY_LOOKUP_KEY } from "@/lib/stripe";

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  localizedRedirect({ href: "/", locale });
}

export async function createCheckoutSession(interval: "month" | "year") {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getLocale();
  if (!user?.email) {
    localizedRedirect({ href: { pathname: "/login", query: { next: "/konto" } }, locale });
    return;
  }

  const lookupKey = interval === "month" ? PRO_MONTHLY_LOOKUP_KEY : PRO_YEARLY_LOOKUP_KEY;
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  const price = prices.data[0];
  if (!price) {
    throw new Error(`No Stripe price found for lookup_key "${lookupKey}". Run "npm run setup:stripe" first.`);
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const kontoPath = getPathname({ href: "/konto", locale });
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${origin}${kontoPath}?upgraded=1`,
    cancel_url: `${origin}${kontoPath}`,
  });

  // Stripe's URL is external — must use the plain (non-locale-prefixing) redirect.
  if (session.url) redirect(session.url);
}

export async function openBillingPortal() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getLocale();
  if (!user) {
    localizedRedirect({ href: { pathname: "/login", query: { next: "/konto" } }, locale });
    return;
  }

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  if (!profile?.stripe_customer_id) {
    localizedRedirect({ href: "/konto", locale });
    return;
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const kontoPath = getPathname({ href: "/konto", locale });
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}${kontoPath}`,
  });

  // External URL — plain redirect again.
  redirect(portalSession.url);
}
