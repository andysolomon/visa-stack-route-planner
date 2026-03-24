import { describe, expect, it } from "vitest";
import seedData from "@/lib/data/visa-rules-seed.json";

const SCHENGEN_CODES = [
  "AT", "BE", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IS", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO",
  "PL", "PT", "SK", "SI", "ES", "SE", "CH",
];

const NOMAD_HUB_CODES = ["TH", "ID", "CO", "MX", "GE", "TR", "AE", "JP", "VN"];

const ALL_COUNTRY_CODES = [...new Set([...SCHENGEN_CODES, ...NOMAD_HUB_CODES])];

const NATIONALITY_CODES = ["US", "GB", "AU", "CA", "DE", "FR", "NL", "IT", "ES"];

const EU_NATIONALITIES = ["DE", "FR", "NL", "IT", "ES"];

describe("visa-rules-seed.json", () => {
  it("has approximately 324 entries", () => {
    expect(seedData.length).toBe(324);
  });

  it("covers all 36 unique countries", () => {
    const countries = new Set(seedData.map((r) => r.countryCode));
    for (const code of ALL_COUNTRY_CODES) {
      expect(countries.has(code), `Missing country: ${code}`).toBe(true);
    }
    expect(countries.size).toBe(36);
  });

  it("covers all 9 nationalities", () => {
    const nationalities = new Set(seedData.map((r) => r.passportNationality));
    for (const code of NATIONALITY_CODES) {
      expect(nationalities.has(code), `Missing nationality: ${code}`).toBe(true);
    }
    expect(nationalities.size).toBe(9);
  });

  it("has no duplicate (countryCode, passportNationality) pairs", () => {
    const keys = seedData.map((r) => `${r.countryCode}:${r.passportNationality}`);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("all entries have required fields", () => {
    for (const rule of seedData) {
      expect(rule.countryCode).toBeDefined();
      expect(rule.passportNationality).toBeDefined();
      expect(typeof rule.stayLimitDays).toBe("number");
      expect(rule.visaType).toBeDefined();
      expect(typeof rule.requiresVisa).toBe("boolean");
    }
  });

  it("stayLimitDays is a positive integer or -1 (unlimited)", () => {
    for (const rule of seedData) {
      expect(
        rule.stayLimitDays === -1 || rule.stayLimitDays > 0,
        `Invalid stayLimitDays ${rule.stayLimitDays} for ${rule.countryCode}:${rule.passportNationality}`
      ).toBe(true);
    }
  });

  it("Schengen + EU passports have unlimited stay", () => {
    for (const country of SCHENGEN_CODES) {
      for (const nationality of EU_NATIONALITIES) {
        const rule = seedData.find(
          (r) => r.countryCode === country && r.passportNationality === nationality
        );
        expect(rule, `Missing rule for ${country}:${nationality}`).toBeDefined();
        expect(
          rule!.stayLimitDays,
          `${country}:${nationality} should be unlimited (-1)`
        ).toBe(-1);
        expect(rule!.visaType).toBe("eu-freedom-of-movement");
      }
    }
  });

  it("Schengen + non-EU passports have 90/180 rules", () => {
    const nonEU = ["US", "GB", "AU", "CA"];
    for (const country of SCHENGEN_CODES) {
      for (const nationality of nonEU) {
        const rule = seedData.find(
          (r) => r.countryCode === country && r.passportNationality === nationality
        );
        expect(rule, `Missing rule for ${country}:${nationality}`).toBeDefined();
        expect(rule!.stayLimitDays).toBe(90);
        expect(rule!.windowDays).toBe(180);
      }
    }
  });
});
