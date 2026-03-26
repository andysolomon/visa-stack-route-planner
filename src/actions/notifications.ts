"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { users, notifications } from "@/lib/db/schema";

async function getUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) throw new Error("User not found");
  return user;
}

export async function getUnreadCount(): Promise<number> {
  const user = await getUser();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, user.id), isNull(notifications.readAt))
    );
  return Number(result[0]?.count ?? 0);
}

export async function getNotifications(limit = 50) {
  const user = await getUser();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markAsRead(id: string) {
  const user = await getUser();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.id, id), eq(notifications.userId, user.id))
    );
}

export async function markAllAsRead() {
  const user = await getUser();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, user.id), isNull(notifications.readAt))
    );
}
