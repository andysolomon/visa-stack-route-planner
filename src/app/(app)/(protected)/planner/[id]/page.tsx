import { auth } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { db } from "@/lib/db";
import { users, itineraries, tripLegs } from "@/lib/db/schema";
import countries from "@/lib/data/countries.json";

import { RouteMap } from "@/components/map/route-map";
import { ItineraryHeader } from "@/components/planner/itinerary-header";
import { AddDestination } from "@/components/planner/add-destination";
import { LegList } from "@/components/planner/leg-list";
import { CompliancePanel } from "@/components/planner/compliance-panel";
import { TimelineView } from "@/components/planner/timeline-view";
import { AISuggestionsPanel } from "@/components/planner/ai-suggestions-panel";
import { checkCompliance } from "@/actions/compliance";

export default async function PlannerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) redirect("/sign-in");

  const [itinerary] = await db
    .select()
    .from(itineraries)
    .where(and(eq(itineraries.id, id), eq(itineraries.userId, user.id)))
    .limit(1);

  if (!itinerary) notFound();

  const legs = await db
    .select()
    .from(tripLegs)
    .where(eq(tripLegs.itineraryId, id))
    .orderBy(asc(tripLegs.sortOrder));

  const mapLegs = legs.map((l) => ({
    id: l.id,
    countryCode: l.countryCode,
    sortOrder: l.sortOrder,
    lat: l.lat,
    lng: l.lng,
  }));

  const listLegs = legs.map((l) => ({
    id: l.id,
    itineraryId: l.itineraryId,
    countryCode: l.countryCode,
    city: l.city,
    arrivalDate: l.arrivalDate,
    departureDate: l.departureDate,
    sortOrder: l.sortOrder,
  }));

  const compliance = legs.length > 0 ? await checkCompliance(itinerary.id) : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
      <aside className="w-full md:w-96 overflow-y-auto border-r p-4 space-y-4">
        <ItineraryHeader
          id={itinerary.id}
          name={itinerary.name}
          status={itinerary.status}
        />
        <AddDestination itineraryId={itinerary.id} countries={countries} />
        <LegList
          itineraryId={itinerary.id}
          legs={listLegs}
          countries={countries}
        />
        <CompliancePanel compliance={compliance} />
        <AISuggestionsPanel
          itineraryId={itinerary.id}
          isCompliant={compliance?.overall.isCompliant ?? true}
        />
      </aside>
      <div className="flex-1 min-h-[300px] flex flex-col">
        <div className="flex-1">
          <RouteMap
            legs={mapLegs}
            compliancePerCountry={compliance?.perCountry}
          />
        </div>
        {listLegs.length > 0 && (
          <div className="border-t p-4">
            <h3 className="text-sm font-medium mb-2">Timeline</h3>
            <TimelineView legs={listLegs} compliance={compliance} />
          </div>
        )}
      </div>
    </div>
  );
}
