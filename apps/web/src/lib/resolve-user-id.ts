import { db } from "@/lib/db";
import { users } from "@vroom/db/schema";
import { eq } from "drizzle-orm";

/**
 * Resolves the stable user ID that exists in the `users` table.
 *
 * NextAuth may generate a different session user.id across OAuth login sessions
 * for the same Google account. We always look up by email so that foreign keys
 * on bookings (renter_id → users.id) are satisfied, and so that every query
 * that filters by renterId returns the correct rows.
 *
 * Returns the DB-resident user ID, or the session ID as a fallback.
 */
export async function resolveUserId(
  sessionId: string,
  email: string | null | undefined
): Promise<string> {
  if (!email) return sessionId;

  try {
    const rows = await (db as any)
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1) as { id: string }[];

    return rows[0]?.id ?? sessionId;
  } catch {
    // Non-critical — fall back to session ID
    return sessionId;
  }
}
