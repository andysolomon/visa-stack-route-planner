import Stripe from "stripe";

let _stripe: Stripe | undefined;

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error(
          "STRIPE_SECRET_KEY is not set. Add it to .env.local or provision via Stripe Dashboard."
        );
      }
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return (_stripe as unknown as Record<string | symbol, unknown>)[prop];
  },
});
