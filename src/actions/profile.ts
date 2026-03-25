"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod/v4";

import { db } from "@/lib/db";
import { users, travelerProfiles, passports } from "@/lib/db/schema";

const profileSchema = z.object({
  homeCountry: z.string().length(2),
  passports: z
    .array(
      z.object({
        nationality: z.string().length(2),
      })
    )
    .min(1, "At least one passport is required"),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export async function createProfile(input: ProfileInput) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  const parsed = profileSchema.parse(input);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  await db.transaction(async (tx) => {
    const [profile] = await tx
      .insert(travelerProfiles)
      .values({
        userId: user.id,
        homeCountry: parsed.homeCountry,
      })
      .returning();

    await tx.insert(passports).values(
      parsed.passports.map((p) => ({
        profileId: profile.id,
        nationality: p.nationality,
      }))
    );
  });

  redirect("/dashboard");
}
