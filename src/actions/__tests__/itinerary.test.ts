import { describe, expect, it } from "vitest";
import {
  createItinerarySchema,
  updateItinerarySchema,
  addLegSchema,
  updateLegSchema,
  removeLegSchema,
  reorderLegsSchema,
} from "@/lib/validators/itinerary";

describe("createItinerarySchema", () => {
  it("accepts valid name", () => {
    const result = createItinerarySchema.safeParse({ name: "Southeast Asia Trip" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createItinerarySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    const result = createItinerarySchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("updateItinerarySchema", () => {
  it("accepts valid update with name", () => {
    const result = updateItinerarySchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid status values", () => {
    for (const status of ["draft", "active", "archived"]) {
      const result = updateItinerarySchema.safeParse({
        id: "00000000-0000-0000-0000-000000000001",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = updateItinerarySchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
      status: "completed",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid uuid", () => {
    const result = updateItinerarySchema.safeParse({
      id: "not-a-uuid",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });
});

describe("addLegSchema", () => {
  const validLeg = {
    itineraryId: "00000000-0000-0000-0000-000000000001",
    countryCode: "TH",
    arrivalDate: "2025-05-01",
    departureDate: "2025-05-15",
  };

  it("accepts valid leg", () => {
    const result = addLegSchema.safeParse(validLeg);
    expect(result.success).toBe(true);
  });

  it("accepts leg with optional fields", () => {
    const result = addLegSchema.safeParse({
      ...validLeg,
      city: "Bangkok",
      lat: 13.7563,
      lng: 100.5018,
    });
    expect(result.success).toBe(true);
  });

  it("rejects departure before arrival", () => {
    const result = addLegSchema.safeParse({
      ...validLeg,
      arrivalDate: "2025-05-15",
      departureDate: "2025-05-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts same-day trip (arrival = departure)", () => {
    const result = addLegSchema.safeParse({
      ...validLeg,
      arrivalDate: "2025-05-01",
      departureDate: "2025-05-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid country code", () => {
    const result = addLegSchema.safeParse({
      ...validLeg,
      countryCode: "THAI",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = addLegSchema.safeParse({
      ...validLeg,
      arrivalDate: "05-01-2025",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateLegSchema", () => {
  it("accepts update with only id", () => {
    const result = updateLegSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial updates", () => {
    const result = updateLegSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
      countryCode: "JP",
      city: "Tokyo",
    });
    expect(result.success).toBe(true);
  });
});

describe("removeLegSchema", () => {
  it("accepts valid uuid", () => {
    const result = removeLegSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid uuid", () => {
    const result = removeLegSchema.safeParse({ id: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("reorderLegsSchema", () => {
  it("accepts valid reorder", () => {
    const result = reorderLegsSchema.safeParse({
      itineraryId: "00000000-0000-0000-0000-000000000001",
      legIds: [
        "00000000-0000-0000-0000-000000000002",
        "00000000-0000-0000-0000-000000000003",
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty legIds", () => {
    const result = reorderLegsSchema.safeParse({
      itineraryId: "00000000-0000-0000-0000-000000000001",
      legIds: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("subscription gate stub", () => {
  it("returns false for all users", async () => {
    const { isSubscribed } = await import("@/lib/subscription/gate");
    expect(await isSubscribed("any-user-id")).toBe(false);
  });
});
