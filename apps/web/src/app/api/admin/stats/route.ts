import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, vehicles, bookings, payments } from "@vroom/db/schema";
import { count, sum, eq } from "drizzle-orm";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Admin access required"));
  }

  try {
    const [userStats, vehicleStats, bookingStats, revenueStats] =
      await Promise.all([
        (db as any)
          .select({ total: count() })
          .from(users) as Promise<{ total: number }[]>,
        (db as any)
          .select({ total: count() })
          .from(vehicles) as Promise<{ total: number }[]>,
        (db as any)
          .select({ total: count() })
          .from(bookings) as Promise<{ total: number }[]>,
        (db as any)
          .select({ total: sum(payments.amount) })
          .from(payments)
          .where(eq(payments.status, "captured")) as Promise<
          { total: string | null }[]
        >,
      ]);

    const hostCount = (await (db as any)
      .select({ total: count() })
      .from(users)
      .where(eq(users.role, "host"))) as { total: number }[];

    const pendingBookings = (await (db as any)
      .select({ total: count() })
      .from(bookings)
      .where(eq(bookings.status, "pending"))) as { total: number }[];

    return NextResponse.json({
      users: userStats[0]?.total ?? 0,
      hosts: hostCount[0]?.total ?? 0,
      vehicles: vehicleStats[0]?.total ?? 0,
      bookings: bookingStats[0]?.total ?? 0,
      pendingBookings: pendingBookings[0]?.total ?? 0,
      revenue: parseInt(revenueStats[0]?.total ?? "0"),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
