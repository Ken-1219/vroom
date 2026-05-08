import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { db } from "@/lib/db";
import { vehicles, bookings } from "@vroom/db/schema";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

interface VehicleRow {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  baseDailyRate: number;
  city: string;
  photos: Array<{ url: string; position: number; isPrimary?: boolean }> | null;
  ratingAvg: string | null;
  tripCount: number | null;
}

interface RecommendedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  pricePerDay: string;
  city: string;
  photo: string | null;
  ratingAvg: string;
  tripCount: number;
  reason?: string;
}

function formatVehicle(v: VehicleRow, reason?: string): RecommendedVehicle {
  const photos = v.photos ?? [];
  const primary = photos.find((p) => p.isPrimary) ?? photos[0] ?? null;
  const pricePaise = v.baseDailyRate;
  const priceRupees = Math.round(pricePaise / 100);
  const priceStr = `₹${priceRupees.toLocaleString("en-IN")}`;

  return {
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    vehicleType: v.vehicleType,
    pricePerDay: priceStr,
    city: v.city,
    photo: primary?.url ?? null,
    ratingAvg: v.ratingAvg ?? "0.0",
    tripCount: v.tripCount ?? 0,
    ...(reason ? { reason } : {}),
  };
}

export async function GET() {
  try {
    const session = await auth();

    let candidateVehicles: VehicleRow[] = [];
    let hasHistory = false;

    if (session?.user?.id) {
      const userId = session.user.id;

      const recentBookings = await (db as any)
        .select({
          vehicleId: bookings.vehicleId,
          vehicleType: vehicles.vehicleType,
          city: vehicles.city,
        })
        .from(bookings)
        .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .where(eq(bookings.renterId, userId))
        .orderBy(desc(bookings.createdAt))
        .limit(10);

      if (recentBookings.length > 0) {
        hasHistory = true;

        const preferredTypes: string[] = [...new Set(recentBookings.map((b: { vehicleType: string }) => b.vehicleType))] as string[];
        const preferredCities: string[] = [...new Set(recentBookings.map((b: { city: string }) => b.city))] as string[];
        const bookedIds: string[] = [...new Set(recentBookings.map((b: { vehicleId: string }) => b.vehicleId))] as string[];

        candidateVehicles = await (db as any)
          .select({
            id: vehicles.id,
            make: vehicles.make,
            model: vehicles.model,
            year: vehicles.year,
            vehicleType: vehicles.vehicleType,
            baseDailyRate: vehicles.baseDailyRate,
            city: vehicles.city,
            photos: vehicles.photos,
            ratingAvg: vehicles.ratingAvg,
            tripCount: vehicles.tripCount,
          })
          .from(vehicles)
          .where(
            sql`${vehicles.status} = 'listed'
              AND ${vehicles.id} NOT IN (${sql.join(bookedIds.map((id) => sql`${id}::uuid`), sql`, `)})
              AND (
                ${vehicles.vehicleType} = ANY(ARRAY[${sql.join(preferredTypes.map((t) => sql`${t}`), sql`, `)}])
                OR ${vehicles.city} = ANY(ARRAY[${sql.join(preferredCities.map((c) => sql`${c}`), sql`, `)}])
              )`
          )
          .orderBy(desc(vehicles.ratingAvg))
          .limit(20);
      }
    }

    if (!hasHistory || candidateVehicles.length === 0) {
      candidateVehicles = await (db as any)
        .select({
          id: vehicles.id,
          make: vehicles.make,
          model: vehicles.model,
          year: vehicles.year,
          vehicleType: vehicles.vehicleType,
          baseDailyRate: vehicles.baseDailyRate,
          city: vehicles.city,
          photos: vehicles.photos,
          ratingAvg: vehicles.ratingAvg,
          tripCount: vehicles.tripCount,
        })
        .from(vehicles)
        .where(eq(vehicles.status, "listed"))
        .orderBy(desc(vehicles.ratingAvg))
        .limit(4);

      return NextResponse.json(candidateVehicles.slice(0, 4).map((v: VehicleRow) => formatVehicle(v)));
    }

    const vehicleSummaries = candidateVehicles.map((v: VehicleRow) => ({
      id: v.id,
      name: `${v.make} ${v.model} ${v.year}`,
      type: v.vehicleType,
      city: v.city,
      pricePerDay: Math.round(v.baseDailyRate / 100),
      rating: v.ratingAvg ?? "0.0",
      trips: v.tripCount ?? 0,
    }));

    try {
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `You are a car rental recommendation engine for Vroom, an Indian self-drive car rental platform.

Given these candidate vehicles, rank the top 4 and provide a 1-line reason why each is recommended.

Vehicles:
${JSON.stringify(vehicleSummaries, null, 2)}

Return ONLY a JSON array of exactly 4 objects. Each object must have:
- "id": the vehicle id string
- "reason": a short 1-line reason why this vehicle is recommended (e.g. "Highly rated SUV perfect for city drives")

Example format:
[{"id":"abc","reason":"Top-rated sedan ideal for daily commutes"},{"id":"def","reason":"Affordable hatchback with excellent reviews"}]

Return only the JSON array, no other text.`,
        maxOutputTokens: 300,
      });

      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const ranked = JSON.parse(match[0]) as Array<{ id: string; reason: string }>;
        const reasonMap = new Map(ranked.map((r) => [r.id, r.reason]));
        const vehicleMap = new Map(candidateVehicles.map((v: VehicleRow) => [v.id, v]));

        const results: RecommendedVehicle[] = [];
        for (const item of ranked.slice(0, 4)) {
          const v = vehicleMap.get(item.id);
          if (v) {
            results.push(formatVehicle(v, item.reason));
          }
        }

        if (results.length === 4) {
          return NextResponse.json(results);
        }
      }
    } catch {
      // LLM failed — fall through to DB sort
    }

    return NextResponse.json(
      candidateVehicles.slice(0, 4).map((v: VehicleRow) => formatVehicle(v))
    );
  } catch (err) {
    console.error("[ai/recommendations]", err);
    return NextResponse.json([]);
  }
}
