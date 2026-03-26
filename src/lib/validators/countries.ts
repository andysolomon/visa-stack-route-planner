import countriesData from "@/lib/data/countries.json";

const validCodes = new Set(countriesData.map((c) => c.code));

export function isValidCountryCode(code: string): boolean {
  return validCodes.has(code.toUpperCase());
}
