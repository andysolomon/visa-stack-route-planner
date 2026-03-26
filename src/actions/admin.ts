"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  users,
  visaRules,
  visaRuleChanges,
  notifications,
  tripLegs,
  itineraries,
} from "@/lib/db/schema";

interface RuleUpdate {
  ruleId: string;
  updates: Partial<{
    stayLimitDays: number;
    windowDays: number | null;
    visaType: string;
    requiresVisa: boolean;
    notes: string | null;
  }>;
}

export async function updateVisaRule(input: RuleUpdate) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) throw new Error("User not found");

  // Fetch current rule
  const [rule] = await db
    .select()
    .from(visaRules)
    .where(eq(visaRules.id, input.ruleId))
    .limit(1);
  if (!rule) throw new Error("Rule not found");

  // Log field-level changes
  const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];

  for (const [field, newValue] of Object.entries(input.updates)) {
    if (newValue === undefined) continue;
    const oldValue = rule[field as keyof typeof rule];
    if (String(oldValue) !== String(newValue)) {
      changes.push({
        field,
        oldValue: String(oldValue ?? ""),
        newValue: String(newValue ?? ""),
      });
    }
  }

  if (changes.length === 0) return rule;

  await db.transaction(async (tx) => {
    // Insert change records
    await tx.insert(visaRuleChanges).values(
      changes.map((c) => ({
        ruleId: input.ruleId,
        field: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
      }))
    );

    // Apply update
    await tx
      .update(visaRules)
      .set(input.updates)
      .where(eq(visaRules.id, input.ruleId));

    // Notify affected users
    const affectedLegs = await tx
      .select({ userId: itineraries.userId })
      .from(tripLegs)
      .innerJoin(itineraries, eq(tripLegs.itineraryId, itineraries.id))
      .where(eq(tripLegs.countryCode, rule.countryCode));

    const uniqueUserIds = [...new Set(affectedLegs.map((l) => l.userId))];

    if (uniqueUserIds.length > 0) {
      const changeDesc = changes
        .map((c) => `${c.field}: ${c.oldValue} → ${c.newValue}`)
        .join(", ");

      await tx.insert(notifications).values(
        uniqueUserIds.map((userId) => ({
          userId,
          type: "rule_change",
          message: `Visa rules for ${rule.countryCode} updated: ${changeDesc}`,
        }))
      );
    }
  });

  // Return updated rule
  const [updated] = await db
    .select()
    .from(visaRules)
    .where(eq(visaRules.id, input.ruleId))
    .limit(1);

  return updated;
}

export async function getVisaRules() {
  return db.select().from(visaRules).orderBy(visaRules.countryCode);
}

export async function getVisaRuleChanges(limit = 50) {
  return db
    .select()
    .from(visaRuleChanges)
    .orderBy(visaRuleChanges.changedAt)
    .limit(limit);
}
