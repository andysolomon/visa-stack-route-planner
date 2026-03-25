import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Map } from "lucide-react";

import { db } from "@/lib/db";
import { users, itineraries } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createItinerary } from "@/actions/itinerary";

export default async function PlannerPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) redirect("/sign-in");

  const userItineraries = await db
    .select()
    .from(itineraries)
    .where(eq(itineraries.userId, user.id))
    .orderBy(desc(itineraries.updatedAt));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Route Planner</h1>
        <form
          action={async () => {
            "use server";
            const itin = await createItinerary({ name: "Untitled Trip" });
            redirect(`/planner/${itin.id}`);
          }}
        >
          <Button type="submit">New Itinerary</Button>
        </form>
      </div>

      {userItineraries.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <Map className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Create your first itinerary to start planning.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userItineraries.map((itin) => (
            <Link key={itin.id} href={`/planner/${itin.id}`}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{itin.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground">
                    {itin.status}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
