import { describe, expect, it } from "vitest";
import { itineraries, tripLegs } from "@/lib/db/schema";
import type {
  ItineraryRow,
  NewItinerary,
  TripLegRow,
  NewTripLeg,
} from "@/lib/db/schema";

describe("itineraries table schema", () => {
  it("has the expected column names", () => {
    const columns = Object.keys(itineraries);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("name");
    expect(columns).toContain("status");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });

  it("exports ItineraryRow type with expected fields", () => {
    const row: ItineraryRow = {
      id: "00000000-0000-0000-0000-000000000000",
      userId: "00000000-0000-0000-0000-000000000001",
      name: "Test Trip",
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(row.status).toBe("draft");
  });

  it("allows NewItinerary with only required fields", () => {
    const newItinerary: NewItinerary = {
      userId: "00000000-0000-0000-0000-000000000001",
      name: "Southeast Asia",
    };
    expect(newItinerary.id).toBeUndefined();
    expect(newItinerary.status).toBeUndefined();
  });
});

describe("trip_legs table schema", () => {
  it("has the expected column names", () => {
    const columns = Object.keys(tripLegs);
    expect(columns).toContain("id");
    expect(columns).toContain("itineraryId");
    expect(columns).toContain("countryCode");
    expect(columns).toContain("city");
    expect(columns).toContain("arrivalDate");
    expect(columns).toContain("departureDate");
    expect(columns).toContain("sortOrder");
    expect(columns).toContain("lat");
    expect(columns).toContain("lng");
    expect(columns).toContain("createdAt");
  });

  it("allows nullable city, lat, lng", () => {
    const leg: NewTripLeg = {
      itineraryId: "00000000-0000-0000-0000-000000000001",
      countryCode: "TH",
      arrivalDate: "2025-03-01",
      departureDate: "2025-03-15",
      sortOrder: 0,
    };
    expect(leg.city).toBeUndefined();
    expect(leg.lat).toBeUndefined();
    expect(leg.lng).toBeUndefined();
  });

  it("exports TripLegRow type with all fields", () => {
    const row: TripLegRow = {
      id: "00000000-0000-0000-0000-000000000000",
      itineraryId: "00000000-0000-0000-0000-000000000001",
      countryCode: "TH",
      city: "Bangkok",
      arrivalDate: "2025-03-01",
      departureDate: "2025-03-15",
      sortOrder: 0,
      lat: 13.7563,
      lng: 100.5018,
      createdAt: new Date(),
    };
    expect(row.countryCode).toBe("TH");
  });
});
