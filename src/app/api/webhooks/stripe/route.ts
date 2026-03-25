import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!userId || !customerId || !subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);

      // Compute period end from billing cycle anchor + 30 days as default
      const periodEnd = sub.cancel_at
        ? new Date(sub.cancel_at * 1000)
        : new Date(Date.now() + 30 * 86_400_000);

      await db.insert(subscriptions).values({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: sub.status,
        currentPeriodEnd: periodEnd,
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const periodEnd = sub.cancel_at
        ? new Date(sub.cancel_at * 1000)
        : new Date(Date.now() + 30 * 86_400_000);

      await db
        .update(subscriptions)
        .set({
          status: sub.status,
          currentPeriodEnd: periodEnd,
        })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await db
        .update(subscriptions)
        .set({ status: "canceled" })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }
  }

  return Response.json({ received: true });
}
