import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickupPoints, type PickupPoint } from "@vroom/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { errorResponse } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const city = request.nextUrl.searchParams.get("city");
    const conditions = [eq(pickupPoints.active, true)];

    if (city) {
      conditions.push(ilike(pickupPoints.city, `%${city}%`));
    }

    const results = (await (db as any)
      .select()
      .from(pickupPoints)
      .where(and(...conditions))) as PickupPoint[];

    return NextResponse.json(results);
  } catch (error) {
    return errorResponse(error);
  }
}
