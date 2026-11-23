import Stripe from "stripe";

let client: Stripe | null = null;

/** Stripe-Client, erst beim ersten tatsächlichen Gebrauch erzeugt. So scheitert
 * der Build (Next.js wertet Module beim "Collecting page data" aus) nicht an
 * einem fehlenden Laufzeit-Schlüssel; fehlt STRIPE_SECRET_KEY, schlägt erst
 * der konkrete Stripe-Aufruf fehl — mit derselben klaren Fehlermeldung. */
function getStripe(): Stripe {
  if (client) return client;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY must be set.");
  }
  client = new Stripe(secretKey);
  return client;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});

export const PRO_MONTHLY_LOOKUP_KEY = "pro_monthly";
export const PRO_YEARLY_LOOKUP_KEY = "pro_yearly";
