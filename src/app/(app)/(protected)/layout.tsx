import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { users, travelerProfiles } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    redirect("/sign-in");
  }

  const [profile] = await db
    .select()
    .from(travelerProfiles)
    .where(eq(travelerProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
