import { describe, expect, it } from "vitest";
import { travelerProfiles, passports } from "@/lib/db/schema";
import type {
  TravelerProfileRow,
  NewTravelerProfile,
  PassportRow,
  NewPassport,
} from "@/lib/db/schema";

describe("traveler_profiles table schema", () => {
  it("has the expected column names", () => {
    const columns = Object.keys(travelerProfiles);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("homeCountry");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });

  it("exports TravelerProfileRow type with expected fields", () => {
    const profile: TravelerProfileRow = {
      id: "00000000-0000-0000-0000-000000000000",
      userId: "00000000-0000-0000-0000-000000000001",
      homeCountry: "US",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(profile.userId).toBeDefined();
  });

  it("allows NewTravelerProfile with only required fields", () => {
    const newProfile: NewTravelerProfile = {
      userId: "00000000-0000-0000-0000-000000000001",
      homeCountry: "US",
    };
    expect(newProfile.id).toBeUndefined();
  });
});

describe("passports table schema", () => {
  it("has the expected column names", () => {
    const columns = Object.keys(passports);
    expect(columns).toContain("id");
    expect(columns).toContain("profileId");
    expect(columns).toContain("nationality");
    expect(columns).toContain("expiryDate");
    expect(columns).toContain("createdAt");
  });

  it("allows expiryDate to be null (optional)", () => {
    const passport: NewPassport = {
      profileId: "00000000-0000-0000-0000-000000000001",
      nationality: "US",
    };
    expect(passport.expiryDate).toBeUndefined();
  });

  it("exports PassportRow type with expected fields", () => {
    const passport: PassportRow = {
      id: "00000000-0000-0000-0000-000000000000",
      profileId: "00000000-0000-0000-0000-000000000001",
      nationality: "US",
      expiryDate: null,
      createdAt: new Date(),
    };
    expect(passport.nationality).toBe("US");
  });
});
