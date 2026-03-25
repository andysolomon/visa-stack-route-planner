import { describe, expect, it } from "vitest";
import { getTimelineRange, getBarPosition, getCountryColor } from "@/lib/timeline/utils";

describe("getTimelineRange", () => {
  it("returns null for empty legs", () => {
    expect(getTimelineRange([])).toBeNull();
  });

  it("returns range with padding for single leg", () => {
    const range = getTimelineRange([
      { arrivalDate: "2025-05-10", departureDate: "2025-05-20" },
    ]);
    expect(range).not.toBeNull();
    expect(range!.totalDays).toBeGreaterThan(10); // has 7-day padding each side
  });

  it("spans from earliest arrival to latest departure", () => {
    const range = getTimelineRange([
      { arrivalDate: "2025-05-01", departureDate: "2025-05-10" },
      { arrivalDate: "2025-06-01", departureDate: "2025-06-15" },
    ]);
    expect(range).not.toBeNull();
    // From Apr 24 (May 1 - 7) to Jun 22 (Jun 15 + 7) = ~59 days
    expect(range!.totalDays).toBeGreaterThanOrEqual(50);
  });
});

describe("getBarPosition", () => {
  const range = getTimelineRange([
    { arrivalDate: "2025-05-01", departureDate: "2025-05-31" },
  ])!;

  it("returns percentage-based left and width", () => {
    const pos = getBarPosition("2025-05-01", "2025-05-31", range);
    expect(pos.left).toMatch(/%$/);
    expect(pos.width).toMatch(/%$/);
  });

  it("width is at least 1%", () => {
    const pos = getBarPosition("2025-05-15", "2025-05-15", range);
    const width = parseFloat(pos.width);
    expect(width).toBeGreaterThanOrEqual(1);
  });
});

describe("getCountryColor", () => {
  it("returns green for compliant", () => {
    expect(getCountryColor("compliant")).toContain("green");
  });

  it("returns red for violation", () => {
    expect(getCountryColor("violation")).toContain("red");
  });

  it("returns yellow for warning", () => {
    expect(getCountryColor("warning")).toContain("yellow");
  });

  it("returns blue fallback for unknown", () => {
    expect(getCountryColor("unknown")).toContain("blue");
  });

  it("returns green for undefined (defaults to compliant)", () => {
    expect(getCountryColor(undefined)).toContain("green");
  });
});
