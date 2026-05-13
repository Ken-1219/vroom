import { db } from "@/lib/db";
import { outboxEvents } from "@vroom/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { eventBus, type EventMap, type EventName } from "@vroom/events";
import { registerEventHandlers } from "@/lib/event-handlers";
import { logger } from "@/lib/logger";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;
const BASE_BACKOFF_SECONDS = 30;

/**
 * Processes pending outbox events by dispatching them through the in-process eventBus.
 * Returns the count of successfully processed events.
 */
export async function processOutbox(): Promise<{ processed: number; failed: number }> {
  // Ensure event handlers are registered before dispatching
  registerEventHandlers();

  const now = new Date();

  const pending = await db
    .select()
    .from(outboxEvents)
    .where(
      and(
        eq(outboxEvents.status, "pending"),
        lte(outboxEvents.processAfter, now)
      )
    )
    .limit(BATCH_SIZE) as (typeof outboxEvents.$inferSelect)[];

  let processed = 0;
  let failed = 0;

  for (const event of pending) {
    try {
      // Dispatch through the in-process event bus (calls registered handlers)
      eventBus.publish(
        event.eventType as EventName,
        event.payload as EventMap[EventName]
      );

      // Mark as processed
      await db
        .update(outboxEvents)
        .set({
          status: "processed",
          processedAt: new Date(),
          attempts: event.attempts + 1,
        })
        .where(eq(outboxEvents.id, event.id));

      processed++;
    } catch (error) {
      const attempts = event.attempts + 1;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (attempts >= MAX_ATTEMPTS) {
        // Max attempts reached — mark as failed permanently
        await db
          .update(outboxEvents)
          .set({
            status: "failed",
            attempts,
            lastError: errorMessage,
          })
          .where(eq(outboxEvents.id, event.id));
      } else {
        // Exponential backoff: 2^attempts * 30 seconds
        const backoffSeconds = Math.pow(2, attempts) * BASE_BACKOFF_SECONDS;
        const processAfter = new Date(Date.now() + backoffSeconds * 1000);

        await db
          .update(outboxEvents)
          .set({
            attempts,
            lastError: errorMessage,
            processAfter,
          })
          .where(eq(outboxEvents.id, event.id));
      }

      failed++;
      logger.error("Outbox event processing failed", {
        eventId: event.id,
        eventType: event.eventType,
        attempts,
        error: errorMessage,
      });
    }
  }

  return { processed, failed };
}
