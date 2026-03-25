import { describe, expect, it } from "vitest";
import countries from "@/lib/data/countries.json";
import countryCoords from "@/lib/data/country-coords.json";

const coords = countryCoords as unknown as Record<string, [number, number]>;

describe("country-coords.json", () => {
  it("has coordinates for every country in countries.json", () => {
    for (const country of countries) {
      expect(
        coords[country.code],
        `Missing coordinates for ${country.code} (${country.name})`
      ).toBeDefined();
    }
  });

  it("all coordinates are [lng, lat] arrays with 2 numbers", () => {
    for (const [code, coord] of Object.entries(coords)) {
      expect(Array.isArray(coord), `${code} should be array`).toBe(true);
      expect(coord).toHaveLength(2);
      expect(typeof coord[0]).toBe("number");
      expect(typeof coord[1]).toBe("number");
    }
  });

  it("longitudes are in valid range [-180, 180]", () => {
    for (const [code, [lng]] of Object.entries(coords)) {
      expect(lng >= -180 && lng <= 180, `${code} lng ${lng} out of range`).toBe(true);
    }
  });

  it("latitudes are in valid range [-90, 90]", () => {
    for (const [code, [, lat]] of Object.entries(coords)) {
      expect(lat >= -90 && lat <= 90, `${code} lat ${lat} out of range`).toBe(true);
    }
  });
});
