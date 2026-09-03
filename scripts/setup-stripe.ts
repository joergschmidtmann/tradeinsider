import "dotenv/config";
import Stripe from "stripe";
import { PRO_MONTHLY_LOOKUP_KEY, PRO_YEARLY_LOOKUP_KEY } from "../lib/stripe";

/** Idempotently creates the "Pro" product and its two recurring prices in
 * whichever Stripe account/sandbox STRIPE_SECRET_KEY points at. Safe to run
 * more than once — prices are looked up by lookup_key first. */
async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY must be set.");
  }
  const stripe = new Stripe(secretKey);

  const existing = await stripe.prices.list({
    lookup_keys: [PRO_MONTHLY_LOOKUP_KEY, PRO_YEARLY_LOOKUP_KEY],
    limit: 2,
  });
  const existingKeys = new Set(existing.data.map((price) => price.lookup_key));

  if (existingKeys.has(PRO_MONTHLY_LOOKUP_KEY) && existingKeys.has(PRO_YEARLY_LOOKUP_KEY)) {
    console.log("Both prices already exist, nothing to do.");
    for (const price of existing.data) {
      console.log(`${price.lookup_key}: ${price.id}`);
    }
    return;
  }

  const product = await stripe.products.create({
    name: "tradeinsider Pro",
    description: "Voller Zugriff auf Insider-Käufe von Vorständen und Aufsichtsräten inkl. Insider-Score.",
  });
  console.log(`Created product: ${product.id}`);

  if (!existingKeys.has(PRO_MONTHLY_LOOKUP_KEY)) {
    const price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: 1499,
      recurring: { interval: "month" },
      lookup_key: PRO_MONTHLY_LOOKUP_KEY,
    });
    console.log(`Created monthly price: ${price.id}`);
  }

  if (!existingKeys.has(PRO_YEARLY_LOOKUP_KEY)) {
    const price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: 14900,
      recurring: { interval: "year" },
      lookup_key: PRO_YEARLY_LOOKUP_KEY,
    });
    console.log(`Created yearly price: ${price.id}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
