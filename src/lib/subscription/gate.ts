import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";

export async function isSubscribed(userId: string): Promise<boolean> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        gt(subscriptions.currentPeriodEnd, new Date())
      )
    )
    .limit(1);

  return !!sub;
}
