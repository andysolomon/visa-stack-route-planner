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
} from "@/lib/db/schema";
import { validateItinerary } from "@/lib/visa/compliance";
import {
  calculateSchengenDaysUsed,
  getSchengenRemainingDays,
  isSchengenCountry,
} from "@/lib/visa/schengen";
import type { TripLeg, ComplianceResult } from "@/types/domain";
import countries from "@/lib/data/countries.json";

const countryMap = new Map(countries.map((c) => [c.code, c.name]));

export interface PerCountryStatus {
  countryCode: string;
  countryName: string;
  totalDays: number;
  status: "compliant" | "violation" | "warning";
}

export interface ComplianceData {
  overall: ComplianceResult;
  schengen: { daysUsed: number; daysRemaining: number };
  perCountry: PerCountryStatus[];
}

function toEpochDay(iso: string): number {
  return Math.floor(new Date(iso + "T00:00:00Z").getTime() / 86_400_000);
}

function countDays(legs: TripLeg[]): number {
  const days = new Set<number>();
  for (const leg of legs) {
    const start = toEpochDay(leg.arrivalDate);
    const end = toEpochDay(leg.departureDate);
    for (let d = start; d <= end; d++) days.add(d);
  }
  return days.size;
}

export async function checkCompliance(
  itineraryId: string
): Promise<ComplianceData | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) return null;

  // Verify ownership
  const [itinerary] = await db
    .select()
    .from(itineraries)
    .where(and(eq(itineraries.id, itineraryId), eq(itineraries.userId, user.id)))
    .limit(1);
  if (!itinerary) return null;

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

  // Overall compliance
  const overall = await validateItinerary(domainLegs, passportNationality);

  // Schengen summary
  const schengenLegs = domainLegs.filter((l) => isSchengenCountry(l.countryCode));
  const now = new Date();
  const schengenDaysUsed = calculateSchengenDaysUsed(schengenLegs, now);
  const schengenDaysRemaining = getSchengenRemainingDays(schengenLegs, now);

  // Per-country breakdown
  const byCountry = new Map<string, TripLeg[]>();
  for (const leg of domainLegs) {
    const code = leg.countryCode.toUpperCase();
    if (!byCountry.has(code)) byCountry.set(code, []);
    byCountry.get(code)!.push(leg);
  }

  const perCountry: PerCountryStatus[] = [];
  for (const [code, countryLegs] of byCountry) {
    const totalDays = countDays(countryLegs);
    const hasViolation = overall.issues.some((i) =>
      i.toLowerCase().includes(code.toLowerCase())
    );

    let status: PerCountryStatus["status"] = "compliant";
    if (hasViolation) {
      status = "violation";
    } else if (isSchengenCountry(code) && schengenDaysRemaining < 7) {
      status = "warning";
    }

    perCountry.push({
      countryCode: code,
      countryName: countryMap.get(code) ?? code,
      totalDays,
      status,
    });
  }

  return {
    overall,
    schengen: { daysUsed: schengenDaysUsed, daysRemaining: schengenDaysRemaining },
    perCountry,
  };
}
