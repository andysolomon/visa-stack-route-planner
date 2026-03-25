"use server";

import { auth } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  users,
  itineraries,
  tripLegs,
  travelerProfiles,
  passports,
  visaRules,
} from "@/lib/db/schema";
import { validateItinerary } from "@/lib/visa/compliance";
import { getRouteSuggestions, type RouteSuggestions } from "@/lib/ai/route-suggestions";
import type { TripLeg } from "@/types/domain";

export async function getAISuggestions(
  itineraryId: string
): Promise<RouteSuggestions> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) throw new Error("User not found");

  // Verify ownership
  const [itinerary] = await db
    .select()
    .from(itineraries)
    .where(and(eq(itineraries.id, itineraryId), eq(itineraries.userId, user.id)))
    .limit(1);
  if (!itinerary) throw new Error("Itinerary not found");

  // Get passport nationality
  const [profile] = await db
    .select()
    .from(travelerProfiles)
    .where(eq(travelerProfiles.userId, user.id))
    .limit(1);

  let passportNationality = "US";
  if (profile) {
    const [passport] = await db
      .select()
      .from(passports)
      .where(eq(passports.profileId, profile.id))
      .limit(1);
    if (passport) passportNationality = passport.nationality;
  }

  // Fetch legs
  const legs = await db
    .select()
    .from(tripLegs)
    .where(eq(tripLegs.itineraryId, itineraryId))
    .orderBy(asc(tripLegs.sortOrder));

  const domainLegs: TripLeg[] = legs.map((l) => ({
    id: l.id,
    countryCode: l.countryCode,
    arrivalDate: l.arrivalDate,
    departureDate: l.departureDate,
  }));

  // Check if already compliant
  const compliance = await validateItinerary(domainLegs, passportNationality);
  if (compliance.isCompliant) {
    return { suggestions: [] };
  }

  // Fetch relevant visa rules
  const countryCodes = [...new Set(domainLegs.map((l) => l.countryCode))];
  const relevantRules = await db
    .select()
    .from(visaRules)
    .where(eq(visaRules.passportNationality, passportNationality));
  const filteredRules = relevantRules.filter((r) =>
    countryCodes.includes(r.countryCode)
  );

  return getRouteSuggestions({
    currentLegs: domainLegs,
    complianceIssues: compliance.issues,
    visaRules: filteredRules,
    passportNationality,
  });
}
