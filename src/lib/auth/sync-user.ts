import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

export async function syncUser(
  clerkId: string,
  email: string
): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ clerkId, email })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email, updatedAt: new Date() },
    })
    .returning();

  return user;
}
