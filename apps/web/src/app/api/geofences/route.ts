import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geofences, type Geofence } from "@vroom/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { errorResponse } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const city = request.nextUrl.searchParams.get("city");
    const type = request.nextUrl.searchParams.get("type");
    const conditions = [eq(geofences.active, true)];

    if (city) {
      conditions.push(ilike(geofences.city, `%${city}%`));
    }
    if (type) {
      conditions.push(eq(geofences.type, type));
    }

    const results = (await (db as any)
      .select()
      .from(geofences)
      .where(and(...conditions))) as Geofence[];

    return NextResponse.json(results);
  } catch (error) {
    return errorResponse(error);
  }
}
