import { groq } from "@ai-sdk/groq";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";
import { vehicleService } from "@/services/vehicle";
import { auth } from "@/lib/auth";
import { bookingService } from "@/services/booking";
import { tripService } from "@/services/trip";
import { pricingService } from "@/services/pricing";
import { formatPrice } from "@/lib/format";
import { db } from "@/lib/db";
import { pickupPoints, bookings, vehicles } from "@vroom/db/schema";
import { eq, and, ilike, desc, sql } from "drizzle-orm";
import { registerEventHandlers } from "@/lib/event-handlers";
import { resolveUserId } from "@/lib/resolve-user-id";

registerEventHandlers();
import type { VehicleSearchParams } from "@vroom/validators";
import type { PickupPoint } from "@vroom/db/schema";

async function getUserContext(userId: string, role: string) {
  const recentBookings = (await (db as any)
    .select({
      id: bookings.id,
      status: bookings.status,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      totalAmount: bookings.totalAmount,
      currency: bookings.currency,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
    })
    .from(bookings)
    .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(eq(bookings.renterId, userId))
    .orderBy(desc(bookings.createdAt))
    .limit(5)) as Array<{
    id: string; status: string; startDate: Date; endDate: Date;
    totalAmount: number; currency: string; vehicleMake: string | null; vehicleModel: string | null;
  }>;

  let context = "";
  if (recentBookings.length > 0) {
    context += "\nUser's recent bookings:\n";
    for (const b of recentBookings) {
      context += `- ${b.vehicleMake} ${b.vehicleModel}: ${b.status} (${new Date(b.startDate).toLocaleDateString("en-IN")} – ${new Date(b.endDate).toLocaleDateString("en-IN")}), ${formatPrice(b.totalAmount, b.currency)} [View](/bookings/${b.id})\n`;
    }
  }

  if (role === "host") {
    const stats = await vehicleService.getHostStats(userId);
    context += `\nHost stats: ${stats.vehicles.total} vehicles (${stats.vehicles.listed} listed), ${stats.bookings.total} bookings, ${formatPrice(stats.bookings.totalRevenue, "INR")} total revenue, ${stats.bookings.pending} pending requests.\n`;
  }

  return context;
}

function buildSystemPrompt(
  session: { user?: { name?: string | null; email?: string | null; role?: string } } | null,
  userContext: string,
): string {
  const isLoggedIn = !!session?.user;

  let prompt = `You are Vroom AI, a helpful car rental assistant for Vroom — India's self-drive car rental platform in Bangalore.

You have these tools:
- searchVehicles: Find cars by type, budget, or trip scenario. Pass a natural language query.
- getVehicleInfo: Get details, pricing, availability, or pickup points for a specific vehicle. Pass the vehicleId and what info you need.${isLoggedIn ? "\n- manageBookings: Create bookings, cancel bookings, modify booking dates, list user's bookings, or check trip status. When user wants to book, use vehicleId from earlier search results. Ask for dates if not provided. Use YYYY-MM-DD format. For modifications, look up bookingId from the user's booking list first if not provided." : ""}

Guidelines:
- Be concise and conversational
- Show make/model, price/day in INR, and links
- Prices are stored in paise (100 paise = ₹1)
- We have 200+ cars across 40+ Bangalore neighborhoods
- Cancellation: Free >48hrs, 25% at 24-48hrs, 50% at 6-24hrs, 100% <6hrs
- Protection: Basic (liability), Standard (+8%), Premium (+15%)
- When booking is created, tell user to click the Pay Now button to complete payment via Razorpay
- If user says "book X", find the vehicle from previous search results and use its vehicleId. Ask for travel dates if not mentioned.`;

  if (isLoggedIn) {
    prompt += `\n\nLogged in as: ${session!.user!.name} (${session!.user!.email}), role: ${session!.user!.role}${userContext}`;
  } else {
    prompt += `\n\nUser is not logged in. Direct them to /login to book.`;
  }

  return prompt;
}

export async function POST(req: Request) {
  const session = await auth();
  const { messages, latitude: userLat, longitude: userLng } = await req.json();

  let userContext = "";
  if (session?.user?.id) {
    try {
      userContext = await getUserContext(session.user.id, session.user.role ?? "renter");
    } catch {
      // non-critical
    }
  }

  try {
  const result = streamText({
    model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    system: buildSystemPrompt(session, userContext),
    messages: await convertToModelMessages(messages),

    tools: {
      searchVehicles: tool({
        description: "Search for cars. Handles browsing, filtering, price comparison, and trip-based recommendations. For comparing specific models (e.g. 'Seltos vs Creta'), pass the full comparison query.",
        inputSchema: z.object({
          query: z.string().describe("Natural language search, e.g. 'SUVs under 2000 per day' or 'compare Seltos vs Creta'"),
        }),
        execute: async (input) => {
          const q = input.query.toLowerCase();

          // Handle comparison queries: "compare X vs Y", "X vs Y", "X or Y prices"
          const compareMatch = q.match(/(?:compare\s+)?(\w[\w\s]*?)\s+(?:vs\.?|versus|or|and)\s+(\w[\w\s]*?)(?:\s+(?:price|rental|rate|cost|per day).*)?$/i);
          if (compareMatch) {
            const modelA = compareMatch[1]!.trim();
            const modelB = compareMatch[2]!.trim();
            const baseParams: VehicleSearchParams = { page: 1, limit: 3, radiusKm: 50, sortBy: "price" as const,
              ...(userLat && userLng ? { latitude: userLat, longitude: userLng, sortBy: "distance" as const } : {}) };
            const [resultA, resultB] = await Promise.all([
              vehicleService.search({ ...baseParams, query: modelA }),
              vehicleService.search({ ...baseParams, query: modelB }),
            ]);
            const allVehicles = [...resultA.vehicles.slice(0, 3), ...resultB.vehicles.slice(0, 3)];
            if (allVehicles.length === 0) {
              return { total: 0, vehicles: [], note: `No results for "${modelA}" or "${modelB}". Try broader terms.` };
            }
            const prices = allVehicles.map(v => v.baseDailyRate);
            return {
              total: allVehicles.length,
              comparison: { modelA, modelB, countA: resultA.vehicles.length, countB: resultB.vehicles.length },
              priceRange: `${formatPrice(Math.min(...prices), "INR")} – ${formatPrice(Math.max(...prices), "INR")}`,
              vehicles: allVehicles.map(formatVehicle),
            };
          }

          const validTypes = ["sedan", "suv", "hatchback", "luxury", "ev", "mpv"] as const;
          const vType = validTypes.find(t => q.includes(t)) ?? undefined;

          const cityMatch = q.match(/\b(bangalore|mumbai|delhi|hyderabad|chennai|pune|kolkata|jaipur|ahmedabad|goa|kochi|mysore)\b/i);

          const neighborhoods = [
            "koramangala", "indiranagar", "hsr layout", "hsr", "whitefield", "jayanagar",
            "electronic city", "marathahalli", "malleshwaram", "rajajinagar", "btm layout", "btm",
            "jp nagar", "banashankari", "yelahanka", "hebbal", "mg road", "brigade road",
            "sadashivanagar", "basavanagudi", "rt nagar", "vijayanagar", "nagarbhavi",
            "bannerghatta", "sarjapur", "bellandur", "mahadevapura", "kr puram",
            "ulsoor", "frazer town", "cox town", "domlur", "hrbr layout",
          ];
          const neighborhoodMatch = neighborhoods.find(n => q.includes(n));

          let maxPrice = 0;
          const priceMatch = q.match(/(?:under|below|max|<)\s*(?:rs\.?|₹|inr)?\s*(\d[\d,]*)/i);
          if (priceMatch) {
            maxPrice = parseInt(priceMatch[1]!.replace(/,/g, ""), 10) * 100;
          }

          const isNearMe = /\bnear\s*me\b/i.test(q);

          let sortBy: "price" | "rating" | "relevance" | "distance" = "relevance";
          if (q.includes("cheap") || q.includes("budget") || q.includes("affordable")) sortBy = "price";
          if (q.includes("best") || q.includes("top") || q.includes("popular")) sortBy = "rating";
          if (isNearMe && userLat && userLng) sortBy = "distance";

          const tripKeywords: Record<string, { vehicleType?: typeof validTypes[number]; minSeats?: number }> = {
            "family": { vehicleType: "suv", minSeats: 5 },
            "road trip": { vehicleType: "suv" },
            "commute": { vehicleType: "hatchback" },
            "business": { vehicleType: "luxury" },
            "airport": { vehicleType: "sedan" },
          };

          let minSeats: number | undefined;
          let tripType: string | undefined;
          for (const [key, config] of Object.entries(tripKeywords)) {
            if (q.includes(key)) {
              if (!vType && config.vehicleType) {
                // use trip-based type only if user didn't specify one
              }
              minSeats = config.minSeats;
              tripType = key;
              break;
            }
          }

          const passMatch = q.match(/(\d+)\s*(?:people|passengers|seater|seats|person)/i);
          if (passMatch) minSeats = parseInt(passMatch[1]!, 10);

          const noiseWords = new Set(["show", "me", "find", "search", "for", "a", "an", "the", "in", "near", "around",
            "under", "below", "above", "over", "per", "day", "best", "top", "cheapest", "cars", "car", "vehicles",
            "vehicle", "available", "rs", "inr", "rupees", "budget", "affordable", "premium", "compare", "vs",
            "versus", "rental", "prices", "price", "cost", "rate", ...neighborhoods,
            ...validTypes, "automatic", "manual", "petrol", "diesel", "electric",
            ...(cityMatch ? [cityMatch[1]!.toLowerCase()] : []),
            ...(priceMatch ? [priceMatch[0]!.toLowerCase()] : []),
            ...(passMatch ? [passMatch[0]!.toLowerCase()] : []),
          ]);
          const makeModelQuery = input.query
            .replace(/[₹,<>]/g, " ")
            .split(/\s+/)
            .filter(w => w.length > 1 && !noiseWords.has(w.toLowerCase()) && !/^\d+$/.test(w))
            .join(" ")
            .trim();

          const params: VehicleSearchParams = {
            page: 1,
            limit: 6,
            radiusKm: isNearMe ? 10 : 50,
            sortBy,
            ...(cityMatch ? { city: cityMatch[1] } : neighborhoodMatch ? { city: "Bangalore" } : {}),
            ...(vType && { vehicleType: vType }),
            ...(!vType && tripType && tripKeywords[tripType]?.vehicleType && { vehicleType: tripKeywords[tripType]!.vehicleType }),
            ...(maxPrice > 0 && { maxPrice }),
            ...(minSeats && { minSeats }),
            ...(userLat && userLng ? { latitude: userLat, longitude: userLng } : {}),
            ...(neighborhoodMatch ? { query: neighborhoodMatch } : makeModelQuery ? { query: makeModelQuery } : {}),
          };

          let searchResult = await vehicleService.search(params);

          // Fallback: if neighborhood filter returns nothing, try city-wide
          if (searchResult.vehicles.length === 0 && neighborhoodMatch) {
            const cityWide = await vehicleService.search({ ...params, query: undefined });
            if (cityWide.vehicles.length > 0) {
              searchResult = cityWide;
            }
          }

          // Fallback: if vehicle type filter returns nothing, broaden
          if (searchResult.vehicles.length === 0 && vType) {
            const broader = await vehicleService.search({ ...params, vehicleType: undefined, query: undefined });
            if (broader.vehicles.length > 0) {
              return {
                total: broader.total,
                note: `No ${vType}s found${neighborhoodMatch ? ` near ${neighborhoodMatch}` : ""}, showing other options`,
                vehicles: broader.vehicles.map(formatVehicle),
              };
            }
          }

          const prices = searchResult.vehicles.map(v => v.baseDailyRate);
          return {
            total: searchResult.total,
            ...(isNearMe && !userLat && { locationNeeded: true, note: "Share your location for nearby results. Showing Bangalore-wide for now." }),
            ...(prices.length > 1 && {
              priceRange: `${formatPrice(Math.min(...prices), "INR")} – ${formatPrice(Math.max(...prices), "INR")}`,
            }),
            vehicles: searchResult.vehicles.map(formatVehicle),
          };
        },
      }),

      getVehicleInfo: tool({
        description: "Get details, price estimate, availability check, or pickup points for a vehicle.",
        inputSchema: z.object({
          vehicleId: z.string().describe("The vehicle UUID"),
          action: z.string().describe("One of: details, price_estimate, check_availability, pickup_points"),
          startDate: z.string().describe("Start date YYYY-MM-DD (for price_estimate or check_availability). Empty string if not needed."),
          endDate: z.string().describe("End date YYYY-MM-DD (for price_estimate or check_availability). Empty string if not needed."),
        }),
        execute: async (input) => {
          if (input.action === "pickup_points") {
            const vehicle = await vehicleService.getById(input.vehicleId);
            if (!vehicle) return { error: "Vehicle not found" };
            const results = (await (db as any)
              .select().from(pickupPoints)
              .where(and(eq(pickupPoints.active, true), ilike(pickupPoints.city, `%${vehicle.city}%`)))
            ) as PickupPoint[];
            return {
              city: vehicle.city,
              count: results.length,
              pickupPoints: results.map(p => ({ name: p.name, landmark: p.landmark })),
            };
          }

          const vehicle = await vehicleService.getById(input.vehicleId);
          if (!vehicle) return { error: "Vehicle not found" };

          if (input.action === "details") {
            return {
              id: vehicle.id,
              make: vehicle.make, model: vehicle.model, year: vehicle.year,
              description: vehicle.description,
              vehicleType: vehicle.vehicleType, transmission: vehicle.transmission,
              fuelType: vehicle.fuelType, seats: vehicle.seats,
              pricePerDay: formatPrice(vehicle.baseDailyRate, vehicle.currency),
              city: vehicle.city,
              rating: vehicle.ratingAvg ? Number(vehicle.ratingAvg).toFixed(1) : null,
              tripCount: vehicle.tripCount,
              features: vehicle.features,
              photos: vehicle.photos,
              bookLink: `/vehicles/${vehicle.id}/book`,
            };
          }

          if (input.action === "check_availability" && input.startDate && input.endDate) {
            const conflicts = await (db as any)
              .select({ id: bookings.id, startDate: bookings.startDate, endDate: bookings.endDate, status: bookings.status })
              .from(bookings)
              .where(and(
                eq(bookings.vehicleId, input.vehicleId),
                sql`bookings.status IN ('pending','confirmed','active')`,
                sql`bookings.start_date < ${input.endDate} AND bookings.end_date > ${input.startDate}`
              ));

            if (conflicts.length === 0) {
              return { available: true, vehicle: `${vehicle.make} ${vehicle.model}`, message: "Available!", bookLink: `/vehicles/${vehicle.id}/book` };
            }
            return {
              available: false, vehicle: `${vehicle.make} ${vehicle.model}`,
              conflictingDates: conflicts.map((c: { startDate: Date; endDate: Date; status: string }) => ({
                from: new Date(c.startDate).toLocaleDateString("en-IN"),
                to: new Date(c.endDate).toLocaleDateString("en-IN"),
              })),
            };
          }

          if (input.action === "price_estimate" && input.startDate && input.endDate) {
            const breakdown = pricingService.calculateEstimate({
              vehicle,
              startDate: new Date(input.startDate),
              endDate: new Date(input.endDate),
            });
            return {
              vehicle: `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
              days: breakdown.days,
              baseRate: formatPrice(breakdown.baseRate, breakdown.currency),
              platformFee: formatPrice(breakdown.platformFee, breakdown.currency),
              tax: formatPrice(breakdown.tax, breakdown.currency),
              total: formatPrice(breakdown.total, breakdown.currency),
              perDayEffective: formatPrice(breakdown.perDayEffective, breakdown.currency),
              bookLink: `/vehicles/${vehicle.id}/book`,
            };
          }

          return { error: "Invalid action. Use: details, price_estimate, check_availability, or pickup_points" };
        },
      }),

      ...(session?.user ? {
        manageBookings: tool({
          description: "Manage bookings: list your bookings, create a new booking, cancel a booking, modify booking dates, or check trip status.",
          inputSchema: z.object({
            action: z.string().describe("One of: list, create, cancel, modify, trip_status"),
            vehicleId: z.string().describe("Vehicle UUID (for create). Empty string if not needed."),
            bookingId: z.string().describe("Booking UUID (for cancel, modify, or trip_status). Empty string if not needed."),
            startDate: z.string().describe("Start date YYYY-MM-DD (for create or modify). Empty string if not needed."),
            endDate: z.string().describe("End date YYYY-MM-DD (for create or modify). Empty string if not needed."),
          }),
          execute: async (input) => {
            const userId = await resolveUserId(session.user!.id, session.user!.email);

            if (input.action === "list") {
              const list = await bookingService.getByRenter(userId);
              if (list.length === 0) return { bookings: [], message: "No bookings yet." };
              return {
                bookings: list.map(b => ({
                  id: b.id, status: b.status,
                  startDate: b.startDate, endDate: b.endDate,
                  totalAmount: formatPrice(b.totalAmount, b.currency),
                  link: `/bookings/${b.id}`,
                })),
              };
            }

            if (input.action === "create" && input.vehicleId && input.startDate && input.endDate) {
              const vehicle = await vehicleService.getById(input.vehicleId);
              if (!vehicle) return { error: "Vehicle not found" };

              const conflicts = await (db as any)
                .select({ id: bookings.id })
                .from(bookings)
                .where(and(
                  eq(bookings.vehicleId, input.vehicleId),
                  sql`bookings.status IN ('pending','confirmed','active')`,
                  sql`bookings.start_date < ${input.endDate} AND bookings.end_date > ${input.startDate}`
                ));
              if (conflicts.length > 0) return { error: "Vehicle not available for these dates." };

              const breakdown = pricingService.calculateEstimate({
                vehicle, startDate: new Date(input.startDate), endDate: new Date(input.endDate),
              });
              const newBooking = await bookingService.create({
                vehicleId: input.vehicleId, startDate: input.startDate, endDate: input.endDate,
                totalAmount: breakdown.total,
                priceBreakdown: {
                  days: breakdown.days, baseRate: breakdown.baseRate,
                  weekdayTotal: breakdown.weekdayTotal, weekendTotal: breakdown.weekendTotal,
                  weeklyDiscount: breakdown.weeklyDiscount, monthlyDiscount: breakdown.monthlyDiscount,
                  protectionPlan: breakdown.protectionPlan, protectionFee: breakdown.protectionFee,
                  platformFee: breakdown.platformFee, tax: breakdown.tax,
                },
                currency: vehicle.currency,
              }, userId, vehicle.hostId);

              return {
                bookingId: newBooking.id,
                vehicle: `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
                total: formatPrice(breakdown.total, breakdown.currency),
                startDate: input.startDate,
                endDate: input.endDate,
                paymentLink: `/bookings/${newBooking.id}/pay`,
                status: "pending",
                message: "Booking created! Click Pay Now to complete payment via Razorpay.",
              };
            }

            if (input.action === "modify" && input.bookingId && input.startDate && input.endDate) {
              const booking = await bookingService.getById(input.bookingId);
              if (!booking) return { error: "Booking not found" };
              if (booking.renterId !== userId) return { error: "Access denied" };
              if (booking.status !== "pending" && booking.status !== "confirmed") {
                return { error: `Cannot modify a booking with status "${booking.status}". Only pending or confirmed bookings can be changed.` };
              }

              // Check new dates don't conflict (excluding this booking)
              const conflicts = await (db as any)
                .select({ id: bookings.id })
                .from(bookings)
                .where(and(
                  eq(bookings.vehicleId, booking.vehicleId),
                  sql`bookings.id != ${input.bookingId}`,
                  sql`bookings.status IN ('pending','confirmed','active')`,
                  sql`bookings.start_date < ${input.endDate} AND bookings.end_date > ${input.startDate}`
                ));
              if (conflicts.length > 0) return { error: "The vehicle is not available for those new dates. Try different dates." };

              const vehicle = await vehicleService.getById(booking.vehicleId);
              if (!vehicle) return { error: "Vehicle not found" };

              const breakdown = pricingService.calculateEstimate({
                vehicle,
                startDate: new Date(input.startDate),
                endDate: new Date(input.endDate),
              });

              if (breakdown.days < 1) return { error: "End date must be after start date." };

              await (db as any)
                .update(bookings)
                .set({
                  startDate: new Date(input.startDate),
                  endDate: new Date(input.endDate),
                  totalAmount: breakdown.total,
                  priceBreakdown: {
                    days: breakdown.days, baseRate: breakdown.baseRate,
                    platformFee: breakdown.platformFee, tax: breakdown.tax,
                  },
                  updatedAt: new Date(),
                })
                .where(eq(bookings.id, input.bookingId));

              return {
                message: "Booking updated!",
                bookingId: input.bookingId,
                newStartDate: input.startDate,
                newEndDate: input.endDate,
                newTotal: formatPrice(breakdown.total, vehicle.currency),
                days: breakdown.days,
                link: `/bookings/${input.bookingId}`,
              };
            }

            if (input.action === "cancel" && input.bookingId) {
              const booking = await bookingService.getById(input.bookingId);
              if (!booking) return { error: "Booking not found" };
              if (booking.renterId !== userId && booking.hostId !== userId) return { error: "Access denied" };
              const hours = (new Date(booking.startDate).getTime() - Date.now()) / 3600000;
              const refund = pricingService.getCancellationRefund(booking.totalAmount, hours);
              await bookingService.cancel(input.bookingId, userId, "Cancelled via chat");
              return { message: "Cancelled.", refund: formatPrice(refund.refundAmount, booking.currency), tier: refund.tier };
            }

            if (input.action === "trip_status" && input.bookingId) {
              const booking = await bookingService.getById(input.bookingId);
              if (!booking) return { error: "Booking not found" };
              const trip = await tripService.getByBooking(input.bookingId);
              if (!trip) return { bookingStatus: booking.status, message: "No trip started yet." };
              return {
                status: trip.status, startedAt: trip.actualStart, completedAt: trip.actualEnd,
                distanceKm: trip.startOdometer && trip.endOdometer ? trip.endOdometer - trip.startOdometer : null,
                tripLink: `/trips/${trip.id}`,
              };
            }

            return { error: "Invalid action. Use: list, create, cancel, or trip_status" };
          },
        }),
      } : {}),
    },

    stopWhen: stepCountIs(5),
    onError: ({ error }) => {
      console.error("[chat] stream error:", error instanceof Error ? error.message : error);
    },
  });

  return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error("[chat] route error:", error instanceof Error ? error.message : error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

function formatVehicle(v: {
  id: string; make: string; model: string; year: number;
  vehicleType: string; transmission: string; fuelType: string; seats: number;
  baseDailyRate: number; currency: string; city: string; address: string | null;
  ratingAvg: string | null; reviewCount: number | null;
  features: string[] | null; photos: Array<{ url: string }> | null;
  distanceKm?: number | null;
}) {
  const location = v.address
    ? v.address.replace(/,\s*Bangalore$/i, "").replace(/,\s*Bengaluru$/i, "")
    : v.city;
  return {
    id: v.id, make: v.make, model: v.model, year: v.year,
    vehicleType: v.vehicleType, transmission: v.transmission,
    fuelType: v.fuelType, seats: v.seats,
    pricePerDay: formatPrice(v.baseDailyRate, v.currency),
    rawPrice: v.baseDailyRate, currency: v.currency, city: v.city,
    location,
    ...(v.distanceKm != null && { distanceKm: Math.round(v.distanceKm * 10) / 10 }),
    rating: v.ratingAvg ? Number(v.ratingAvg).toFixed(1) : null,
    reviewCount: v.reviewCount ?? 0,
    features: v.features,
    photo: v.photos?.[0]?.url ?? null,
    link: `/vehicles/${v.id}`,
    bookLink: `/vehicles/${v.id}/book`,
  };
}
