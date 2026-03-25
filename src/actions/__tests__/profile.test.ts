import { describe, expect, it } from "vitest";
import { z } from "zod/v4";

const profileSchema = z.object({
  homeCountry: z.string().length(2),
  passports: z
    .array(z.object({ nationality: z.string().length(2) }))
    .min(1, "At least one passport is required"),
});

describe("profile validation schema", () => {
  it("accepts valid input", () => {
    const result = profileSchema.safeParse({
      homeCountry: "US",
      passports: [{ nationality: "US" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts multiple passports", () => {
    const result = profileSchema.safeParse({
      homeCountry: "DE",
      passports: [{ nationality: "DE" }, { nationality: "US" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid country code (too long)", () => {
    const result = profileSchema.safeParse({
      homeCountry: "USA",
      passports: [{ nationality: "US" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid country code (too short)", () => {
    const result = profileSchema.safeParse({
      homeCountry: "U",
      passports: [{ nationality: "US" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty passports array", () => {
    const result = profileSchema.safeParse({
      homeCountry: "US",
      passports: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid passport nationality", () => {
    const result = profileSchema.safeParse({
      homeCountry: "US",
      passports: [{ nationality: "LONG" }],
    });
    expect(result.success).toBe(false);
  });
});
