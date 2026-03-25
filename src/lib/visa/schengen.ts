import type { TripLeg } from "@/types/domain";

/**
 * All 27 Schengen Area member states (ISO 3166-1 alpha-2).
 */
export const SCHENGEN_COUNTRIES = new Set([
  "AT", "BE", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IS", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO",
  "PL", "PT", "SK", "SI", "ES", "SE", "CH",
]);

export function isSchengenCountry(code: string): boolean {
  return SCHENGEN_COUNTRIES.has(code.toUpperCase());
}

/** Parse an ISO date string (YYYY-MM-DD) as UTC midnight. */
function parseDate(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

/** Convert a Date to an integer "epoch day" for Set-based dedup. */
function toEpochDay(d: Date): number {
  return Math.floor(d.getTime() / 86_400_000);
}

/** Add n days to a date (UTC). */
function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setUTCDate(result.getUTCDate() + n);
  return result;
}

/**
 * Count Schengen days used in the 180-day rolling window ending on `asOfDate`.
 *
 * Day counting is inclusive on both ends: a stay from Jan 1 to Jan 3 = 3 days.
 * Uses a Set of epoch-days to avoid double-counting overlapping legs.
 */
export function calculateSchengenDaysUsed(
  legs: TripLeg[],
  asOfDate: Date
): number {
  const windowEnd = toEpochDay(asOfDate);
  const windowStart = toEpochDay(addDays(asOfDate, -179)); // 180-day window inclusive

  const schengenDays = new Set<number>();

  for (const leg of legs) {
    if (!isSchengenCountry(leg.countryCode)) continue;

    const arrival = toEpochDay(parseDate(leg.arrivalDate));
    const departure = toEpochDay(parseDate(leg.departureDate));

    const start = Math.max(arrival, windowStart);
    const end = Math.min(departure, windowEnd);

    for (let day = start; day <= end; day++) {
      schengenDays.add(day);
    }
  }

  return schengenDays.size;
}

/**
 * Get remaining Schengen days as of a given date.
 */
export function getSchengenRemainingDays(
  legs: TripLeg[],
  asOfDate: Date
): number {
  return Math.max(0, 90 - calculateSchengenDaysUsed(legs, asOfDate));
}

export interface SchengenComplianceResult {
  compliant: boolean;
  daysUsed: number;
  daysRemaining: number;
  violationDate?: Date;
}

/**
 * Check if a proposed trip leg would violate the Schengen 90/180 rule.
 *
 * Iterates day-by-day through the proposed leg and checks cumulative
 * Schengen days on each day. Returns the first violation date if found.
 */
export function isSchengenCompliant(
  legs: TripLeg[],
  proposedLeg: TripLeg
): SchengenComplianceResult {
  if (!isSchengenCountry(proposedLeg.countryCode)) {
    const daysUsed = calculateSchengenDaysUsed(
      legs,
      parseDate(proposedLeg.departureDate)
    );
    return {
      compliant: true,
      daysUsed,
      daysRemaining: Math.max(0, 90 - daysUsed),
    };
  }

  const allLegs = [...legs, proposedLeg];
  const arrival = parseDate(proposedLeg.arrivalDate);
  const departure = parseDate(proposedLeg.departureDate);

  let lastDaysUsed = 0;

  for (let d = arrival; d <= departure; d = addDays(d, 1)) {
    const daysUsed = calculateSchengenDaysUsed(allLegs, d);
    lastDaysUsed = daysUsed;

    if (daysUsed > 90) {
      return {
        compliant: false,
        daysUsed,
        daysRemaining: 0,
        violationDate: new Date(d),
      };
    }
  }

  return {
    compliant: true,
    daysUsed: lastDaysUsed,
    daysRemaining: Math.max(0, 90 - lastDaysUsed),
  };
}
