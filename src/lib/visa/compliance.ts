import type { TripLeg, ComplianceResult } from "@/types/domain";
import { isSchengenCountry, calculateSchengenDaysUsed } from "./schengen";
import { getVisaRule } from "./lookup";

/** Convert ISO date string to epoch day number for dedup. */
function toEpochDay(iso: string): number {
  return Math.floor(new Date(iso + "T00:00:00Z").getTime() / 86_400_000);
}

/** Count unique days across legs for a single country (inclusive both ends, dedup overlaps). */
function calculateDaysInCountry(legs: TripLeg[]): number {
  const days = new Set<number>();
  for (const leg of legs) {
    const start = toEpochDay(leg.arrivalDate);
    const end = toEpochDay(leg.departureDate);
    for (let d = start; d <= end; d++) {
      days.add(d);
    }
  }
  return days.size;
}

/**
 * Validate an entire itinerary against visa rules for a given passport nationality.
 *
 * - Schengen countries: uses the 90/180 rolling window calculator
 * - Non-Schengen countries: simple day-count vs stayLimitDays
 * - Missing rules: informational issue (does not fail compliance)
 * - Unlimited stay (-1): always passes
 */
export async function validateItinerary(
  legs: TripLeg[],
  passportNationality: string
): Promise<ComplianceResult> {
  const issues: string[] = [];
  let isCompliant = true;

  if (legs.length === 0) {
    return { itineraryId: "", isCompliant: true, issues: [] };
  }

  // Group legs by country
  const byCountry = new Map<string, TripLeg[]>();
  for (const leg of legs) {
    const code = leg.countryCode.toUpperCase();
    if (!byCountry.has(code)) byCountry.set(code, []);
    byCountry.get(code)!.push(leg);
  }

  // Schengen check: collect all Schengen legs and check cumulative
  const schengenLegs = legs.filter((l) => isSchengenCountry(l.countryCode));
  if (schengenLegs.length > 0) {
    // Find the latest departure date among Schengen legs
    const latestDeparture = schengenLegs.reduce((latest, leg) => {
      const d = new Date(leg.departureDate + "T00:00:00Z");
      return d > latest ? d : latest;
    }, new Date(schengenLegs[0].departureDate + "T00:00:00Z"));

    const daysUsed = calculateSchengenDaysUsed(schengenLegs, latestDeparture);
    if (daysUsed > 90) {
      isCompliant = false;
      issues.push(
        `Schengen 90/180 rule violated: ${daysUsed} days used in 180-day window (limit: 90)`
      );
    }
  }

  // Non-Schengen per-country check
  for (const [countryCode, countryLegs] of byCountry) {
    if (isSchengenCountry(countryCode)) continue;

    const rule = await getVisaRule(countryCode, passportNationality);

    if (!rule) {
      issues.push(`No visa rules found for ${countryCode}`);
      continue;
    }

    // Unlimited stay
    if (rule.stayLimitDays === -1) continue;

    const totalDays = calculateDaysInCountry(countryLegs);

    if (totalDays > rule.stayLimitDays) {
      isCompliant = false;
      const windowInfo = rule.windowDays
        ? ` in ${rule.windowDays}-day window`
        : "";
      issues.push(
        `${countryCode} overstay: ${totalDays} days used (limit: ${rule.stayLimitDays}${windowInfo})`
      );
    }
  }

  return { itineraryId: "", isCompliant, issues };
}
