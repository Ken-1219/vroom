import { db } from "@/lib/db";
import { vehicles, bookings, vehicleAvailability, type Vehicle } from "@vroom/db/schema";
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
      const startDateStr = start.toISOString().split("T")[0]!;
      const endDateStr = end.toISOString().split("T")[0]!;

      // Exclude vehicles with overlapping confirmed/active bookings
      conditions.push(
        notExists(
          db
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

      // Exclude vehicles with overlapping blocked/maintenance periods
      conditions.push(
        notExists(
          db
            .select({ one: sql`1` })
            .from(vehicleAvailability)
            .where(
              and(
                eq(vehicleAvailability.vehicleId, vehicles.id),
                lt(vehicleAvailability.startDate, endDateStr),
                gt(vehicleAvailability.endDate, startDateStr)
              )
            )
        )
      );
    }

    // Spatial filtering: use earthdistance GiST index for bounding-box pre-filter,
    // then exact earth_distance check for circle radius.
    const hasLocation = params.latitude != null && params.longitude != null;
    if (hasLocation && params.radiusKm) {
      const radiusMeters = params.radiusKm * 1000;
      const lat = params.latitude!;
      const lng = params.longitude!;
      // Bounding-box pre-filter (uses GiST index idx_vehicles_location)
      conditions.push(
        sql`earth_box(ll_to_earth(${lat}, ${lng}), ${radiusMeters}) @> ll_to_earth(${vehicles.latitude}::float8, ${vehicles.longitude}::float8)`
      );
      // Exact distance check within the circle
      conditions.push(
        sql`earth_distance(ll_to_earth(${lat}, ${lng}), ll_to_earth(${vehicles.latitude}::float8, ${vehicles.longitude}::float8)) <= ${radiusMeters}`
      );
    }

    const offset = (params.page - 1) * params.limit;

    // Computed distance column (in km) when location is provided
    const distanceColumn = hasLocation
      ? sql<number>`(earth_distance(ll_to_earth(${params.latitude!}, ${params.longitude!}), ll_to_earth(${vehicles.latitude}::float8, ${vehicles.longitude}::float8)) / 1000)`.as("distance_km")
      : sql<null>`null`.as("distance_km");

    let orderBy;
    switch (params.sortBy) {
      case "price":
        orderBy = asc(vehicles.baseDailyRate);
        break;
      case "rating":
        orderBy = desc(vehicles.ratingAvg);
        break;
      case "distance":
        orderBy = hasLocation
          ? asc(sql`earth_distance(ll_to_earth(${params.latitude!}, ${params.longitude!}), ll_to_earth(${vehicles.latitude}::float8, ${vehicles.longitude}::float8))`)
          : desc(vehicles.tripCount);
        break;
      case "relevance":
      default:
        orderBy = desc(vehicles.tripCount);
        break;
    }

    const [results, countResult] = await Promise.all([
      db
        .select({
          vehicle: vehicles,
          distanceKm: distanceColumn,
        })
        .from(vehicles)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(params.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(vehicles)
        .where(and(...conditions)) as Promise<{ count: number }[]>,
    ]);

    const enrichedResults = results.map((row) => ({
      ...row.vehicle,
      distanceKm: row.distanceKm != null ? Number(row.distanceKm) : null,
    }));

    return {
      vehicles: enrichedResults,
      total: Number(countResult[0]?.count ?? 0),
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / params.limit),
    };
  }

  async getById(id: string): Promise<Vehicle | null> {
    const result = (await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1)) as Vehicle[];

    return result[0] ?? null;
  }

  async getCities(): Promise<Array<{ city: string; vehicleCount: number; startingPrice: number }>> {
    const result = (await db
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
    return db
      .select()
      .from(vehicles)
      .where(eq(vehicles.hostId, hostId))
      .orderBy(desc(vehicles.createdAt)) as Promise<Vehicle[]>;
  }

  async create(input: Record<string, unknown>, hostId: string): Promise<Vehicle> {
    const result = (await db
      .insert(vehicles)
      .values({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(input as any),
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

    const result = (await db
      .update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning()) as Vehicle[];
    return result[0]!;
  }

  async updateStatus(id: string, hostId: string, status: "draft" | "listed" | "delisted"): Promise<Vehicle> {
    const vehicle = await this.getById(id);
    if (!vehicle) throw new Error("Vehicle not found");
    if (vehicle.hostId !== hostId) throw new Error("Not authorized");

    const result = (await db
      .update(vehicles)
      .set({ status, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning()) as Vehicle[];
    return result[0]!;
  }

  async getHostStats(hostId: string) {
    const [vehicleRows, bookingRows] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)`,
          listed: sql<number>`count(*) filter (where ${vehicles.status} = 'listed')`,
        })
        .from(vehicles)
        .where(eq(vehicles.hostId, hostId)) as Promise<Array<{ total: number; listed: number }>>,
      db
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

export const vehicleService = new VehicleService();
