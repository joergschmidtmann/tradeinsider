import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY must be set.");
}

export const stripe = new Stripe(secretKey);

export const PRO_MONTHLY_LOOKUP_KEY = "pro_monthly";
export const PRO_YEARLY_LOOKUP_KEY = "pro_yearly";
