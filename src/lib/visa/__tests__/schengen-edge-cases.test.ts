import { describe, expect, it } from "vitest";
import {
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

describe("Schengen edge cases: leap year boundaries", () => {
  it("counts Feb 28-29 in a leap year as 2 days", () => {
    const legs = [makeLeg("DE", "2024-02-28", "2024-02-29")];
    const result = calculateSchengenDaysUsed(legs, new Date("2024-03-01T00:00:00Z"));
    expect(result).toBe(2);
  });

  it("counts Feb 28 to Mar 1 in a non-leap year as 2 days", () => {
    const legs = [makeLeg("DE", "2025-02-28", "2025-03-01")];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-03-01T00:00:00Z"));
    expect(result).toBe(2);
  });

  it("handles a 90-day stay ending on Feb 29 of a leap year", () => {
    // Dec 2 2023 to Feb 29 2024 = 90 days
    const legs = [makeLeg("FR", "2023-12-02", "2024-02-29")];
    const result = calculateSchengenDaysUsed(legs, new Date("2024-02-29T00:00:00Z"));
    expect(result).toBe(90);
  });
});

describe("Schengen edge cases: 90 days + leave + re-enter after reset", () => {
  it("all days roll off after 180-day window passes", () => {
    // 90-day stay: Jan 1 to Mar 31 2025
    const legs = [makeLeg("DE", "2025-01-01", "2025-03-31")];
    // Check on Sep 28 2025 — 180 days after Mar 31, so entire stay is outside window
    const result = calculateSchengenDaysUsed(legs, new Date("2025-09-28T00:00:00Z"));
    expect(result).toBe(0);
  });

  it("re-entry after full reset is compliant with 90 days remaining", () => {
    const oldLeg = makeLeg("DE", "2025-01-01", "2025-03-31"); // 90 days used
    const newLeg = makeLeg("FR", "2025-07-01", "2025-07-10"); // new 10-day stay

    const result = isSchengenCompliant([oldLeg], newLeg);
    expect(result.compliant).toBe(true);
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it("partial rolloff: some old days still in window", () => {
    // Stay Mar 1 - Mar 31 (31 days)
    const legs = [makeLeg("DE", "2025-03-01", "2025-03-31")];
    // Check on Aug 1 2025 — window starts Feb 2 2025
    // Mar 1-31 is fully in [Feb 2, Aug 1] window = 31 days used
    const result = calculateSchengenDaysUsed(legs, new Date("2025-08-01T00:00:00Z"));
    expect(result).toBe(31);
  });
});

describe("Schengen edge cases: window boundary crossing", () => {
  it("leg starting before window and ending inside counts only in-window days", () => {
    // Window for asOfDate Jun 1: starts Dec 4 of prior year
    // Leg: Nov 20 to Dec 10 — only Dec 4-10 in window = 7 days
    const legs = [makeLeg("DE", "2024-11-20", "2024-12-10")];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(7);
  });

  it("leg starting inside window and ending after asOfDate counts only to asOfDate", () => {
    // Leg: May 28 to Jun 5 — but asOfDate is Jun 1
    // Only May 28-Jun 1 counted = 5 days
    const legs = [makeLeg("FR", "2025-05-28", "2025-06-05")];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(5);
  });
});

describe("Schengen edge cases: overlapping legs dedup", () => {
  it("two legs in different countries with same dates count as 1 set of days", () => {
    const legs = [
      makeLeg("DE", "2025-05-01", "2025-05-05"), // 5 days
      makeLeg("FR", "2025-05-01", "2025-05-05"), // same 5 days
    ];
    // Should be 5, not 10 (dedup by date)
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(5);
  });

  it("leg fully nested inside another leg has no extra days", () => {
    const legs = [
      makeLeg("DE", "2025-05-01", "2025-05-20"), // 20 days
      makeLeg("FR", "2025-05-05", "2025-05-10"), // fully within
    ];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(20);
  });

  it("three overlapping legs form a union span", () => {
    const legs = [
      makeLeg("DE", "2025-05-01", "2025-05-10"), // May 1-10
      makeLeg("FR", "2025-05-08", "2025-05-18"), // May 8-18
      makeLeg("ES", "2025-05-15", "2025-05-25"), // May 15-25
    ];
    // Union: May 1-25 = 25 days
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(25);
  });
});

describe("Schengen edge cases: single-day trips", () => {
  it("multiple single-day trips on different dates each count as 1", () => {
    const legs = [
      makeLeg("DE", "2025-05-01", "2025-05-01"),
      makeLeg("FR", "2025-05-05", "2025-05-05"),
      makeLeg("ES", "2025-05-10", "2025-05-10"),
    ];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(3);
  });

  it("two single-day trips on same date in different countries count as 1 day", () => {
    const legs = [
      makeLeg("DE", "2025-05-01", "2025-05-01"),
      makeLeg("FR", "2025-05-01", "2025-05-01"),
    ];
    const result = calculateSchengenDaysUsed(legs, new Date("2025-06-01T00:00:00Z"));
    expect(result).toBe(1);
  });
});

describe("Schengen edge cases: empty itinerary defaults", () => {
  it("calculateSchengenDaysUsed returns 0", () => {
    expect(calculateSchengenDaysUsed([], new Date("2025-06-01T00:00:00Z"))).toBe(0);
  });

  it("getSchengenRemainingDays returns 90", () => {
    expect(getSchengenRemainingDays([], new Date("2025-06-01T00:00:00Z"))).toBe(90);
  });

  it("isSchengenCompliant with empty legs and proposed leg is compliant", () => {
    const proposed = makeLeg("DE", "2025-06-01", "2025-06-10");
    const result = isSchengenCompliant([], proposed);
    expect(result.compliant).toBe(true);
    expect(result.daysUsed).toBe(10);
    expect(result.daysRemaining).toBe(80);
  });
});

describe("Schengen edge cases: past trips affecting future compliance", () => {
  it("leg 170 days ago still partly in window affects proposed leg", () => {
    // Stay: Jan 13 to Feb 11 2025 (30 days, all within 180-day window from Jun 1)
    // Then propose Jun 1-Jun 30 (30 more) → total 60 → compliant
    // But if old stay was 80 days (Jan 13 to Apr 2), propose 15 days → 80+15=95 → violation
    const legs = [makeLeg("DE", "2025-01-13", "2025-04-02")]; // 80 days
    const today = new Date("2025-06-01T00:00:00Z");
    const daysUsed = calculateSchengenDaysUsed(legs, today);
    expect(daysUsed).toBe(80);

    // Propose 15 more days → 80+15=95 → violation
    const proposed = makeLeg("FR", "2025-06-01", "2025-06-15");
    const result = isSchengenCompliant(legs, proposed);
    expect(result.compliant).toBe(false);
    expect(result.violationDate).toBeDefined();
  });
});
