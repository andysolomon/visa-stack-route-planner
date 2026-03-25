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

export async function updateHomeCountry(homeCountry: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const parsed = z.string().length(2).parse(homeCountry);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) throw new Error("User not found");

  await db
    .update(travelerProfiles)
    .set({ homeCountry: parsed })
    .where(eq(travelerProfiles.userId, user.id));
}

export async function addPassport(nationality: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const parsed = z.string().length(2).parse(nationality);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) throw new Error("User not found");

  const [profile] = await db
    .select()
    .from(travelerProfiles)
    .where(eq(travelerProfiles.userId, user.id))
    .limit(1);
  if (!profile) throw new Error("Profile not found");

  await db.insert(passports).values({
    profileId: profile.id,
    nationality: parsed,
  });
}

export async function removePassport(passportId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) throw new Error("User not found");

  const [profile] = await db
    .select()
    .from(travelerProfiles)
    .where(eq(travelerProfiles.userId, user.id))
    .limit(1);
  if (!profile) throw new Error("Profile not found");

  // Ensure minimum 1 passport
  const allPassports = await db
    .select()
    .from(passports)
    .where(eq(passports.profileId, profile.id));

  if (allPassports.length <= 1) {
    throw new Error("Cannot remove last passport");
  }

  await db.delete(passports).where(eq(passports.id, passportId));
}
