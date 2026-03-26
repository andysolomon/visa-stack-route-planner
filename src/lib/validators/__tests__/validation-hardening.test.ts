import { describe, expect, it } from "vitest";
import { isValidCountryCode } from "@/lib/validators/countries";
import { warnDistantPast, warnPassportExpiry, checkOverlap } from "@/lib/validators/warnings";

describe("isValidCountryCode", () => {
  it("returns true for supported countries", () => {
    expect(isValidCountryCode("DE")).toBe(true);
    expect(isValidCountryCode("TH")).toBe(true);
    expect(isValidCountryCode("JP")).toBe(true);
  });

  it("returns false for unsupported codes", () => {
    expect(isValidCountryCode("XX")).toBe(false);
    expect(isValidCountryCode("ZZ")).toBe(false);
  });

  it("handles case insensitivity", () => {
    expect(isValidCountryCode("de")).toBe(true);
    expect(isValidCountryCode("De")).toBe(true);
  });
});

describe("warnDistantPast", () => {
  it("warns for dates >2 years ago", () => {
    expect(warnDistantPast("2020-01-01")).not.toBeNull();
  });

  it("returns null for recent dates", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(warnDistantPast(today)).toBeNull();
  });
});

describe("warnPassportExpiry", () => {
  it("warns for passport expiring within 6 months", () => {
    const threeMonths = new Date(Date.now() + 90 * 86_400_000).toISOString().split("T")[0];
    expect(warnPassportExpiry(threeMonths)).toContain("expires within 6 months");
  });

  it("warns for expired passport", () => {
    expect(warnPassportExpiry("2020-01-01")).toContain("expired");
  });

  it("returns null for passport valid >6 months", () => {
    const nextYear = new Date(Date.now() + 365 * 86_400_000).toISOString().split("T")[0];
    expect(warnPassportExpiry(nextYear)).toBeNull();
  });

  it("returns null for null expiry", () => {
    expect(warnPassportExpiry(null)).toBeNull();
  });
});

describe("checkOverlap", () => {
  it("detects overlapping legs", () => {
    const existing = [{ arrivalDate: "2025-05-01", departureDate: "2025-05-15" }];
    const newLeg = { arrivalDate: "2025-05-10", departureDate: "2025-05-20" };
    expect(checkOverlap(existing, newLeg)).toContain("overlap");
  });

  it("allows non-overlapping legs", () => {
    const existing = [{ arrivalDate: "2025-05-01", departureDate: "2025-05-15" }];
    const newLeg = { arrivalDate: "2025-05-16", departureDate: "2025-05-20" };
    expect(checkOverlap(existing, newLeg)).toBeNull();
  });

  it("detects adjacent-day overlap (same departure/arrival)", () => {
    const existing = [{ arrivalDate: "2025-05-01", departureDate: "2025-05-10" }];
    const newLeg = { arrivalDate: "2025-05-10", departureDate: "2025-05-15" };
    expect(checkOverlap(existing, newLeg)).toContain("overlap");
  });

  it("returns null for empty existing legs", () => {
    expect(checkOverlap([], { arrivalDate: "2025-05-01", departureDate: "2025-05-10" })).toBeNull();
  });
});
