import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function BillingPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) return null;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  const isActive = sub?.status === "active";

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Billing</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan
            <Badge variant={isActive ? "default" : "outline"}>
              {isActive ? "Pro" : "Free"}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isActive
              ? `$15/month — renews ${sub.currentPeriodEnd.toLocaleDateString()}`
              : "Free tier — 2 destinations per itinerary"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isActive ? (
            <Button variant="outline" disabled>
              Manage Subscription (coming soon)
            </Button>
          ) : (
            <Button render={<Link href="/pricing" />}>Upgrade to Pro</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
