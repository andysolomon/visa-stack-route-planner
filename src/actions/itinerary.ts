"use server";

import { auth } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users, itineraries, tripLegs } from "@/lib/db/schema";
import { isSubscribed } from "@/lib/subscription/gate";
import {
  createItinerarySchema,
  updateItinerarySchema,
  deleteItinerarySchema,
  addLegSchema,
  updateLegSchema,
  removeLegSchema,
  reorderLegsSchema,
} from "@/lib/validators/itinerary";

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) throw new Error("User not found");
  return user;
}

async function verifyItineraryOwnership(itineraryId: string, userId: string) {
  const [itinerary] = await db
    .select()
    .from(itineraries)
    .where(and(eq(itineraries.id, itineraryId), eq(itineraries.userId, userId)))
    .limit(1);

  if (!itinerary) throw new Error("Itinerary not found");
  return itinerary;
}

export async function createItinerary(input: { name: string }) {
  const user = await getAuthenticatedUser();
  const parsed = createItinerarySchema.parse(input);

  const [itinerary] = await db
    .insert(itineraries)
    .values({ userId: user.id, name: parsed.name })
    .returning();

  return itinerary;
}

export async function updateItinerary(input: {
  id: string;
  name?: string;
  status?: string;
}) {
  const user = await getAuthenticatedUser();
  const parsed = updateItinerarySchema.parse(input);

  await verifyItineraryOwnership(parsed.id, user.id);

  const updateData: Record<string, unknown> = {};
  if (parsed.name !== undefined) updateData.name = parsed.name;
  if (parsed.status !== undefined) updateData.status = parsed.status;

  const [updated] = await db
    .update(itineraries)
    .set(updateData)
    .where(eq(itineraries.id, parsed.id))
    .returning();

  return updated;
}

export async function deleteItinerary(input: { id: string }) {
  const user = await getAuthenticatedUser();
  const parsed = deleteItinerarySchema.parse(input);

  await verifyItineraryOwnership(parsed.id, user.id);

  await db.delete(itineraries).where(eq(itineraries.id, parsed.id));
}

export async function addLeg(input: {
  itineraryId: string;
  countryCode: string;
  arrivalDate: string;
  departureDate: string;
  city?: string;
  lat?: number;
  lng?: number;
}) {
  const user = await getAuthenticatedUser();
  const parsed = addLegSchema.parse(input);

  await verifyItineraryOwnership(parsed.itineraryId, user.id);

  // Free-tier check
  const existingLegs = await db
    .select()
    .from(tripLegs)
    .where(eq(tripLegs.itineraryId, parsed.itineraryId));

  if (existingLegs.length >= 2 && !(await isSubscribed(user.id))) {
    throw new Error("Upgrade to add more than 2 destinations");
  }

  const [leg] = await db
    .insert(tripLegs)
    .values({
      itineraryId: parsed.itineraryId,
      countryCode: parsed.countryCode,
      arrivalDate: parsed.arrivalDate,
      departureDate: parsed.departureDate,
      city: parsed.city,
      lat: parsed.lat,
      lng: parsed.lng,
      sortOrder: existingLegs.length,
    })
    .returning();

  return leg;
}

export async function updateLeg(input: {
  id: string;
  countryCode?: string;
  arrivalDate?: string;
  departureDate?: string;
  city?: string;
  lat?: number;
  lng?: number;
}) {
  const user = await getAuthenticatedUser();
  const parsed = updateLegSchema.parse(input);

  // Verify ownership via join
  const [leg] = await db
    .select()
    .from(tripLegs)
    .innerJoin(itineraries, eq(tripLegs.itineraryId, itineraries.id))
    .where(and(eq(tripLegs.id, parsed.id), eq(itineraries.userId, user.id)))
    .limit(1);

  if (!leg) throw new Error("Leg not found");

  const updateData: Record<string, unknown> = {};
  if (parsed.countryCode !== undefined) updateData.countryCode = parsed.countryCode;
  if (parsed.arrivalDate !== undefined) updateData.arrivalDate = parsed.arrivalDate;
  if (parsed.departureDate !== undefined) updateData.departureDate = parsed.departureDate;
  if (parsed.city !== undefined) updateData.city = parsed.city;
  if (parsed.lat !== undefined) updateData.lat = parsed.lat;
  if (parsed.lng !== undefined) updateData.lng = parsed.lng;

  const [updated] = await db
    .update(tripLegs)
    .set(updateData)
    .where(eq(tripLegs.id, parsed.id))
    .returning();

  return updated;
}

export async function removeLeg(input: { id: string }) {
  const user = await getAuthenticatedUser();
  const parsed = removeLegSchema.parse(input);

  // Verify ownership via join
  const [leg] = await db
    .select({ tripLeg: tripLegs, itinerary: itineraries })
    .from(tripLegs)
    .innerJoin(itineraries, eq(tripLegs.itineraryId, itineraries.id))
    .where(and(eq(tripLegs.id, parsed.id), eq(itineraries.userId, user.id)))
    .limit(1);

  if (!leg) throw new Error("Leg not found");

  await db.transaction(async (tx) => {
    await tx.delete(tripLegs).where(eq(tripLegs.id, parsed.id));

    // Re-index remaining legs
    const remaining = await tx
      .select()
      .from(tripLegs)
      .where(eq(tripLegs.itineraryId, leg.itinerary.id))
      .orderBy(asc(tripLegs.sortOrder));

    for (let i = 0; i < remaining.length; i++) {
      await tx
        .update(tripLegs)
        .set({ sortOrder: i })
        .where(eq(tripLegs.id, remaining[i].id));
    }
  });
}

export async function reorderLegs(input: {
  itineraryId: string;
  legIds: string[];
}) {
  const user = await getAuthenticatedUser();
  const parsed = reorderLegsSchema.parse(input);

  await verifyItineraryOwnership(parsed.itineraryId, user.id);

  await db.transaction(async (tx) => {
    for (let i = 0; i < parsed.legIds.length; i++) {
      await tx
        .update(tripLegs)
        .set({ sortOrder: i })
        .where(
          and(
            eq(tripLegs.id, parsed.legIds[i]),
            eq(tripLegs.itineraryId, parsed.itineraryId)
          )
        );
    }
  });
}

export async function replaceAllLegs(input: {
  itineraryId: string;
  legs: Array<{
    countryCode: string;
    arrivalDate: string;
    departureDate: string;
  }>;
}) {
  const user = await getAuthenticatedUser();

  await verifyItineraryOwnership(input.itineraryId, user.id);

  await db.transaction(async (tx) => {
    // Delete all existing legs
    await tx
      .delete(tripLegs)
      .where(eq(tripLegs.itineraryId, input.itineraryId));

    // Insert new legs with sequential sortOrder
    if (input.legs.length > 0) {
      await tx.insert(tripLegs).values(
        input.legs.map((leg, i) => ({
          itineraryId: input.itineraryId,
          countryCode: leg.countryCode,
          arrivalDate: leg.arrivalDate,
          departureDate: leg.departureDate,
          sortOrder: i,
        }))
      );
    }
  });
}
