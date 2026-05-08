import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications, vehicles } from "@vroom/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ subscribed: false });

  const vehicleId = request.nextUrl.searchParams.get("vehicleId");
  if (!vehicleId) return NextResponse.json({ subscribed: false });

  const existing = await (db as any)
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.type, "price_alert_subscription"),
      )
    )
    .limit(20);

  const subscribed = existing.some(
    (n: { id: string }) => {
      // check data field — we can't easily filter jsonb in Drizzle without raw SQL
      return true; // will be filtered after fetch
    }
  );

  const all = await (db as any)
    .select({ id: notifications.id, data: notifications.data })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.type, "price_alert_subscription"),
      )
    );

  const isSubscribed = all.some(
    (n: { data: Record<string, unknown> | null }) =>
      n.data && (n.data as Record<string, unknown>).vehicleId === vehicleId
  );

  return NextResponse.json({ subscribed: isSubscribed });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleId } = await request.json();
  if (!vehicleId) return NextResponse.json({ error: "vehicleId required" }, { status: 400 });

  const vehicle = await (db as any)
    .select({ make: vehicles.make, model: vehicles.model, baseDailyRate: vehicles.baseDailyRate })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);

  if (!vehicle[0]) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const { make, model, baseDailyRate } = vehicle[0];
  const vehicleName = `${make} ${model}`;
  const currentPrice = Math.round(baseDailyRate / 100);

  // Check if already subscribed
  const existing = await (db as any)
    .select({ id: notifications.id, data: notifications.data })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.type, "price_alert_subscription"),
      )
    );

  const alreadySubscribed = existing.some(
    (n: { data: Record<string, unknown> | null }) =>
      n.data && (n.data as Record<string, unknown>).vehicleId === vehicleId
  );

  if (alreadySubscribed) {
    return NextResponse.json({ subscribed: true, message: "Already subscribed" });
  }

  await (db as any).insert(notifications).values({
    userId: session.user.id,
    type: "price_alert_subscription",
    title: "Price alert set",
    body: `You'll be notified if ${vehicleName} drops below ₹${currentPrice.toLocaleString("en-IN")}/day.`,
    data: { vehicleId, vehicleName, currentPrice },
    channel: "in_app",
    read: true,
  });

  return NextResponse.json({ subscribed: true, vehicleName, currentPrice });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicleId = request.nextUrl.searchParams.get("vehicleId");
  if (!vehicleId) return NextResponse.json({ error: "vehicleId required" }, { status: 400 });

  const all = await (db as any)
    .select({ id: notifications.id, data: notifications.data })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.type, "price_alert_subscription"),
      )
    );

  const toDelete = all.filter(
    (n: { id: string; data: Record<string, unknown> | null }) =>
      n.data && (n.data as Record<string, unknown>).vehicleId === vehicleId
  );

  for (const n of toDelete) {
    await (db as any).delete(notifications).where(eq(notifications.id, n.id));
  }

  return NextResponse.json({ subscribed: false });
}
