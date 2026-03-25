import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TripLeg } from "@/types/domain";

// Mock the DB-dependent lookup function
vi.mock("@/lib/visa/lookup", () => ({
  getVisaRule: vi.fn(),
}));

import { getVisaRule } from "@/lib/visa/lookup";
const mockGetVisaRule = vi.mocked(getVisaRule);

function makeLeg(
  countryCode: string,
  arrival: string,
  departure: string
): TripLeg {
  return { id: "test", countryCode, arrivalDate: arrival, departureDate: departure };
}

describe("validateItinerary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns compliant for empty itinerary", async () => {
    const { validateItinerary } = await import("@/lib/visa/compliance");
    const result = await validateItinerary([], "US");
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("returns compliant for Schengen legs under 90 days", async () => {
    const { validateItinerary } = await import("@/lib/visa/compliance");
    const legs = [makeLeg("DE", "2025-05-01", "2025-05-20")]; // 20 days
    const result = await validateItinerary(legs, "US");
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("detects Schengen overstay", async () => {
    const { validateItinerary } = await import("@/lib/visa/compliance");
    const legs = [
      makeLeg("DE", "2025-01-01", "2025-03-31"), // 90 days
      makeLeg("FR", "2025-04-01", "2025-04-02"), // 2 more = 92
    ];
    const result = await validateItinerary(legs, "US");
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some((i) => i.includes("Schengen"))).toBe(true);
  });

  it("returns compliant for non-Schengen within limit", async () => {
    mockGetVisaRule.mockResolvedValue({
      id: "1",
      countryCode: "TH",
      passportNationality: "US",
      stayLimitDays: 60,
      windowDays: null,
      visaType: "visa-exempt",
      requiresVisa: false,
      notes: null,
      updatedAt: new Date(),
    });

    const { validateItinerary } = await import("@/lib/visa/compliance");
    const legs = [makeLeg("TH", "2025-05-01", "2025-05-20")]; // 20 days, limit 60
    const result = await validateItinerary(legs, "US");
    expect(result.isCompliant).toBe(true);
  });

  it("detects non-Schengen overstay", async () => {
    mockGetVisaRule.mockResolvedValue({
      id: "1",
      countryCode: "TH",
      passportNationality: "US",
      stayLimitDays: 30,
      windowDays: null,
      visaType: "visa-exempt",
      requiresVisa: false,
      notes: null,
      updatedAt: new Date(),
    });

    const { validateItinerary } = await import("@/lib/visa/compliance");
    const legs = [makeLeg("TH", "2025-05-01", "2025-06-15")]; // 46 days, limit 30
    const result = await validateItinerary(legs, "US");
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some((i) => i.includes("TH") && i.includes("46"))).toBe(true);
  });

  it("passes unlimited stay (-1 stayLimitDays)", async () => {
    mockGetVisaRule.mockResolvedValue({
      id: "1",
      countryCode: "TH",
      passportNationality: "DE",
      stayLimitDays: -1,
      windowDays: null,
      visaType: "unlimited",
      requiresVisa: false,
      notes: null,
      updatedAt: new Date(),
    });

    const { validateItinerary } = await import("@/lib/visa/compliance");
    const legs = [makeLeg("TH", "2025-01-01", "2025-12-31")]; // 365 days, unlimited
    const result = await validateItinerary(legs, "DE");
    expect(result.isCompliant).toBe(true);
  });

  it("adds informational issue for missing rule but stays compliant", async () => {
    mockGetVisaRule.mockResolvedValue(null);

    const { validateItinerary } = await import("@/lib/visa/compliance");
    const legs = [makeLeg("ZZ", "2025-05-01", "2025-05-10")]; // unknown country
    const result = await validateItinerary(legs, "US");
    expect(result.isCompliant).toBe(true);
    expect(result.issues.some((i) => i.includes("No visa rules found for ZZ"))).toBe(true);
  });

  it("handles mixed Schengen + non-Schengen with both violations", async () => {
    mockGetVisaRule.mockResolvedValue({
      id: "1",
      countryCode: "TH",
      passportNationality: "US",
      stayLimitDays: 30,
      windowDays: null,
      visaType: "visa-exempt",
      requiresVisa: false,
      notes: null,
      updatedAt: new Date(),
    });

    const { validateItinerary } = await import("@/lib/visa/compliance");
    const legs = [
      makeLeg("DE", "2025-01-01", "2025-03-31"), // 90 Schengen
      makeLeg("FR", "2025-04-01", "2025-04-02"), // 2 more Schengen = 92
      makeLeg("TH", "2025-05-01", "2025-06-15"), // 46 Thailand, limit 30
    ];
    const result = await validateItinerary(legs, "US");
    expect(result.isCompliant).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
    expect(result.issues.some((i) => i.includes("Schengen"))).toBe(true);
    expect(result.issues.some((i) => i.includes("TH"))).toBe(true);
  });

  it("handles multiple non-Schengen countries with one violating", async () => {
    mockGetVisaRule.mockImplementation(async (country) => {
      if (country === "TH" || country === "th")
        return {
          id: "1", countryCode: "TH", passportNationality: "US",
          stayLimitDays: 30, windowDays: null, visaType: "visa-exempt",
          requiresVisa: false, notes: null, updatedAt: new Date(),
        };
      if (country === "JP" || country === "jp")
        return {
          id: "2", countryCode: "JP", passportNationality: "US",
          stayLimitDays: 90, windowDays: null, visaType: "visa-free",
          requiresVisa: false, notes: null, updatedAt: new Date(),
        };
      return null;
    });

    const { validateItinerary } = await import("@/lib/visa/compliance");
    const legs = [
      makeLeg("TH", "2025-05-01", "2025-06-15"), // 46 days, limit 30 → violation
      makeLeg("JP", "2025-07-01", "2025-07-20"), // 20 days, limit 90 → ok
    ];
    const result = await validateItinerary(legs, "US");
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some((i) => i.includes("TH"))).toBe(true);
    expect(result.issues.some((i) => i.includes("JP"))).toBe(false);
  });
});
