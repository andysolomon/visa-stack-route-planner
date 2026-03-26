import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  itineraries,
  tripLegs,
  notifications,
  travelerProfiles,
  passports,
} from "@/lib/db/schema";
import { getVisaRule } from "@/lib/visa/lookup";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 86_400_000);
  const todayStr = now.toISOString().split("T")[0];

  // Find all active itineraries with upcoming legs
  const allItineraries = await db
    .select()
    .from(itineraries)
    .where(eq(itineraries.status, "active"));

  let processed = 0;
  let created = 0;

  for (const itin of allItineraries) {
    const legs = await db
      .select()
      .from(tripLegs)
      .where(eq(tripLegs.itineraryId, itin.id))
      .orderBy(asc(tripLegs.sortOrder));

    // Get user's passport
    const [profile] = await db
      .select()
      .from(travelerProfiles)
      .where(eq(travelerProfiles.userId, itin.userId))
      .limit(1);

    let nationality = "US";
    if (profile) {
      const [passport] = await db
        .select()
        .from(passports)
        .where(eq(passports.profileId, profile.id))
        .limit(1);
      if (passport) nationality = passport.nationality;
    }

    for (const leg of legs) {
      const arrival = new Date(leg.arrivalDate + "T00:00:00Z");
      const daysUntil = Math.floor(
        (arrival.getTime() - now.getTime()) / 86_400_000
      );

      if (daysUntil < 0 || daysUntil > 14) continue;

      const rule = await getVisaRule(leg.countryCode, nationality);
      if (!rule || rule.stayLimitDays === -1) continue;

      let reminderType: string | null = null;
      if (daysUntil <= 3) reminderType = "deadline_3d";
      else if (daysUntil <= 7) reminderType = "deadline_7d";
      else if (daysUntil <= 14) reminderType = "deadline_14d";

      if (!reminderType) continue;

      const message = `${daysUntil} days until your ${leg.countryCode} trip — ${rule.stayLimitDays}-day visa limit`;

      // Dedup: check if same type+message exists today
      const existing = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, itin.userId),
            eq(notifications.type, reminderType),
            eq(notifications.message, message)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(notifications).values({
          userId: itin.userId,
          type: reminderType,
          message,
        });
        created++;
      }
    }
    processed++;
  }

  return Response.json({ processed, notifications: created });
}
