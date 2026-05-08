import { db } from "@/lib/db";
import { notifications, type Notification } from "@vroom/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export class NotificationService {
  async send(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    channel?: string;
  }): Promise<Notification> {
    const result = (await (db as any)
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? {},
        channel: input.channel ?? "in_app",
      })
      .returning()) as Notification[];
    return result[0]!;
  }

  async getByUser(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const [items, countResult] = await Promise.all([
      (db as any)
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset) as Promise<Notification[]>,
      (db as any)
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.read, false)
          )
        ) as Promise<{ count: number }[]>,
    ]);

    return {
      notifications: items,
      unreadCount: Number(countResult[0]?.count ?? 0),
    };
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await (db as any)
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
  }

  async markAllRead(userId: string): Promise<void> {
    await (db as any)
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = (await (db as any)
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      )) as { count: number }[];
    return Number(result[0]?.count ?? 0);
  }
}

export const notificationService = new NotificationService();
