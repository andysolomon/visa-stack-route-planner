import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { visaRules, type VisaRuleRow } from "@/lib/db/schema";

export async function getVisaRule(
  countryCode: string,
  nationality: string
): Promise<VisaRuleRow | null> {
  const rows = await db
    .select()
    .from(visaRules)
    .where(
      and(
        eq(visaRules.countryCode, countryCode.toUpperCase()),
        eq(visaRules.passportNationality, nationality.toUpperCase())
      )
    )
    .limit(1);

  return rows[0] ?? null;
}
