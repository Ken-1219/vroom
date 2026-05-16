import { after } from "next/server";
import { db } from "@/lib/db";
import { outboxEvents } from "@vroom/db/schema";
import { eq } from "drizzle-orm";
import { eventBus, type EventMap, type EventName } from "@vroom/events";
import { registerEventHandlers } from "@/lib/event-handlers";
import { logger } from "@/lib/logger";

const MAX_INLINE_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function emitEvent<E extends EventName>(
  eventType: E,
  payload: EventMap[E]
): Promise<void> {
  const rows = (await db
    .insert(outboxEvents)
    .values({ eventType, payload: payload as Record<string, unknown> })
    .returning({ id: outboxEvents.id })) as { id: string }[];

  const eventId = rows[0]!.id;

  after(async () => {
    registerEventHandlers();

    for (let attempt = 1; attempt <= MAX_INLINE_RETRIES; attempt++) {
      try {
        await eventBus.publish(eventType, payload);
        await db
          .update(outboxEvents)
          .set({ status: "processed", processedAt: new Date(), attempts: attempt })
          .where(eq(outboxEvents.id, eventId));
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error("Inline event processing failed", {
          eventId,
          eventType,
          attempt,
          error: message,
        });

        if (attempt < MAX_INLINE_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        } else {
          await db
            .update(outboxEvents)
            .set({ attempts: attempt, lastError: message })
            .where(eq(outboxEvents.id, eventId));
        }
      }
    }
  });
}
