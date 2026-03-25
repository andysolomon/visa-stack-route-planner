import { describe, expect, it } from "vitest";
import {
  SCHENGEN_COUNTRIES,
  isSchengenCountry,
  calculateSchengenDaysUsed,
  getSchengenRemainingDays,
  isSchengenCompliant,
} from "@/lib/visa/schengen";
import type { TripLeg } from "@/types/domain";

function makeLeg(
  countryCode: string,
  arrival: string,
  departure: string
): TripLeg {
  return { id: "test", countryCode, arrivalDate: arrival, departureDate: departure };
}

describe("isSchengenCountry", () => {
  it("returns true for Schengen countries", () => {
    expect(isSchengenCountry("DE")).toBe(true);
    expect(isSchengenCountry("FR")).toBe(true);
    expect(isSchengenCountry("ES")).toBe(true);
  });

  it("returns false for non-Schengen countries", () => {
    expect(isSchengenCountry("GB")).toBe(false);
    expect(isSchengenCountry("TH")).toBe(false);
    expect(isSchengenCountry("US")).toBe(false);
  });

  it("handles lowercase input", () => {
    expect(isSchengenCountry("de")).toBe(true);
    expect(isSchengenCountry("gb")).toBe(false);
  });

  it("has exactly 27 Schengen countries", () => {
    expect(SCHENGEN_COUNTRIES.size).toBe(27);
  });
});

describe("calculateSchengenDaysUsed", () => {
  it("returns 0 for empty legs", () => {
    const result = calculateSchengenDaysUsed([], new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(0);
  });

  it("counts a single short stay (inclusive both ends)", () => {
    const legs = [makeLeg("DE", "2025-05-20", "2025-05-29")];
    // May 20 to May 29 inclusive = 10 days
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(10);
  });

  it("counts a same-day trip as 1 day", () => {
    const legs = [makeLeg("FR", "2025-05-15", "2025-05-15")];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(1);
  });

  it("counts exactly 90 days", () => {
    // 90 days: Jan 1 to Mar 31 inclusive
    const legs = [makeLeg("DE", "2025-01-01", "2025-03-31")];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-03-31T00:00:00Z"));
    expect(result).toBe(90);
  });

  it("accumulates days across multiple Schengen countries", () => {
    const legs = [
      makeLeg("DE", "2025-05-01", "2025-05-10"), // 10 days
      makeLeg("FR", "2025-05-11", "2025-05-20"), // 10 days
      makeLeg("ES", "2025-05-21", "2025-05-25"), // 5 days
    ];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(25);
  });

  it("excludes non-Schengen countries", () => {
    const legs = [
      makeLeg("DE", "2025-05-01", "2025-05-10"), // 10 Schengen days
      makeLeg("TH", "2025-05-11", "2025-05-20"), // NOT Schengen
      makeLeg("GB", "2025-05-21", "2025-05-25"), // NOT Schengen
    ];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(10);
  });

  it("old days roll off after 180-day window", () => {
    // Stay ended 200 days ago — fully outside the 180-day window
    const legs = [makeLeg("DE", "2024-10-01", "2024-10-30")]; // 30 days
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(0);
  });

  it("partially overlaps with the 180-day window", () => {
    // Window starts Dec 4 for asOfDate Jun 1
    // Leg: Nov 25 to Dec 10 — only Dec 4-10 in window = 7 days
    const legs = [makeLeg("DE", "2024-11-25", "2024-12-10")];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(7);
  });

  it("does not double-count overlapping legs", () => {
    const legs = [
      makeLeg("DE", "2025-05-01", "2025-05-10"),
      makeLeg("FR", "2025-05-08", "2025-05-15"), // overlaps May 8-10
    ];
    // Unique days: May 1-15 = 15 days (not 10+8=18)
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(15);
  });
});

describe("getSchengenRemainingDays", () => {
  it("returns 90 for no legs", () => {
    expect(getSchengenRemainingDays([], new Date("2025-06-01T00:00:00Z"))).toBe(90);
  });

  it("returns correct remaining after usage", () => {
    const legs = [makeLeg("DE", "2025-05-01", "2025-05-25")]; // 25 days
    expect(getSchengenRemainingDays(legs, new Date("2025-06-01T00:00:00Z"))).toBe(65);
  });

  it("returns 0 when at or over limit", () => {
    const legs = [makeLeg("DE", "2025-01-01", "2025-03-31")]; // 90 days
    expect(getSchengenRemainingDays(legs, new Date("2025-03-31T00:00:00Z"))).toBe(0);
  });
});

describe("isSchengenCompliant", () => {
  it("returns compliant for a short proposed stay with room remaining", () => {
    const legs = [makeLeg("DE", "2025-03-01", "2025-03-20")]; // 20 days used
    const proposed = makeLeg("FR", "2025-04-01", "2025-04-10"); // 10 more days
    const result = isSchengenCompliant(legs, proposed);

    expect(result.compliant).toBe(true);
    expect(result.daysUsed).toBe(30);
    expect(result.daysRemaining).toBe(60);
    expect(result.violationDate).toBeUndefined();
  });

  it("returns non-compliant with violationDate when exceeding 90 days", () => {
    // 80 days already used (Jan 1 - Mar 21)
    const legs = [makeLeg("DE", "2025-01-01", "2025-03-21")]; // 80 days
    // Propose 15 more days — violation on day 11 (Apr 10)
    const proposed = makeLeg("FR", "2025-04-01", "2025-04-15");
    const result = isSchengenCompliant(legs, proposed);

    expect(result.compliant).toBe(false);
    expect(result.daysUsed).toBeGreaterThan(90);
    expect(result.daysRemaining).toBe(0);
    expect(result.violationDate).toBeDefined();
  });

  it("returns compliant for non-Schengen proposed leg", () => {
    const legs = [makeLeg("DE", "2025-01-01", "2025-03-31")]; // 90 days
    const proposed = makeLeg("TH", "2025-04-01", "2025-04-30"); // Thailand, not Schengen
    const result = isSchengenCompliant(legs, proposed);

    expect(result.compliant).toBe(true);
  });

  it("handles proposed stay at exactly 90 days total", () => {
    const legs = [makeLeg("DE", "2025-03-01", "2025-03-20")]; // 20 days
    // Propose exactly 70 more days to hit 90
    const proposed = makeLeg("FR", "2025-04-01", "2025-06-09"); // 70 days
    const result = isSchengenCompliant(legs, proposed);

    expect(result.compliant).toBe(true);
    expect(result.daysUsed).toBe(90);
    expect(result.daysRemaining).toBe(0);
  });
});
