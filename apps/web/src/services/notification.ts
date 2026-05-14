import { db } from "@/lib/db";
import { notifications, users, type Notification } from "@vroom/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export class NotificationService {
  async send(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    channel?: "in_app" | "email" | "push" | "sms";
    emailPayload?: { subject: string; html: string; text?: string };
  }): Promise<Notification> {
    const channel = input.channel ?? "in_app";

    const result = (await db
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? {},
        channel,
      })
      .returning()) as Notification[];

    if (channel === "email" && input.emailPayload) {
      try {
        const userRows = (await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1)) as { email: string | null }[];

        const userEmail = userRows[0]?.email;
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: input.emailPayload.subject,
            html: input.emailPayload.html,
            text: input.emailPayload.text,
          });
        } else {
          logger.warn("No email address found for user — skipping email delivery", {
            userId: input.userId,
            type: input.type,
          });
        }
      } catch (err) {
        logger.error("Failed to send email for notification", {
          userId: input.userId,
          type: input.type,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return result[0]!;
  }

  async getByUser(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset) as Promise<Notification[]>,
      db
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
    await db
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
    await db
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
    const result = (await db
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
