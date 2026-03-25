import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { Check } from "lucide-react";

import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PricingCTA } from "./pricing-cta";

const FREE_FEATURES = [
  "Up to 2 destinations per itinerary",
  "Basic compliance checking",
  "Map view with route lines",
];

const PRO_FEATURES = [
  "Unlimited destinations",
  "AI-powered route suggestions",
  "Compliance timeline view",
  "Email alerts (coming soon)",
  "Priority support",
];

export default async function PricingPage() {
  const { userId: clerkId } = await auth();

  let isSubscribed = false;
  if (clerkId) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (user) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .limit(1);
      isSubscribed = sub?.status === "active";
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      <h1 className="text-3xl font-bold mb-2">Simple Pricing</h1>
      <p className="text-muted-foreground mb-8">
        Plan visa-compliant routes with confidence.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {!isSubscribed ? (
              <Badge variant="outline" className="w-full justify-center py-2">
                Current Plan
              </Badge>
            ) : (
              <Badge variant="outline" className="w-full justify-center py-2 opacity-50">
                Free
              </Badge>
            )}
          </CardFooter>
        </Card>

        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pro
              {isSubscribed && <Badge>Current Plan</Badge>}
            </CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold">$15</span>
              <span className="text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {isSubscribed ? (
              <Badge className="w-full justify-center py-2">Active</Badge>
            ) : (
              <PricingCTA />
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
