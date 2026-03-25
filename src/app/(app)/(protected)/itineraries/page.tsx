import { auth } from "@clerk/nextjs/server";
import { asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Map } from "lucide-react";

import { db } from "@/lib/db";
import {
  users,
  itineraries,
  tripLegs,
  travelerProfiles,
  passports,
} from "@/lib/db/schema";
import { validateItinerary } from "@/lib/visa/compliance";
import type { TripLeg } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { ItineraryCard } from "@/components/itinerary-card";
import { createItinerary } from "@/actions/itinerary";

export default async function ItinerariesPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) redirect("/sign-in");

  // Get passport nationality
  const [profile] = await db
    .select()
    .from(travelerProfiles)
    .where(eq(travelerProfiles.userId, user.id))
    .limit(1);

  let passportNationality = "US"; // fallback
  if (profile) {
    const [passport] = await db
      .select()
      .from(passports)
      .where(eq(passports.profileId, profile.id))
      .limit(1);
    if (passport) passportNationality = passport.nationality;
  }

  // Fetch itineraries
  const userItineraries = await db
    .select()
    .from(itineraries)
    .where(eq(itineraries.userId, user.id))
    .orderBy(desc(itineraries.updatedAt));

  // Fetch legs + compliance for each
  const itineraryData = await Promise.all(
    userItineraries.map(async (itin) => {
      const legs = await db
        .select()
        .from(tripLegs)
        .where(eq(tripLegs.itineraryId, itin.id))
        .orderBy(asc(tripLegs.sortOrder));

      const domainLegs: TripLeg[] = legs.map((l) => ({
        id: l.id,
        countryCode: l.countryCode,
        arrivalDate: l.arrivalDate,
        departureDate: l.departureDate,
      }));

      const compliance = await validateItinerary(
        domainLegs,
        passportNationality
      );

      const dates = legs.map((l) => l.arrivalDate).concat(legs.map((l) => l.departureDate));
      const earliest = dates.length > 0 ? dates.sort()[0] : null;
      const latest = dates.length > 0 ? dates.sort().reverse()[0] : null;

      return {
        ...itin,
        legCount: legs.length,
        dateRange: { earliest, latest },
        compliance: {
          isCompliant: compliance.isCompliant,
          issueCount: compliance.issues.length,
        },
      };
    })
  );

  if (itineraryData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Map className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No itineraries yet</h2>
        <p className="text-muted-foreground mb-6">
          Plan your first visa-compliant travel route.
        </p>
        <form
          action={async () => {
            "use server";
            const itin = await createItinerary({ name: "Untitled Trip" });
            redirect(`/planner/${itin.id}`);
          }}
        >
          <Button type="submit" size="lg">
            Plan Your First Route
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Itineraries</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itineraryData.map((itin) => (
          <ItineraryCard
            key={itin.id}
            id={itin.id}
            name={itin.name}
            status={itin.status}
            legCount={itin.legCount}
            dateRange={itin.dateRange}
            compliance={itin.compliance}
          />
        ))}
      </div>
    </div>
  );
}
