import { db } from "@/lib/db";
import { vehicles, bookings, type Vehicle } from "@vroom/db/schema";
import { eq, and, gte, lte, ilike, sql, or, desc, asc, notExists, lt, gt } from "drizzle-orm";
import type { VehicleSearchParams } from "@vroom/validators";

export class VehicleService {
  async search(params: VehicleSearchParams) {
    const conditions = [eq(vehicles.status, "listed")];

    if (params.city) {
      conditions.push(ilike(vehicles.city, `%${params.city}%`));
    }

    if (params.country) {
      conditions.push(eq(vehicles.country, params.country));
    }

    if (params.vehicleType) {
      conditions.push(eq(vehicles.vehicleType, params.vehicleType));
    }

    if (params.fuelType) {
      conditions.push(eq(vehicles.fuelType, params.fuelType));
    }

    if (params.transmission) {
      conditions.push(eq(vehicles.transmission, params.transmission));
    }

    if (params.minSeats) {
      conditions.push(gte(vehicles.seats, params.minSeats));
    }

    if (params.maxPrice) {
      conditions.push(lte(vehicles.baseDailyRate, params.maxPrice));
    }

    if (params.minRating) {
      conditions.push(gte(vehicles.ratingAvg, String(params.minRating)));
    }

    if (params.query) {
      conditions.push(
        or(
          ilike(vehicles.make, `%${params.query}%`),
          ilike(vehicles.model, `%${params.query}%`),
          ilike(vehicles.description, `%${params.query}%`),
          ilike(vehicles.address, `%${params.query}%`)
        )!
      );
    }

    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      conditions.push(
        notExists(
          (db as any)
            .select({ one: sql`1` })
            .from(bookings)
            .where(
              and(
                eq(bookings.vehicleId, vehicles.id),
                sql`${bookings.status} in ('confirmed', 'active')`,
                lt(bookings.startDate, end),
                gt(bookings.endDate, start)
              )
            )
        )
      );
    }

    const offset = (params.page - 1) * params.limit;

    let orderBy;
    switch (params.sortBy) {
      case "price":
        orderBy = asc(vehicles.baseDailyRate);
        break;
      case "rating":
        orderBy = desc(vehicles.ratingAvg);
        break;
      case "distance":
        // For distance sorting, we need lat/lng — fallback to relevance
        orderBy = desc(vehicles.tripCount);
        break;
      case "relevance":
      default:
        orderBy = desc(vehicles.tripCount);
        break;
    }

    const [results, countResult] = await Promise.all([
      (db as any)
        .select()
        .from(vehicles)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(params.limit)
        .offset(offset) as Promise<Vehicle[]>,
      (db as any)
        .select({ count: sql<number>`count(*)` })
        .from(vehicles)
        .where(and(...conditions)) as Promise<{ count: number }[]>,
    ]);

    // If lat/lng provided, compute distances and re-sort
    let enrichedResults = results.map((v) => {
      let distanceKm: number | null = null;
      if (params.latitude && params.longitude) {
        distanceKm = haversineDistance(
          params.latitude,
          params.longitude,
          Number(v.latitude),
          Number(v.longitude)
        );
      }
      return { ...v, distanceKm };
    });

    if (params.sortBy === "distance" && params.latitude && params.longitude) {
      enrichedResults.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    // Filter by radius if provided
    if (params.latitude && params.longitude && params.radiusKm) {
      enrichedResults = enrichedResults.filter(
        (v) => v.distanceKm !== null && v.distanceKm <= params.radiusKm
      );
    }

    return {
      vehicles: enrichedResults,
      total: Number(countResult[0]?.count ?? 0),
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / params.limit),
    };
  }

  async getById(id: string): Promise<Vehicle | null> {
    const result = (await (db as any)
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1)) as Vehicle[];

    return result[0] ?? null;
  }

  async getCities(): Promise<Array<{ city: string; vehicleCount: number; startingPrice: number }>> {
    const result = (await (db as any)
      .select({
        city: vehicles.city,
        vehicleCount: sql<number>`count(*)`,
        startingPrice: sql<number>`min(${vehicles.baseDailyRate})`,
      })
      .from(vehicles)
      .where(eq(vehicles.status, "listed"))
      .groupBy(vehicles.city)
      .orderBy(desc(sql`count(*)`))) as Array<{ city: string; vehicleCount: number; startingPrice: number }>;

    return result.map((r) => ({
      city: r.city,
      vehicleCount: Number(r.vehicleCount),
      startingPrice: Number(r.startingPrice),
    }));
  }

  async getByHost(hostId: string): Promise<Vehicle[]> {
    return (db as any)
      .select()
      .from(vehicles)
      .where(eq(vehicles.hostId, hostId))
      .orderBy(desc(vehicles.createdAt)) as Promise<Vehicle[]>;
  }

  async create(input: Record<string, unknown>, hostId: string): Promise<Vehicle> {
    const result = (await (db as any)
      .insert(vehicles)
      .values({
        ...input,
        hostId,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        status: "draft",
      })
      .returning()) as Vehicle[];
    return result[0]!;
  }

  async update(id: string, hostId: string, input: Record<string, unknown>): Promise<Vehicle> {
    const vehicle = await this.getById(id);
    if (!vehicle) throw new Error("Vehicle not found");
    if (vehicle.hostId !== hostId) throw new Error("Not authorized");

    const updates: Record<string, unknown> = { ...input, updatedAt: new Date() };
    if (input.latitude !== undefined) updates.latitude = String(input.latitude);
    if (input.longitude !== undefined) updates.longitude = String(input.longitude);

    const result = (await (db as any)
      .update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning()) as Vehicle[];
    return result[0]!;
  }

  async updateStatus(id: string, hostId: string, status: string): Promise<Vehicle> {
    const vehicle = await this.getById(id);
    if (!vehicle) throw new Error("Vehicle not found");
    if (vehicle.hostId !== hostId) throw new Error("Not authorized");

    const result = (await (db as any)
      .update(vehicles)
      .set({ status, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning()) as Vehicle[];
    return result[0]!;
  }

  async getHostStats(hostId: string) {
    const [vehicleRows, bookingRows] = await Promise.all([
      (db as any)
        .select({
          total: sql<number>`count(*)`,
          listed: sql<number>`count(*) filter (where ${vehicles.status} = 'listed')`,
        })
        .from(vehicles)
        .where(eq(vehicles.hostId, hostId)) as Promise<Array<{ total: number; listed: number }>>,
      (db as any)
        .select({
          total: sql<number>`count(*)`,
          pending: sql<number>`count(*) filter (where ${bookings.status} = 'pending')`,
          confirmed: sql<number>`count(*) filter (where ${bookings.status} = 'confirmed')`,
          totalRevenue: sql<number>`coalesce(sum(${bookings.totalAmount}) filter (where ${bookings.status} in ('confirmed', 'completed')), 0)`,
        })
        .from(bookings)
        .where(eq(bookings.hostId, hostId)) as Promise<Array<{ total: number; pending: number; confirmed: number; totalRevenue: number }>>,
    ]);

    return {
      vehicles: {
        total: Number(vehicleRows[0]?.total ?? 0),
        listed: Number(vehicleRows[0]?.listed ?? 0),
      },
      bookings: {
        total: Number(bookingRows[0]?.total ?? 0),
        pending: Number(bookingRows[0]?.pending ?? 0),
        confirmed: Number(bookingRows[0]?.confirmed ?? 0),
        totalRevenue: Number(bookingRows[0]?.totalRevenue ?? 0),
      },
    };
  }
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export const vehicleService = new VehicleService();
