#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = (process.env.VROOM_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const API_KEY = process.env.VROOM_API_KEY ?? "";

if (!API_KEY) {
  process.stderr.write("Warning: VROOM_API_KEY is not set. Authenticated tools will fail.\n");
}

async function vroomFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json() as unknown;

  if (!response.ok) {
    const msg = (data as any)?.message ?? (data as any)?.error ?? `HTTP ${response.status}`;
    throw new Error(msg);
  }

  return data;
}

const tools: Tool[] = [
  {
    name: "search_vehicles",
    description:
      "Search for available rental vehicles on Vroom. Filter by city, vehicle type, date range, and price. Returns a list of vehicles with pricing and availability.",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City name (e.g. Mumbai, Bangalore, Delhi, Hyderabad, Pune, Chennai)",
        },
        vehicleType: {
          type: "string",
          enum: ["car", "suv", "luxury", "ev", "bike", "van"],
          description: "Type of vehicle to search for",
        },
        startDate: {
          type: "string",
          description: "Pickup date in YYYY-MM-DD format",
        },
        endDate: {
          type: "string",
          description: "Return date in YYYY-MM-DD format",
        },
        maxPricePerDay: {
          type: "number",
          description: "Maximum daily rental price in rupees",
        },
        limit: {
          type: "number",
          description: "Number of results to return (default 10, max 20)",
        },
      },
    },
  },
  {
    name: "get_vehicle",
    description:
      "Get full details for a specific vehicle including specs, features, pricing tiers, location, and ratings.",
    inputSchema: {
      type: "object",
      properties: {
        vehicleId: {
          type: "string",
          description: "The vehicle UUID from a search_vehicles result",
        },
      },
      required: ["vehicleId"],
    },
  },
  {
    name: "get_price_estimate",
    description:
      "Calculate the exact total price to rent a vehicle for given dates. Returns a full breakdown: base price, platform fee, insurance, taxes, and total.",
    inputSchema: {
      type: "object",
      properties: {
        vehicleId: {
          type: "string",
          description: "The vehicle UUID",
        },
        startDate: {
          type: "string",
          description: "Pickup date in ISO format (YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DD)",
        },
        endDate: {
          type: "string",
          description: "Return date in ISO format",
        },
        protectionPlan: {
          type: "string",
          enum: ["basic", "standard", "premium"],
          description: "Insurance protection plan. basic=free, standard=adds ₹200/day, premium=adds ₹400/day",
        },
      },
      required: ["vehicleId", "startDate", "endDate"],
    },
  },
  {
    name: "create_booking",
    description:
      "Book a vehicle on Vroom. Requires authentication (VROOM_API_KEY). Creates a booking in 'pending' status and returns booking details including total amount.",
    inputSchema: {
      type: "object",
      properties: {
        vehicleId: {
          type: "string",
          description: "The vehicle UUID to book",
        },
        startDate: {
          type: "string",
          description: "Pickup date and time in ISO format",
        },
        endDate: {
          type: "string",
          description: "Return date and time in ISO format",
        },
        pickupAddress: {
          type: "string",
          description: "Pickup location address or description",
        },
        dropoffAddress: {
          type: "string",
          description: "Dropoff location address (can be same as pickup)",
        },
        protectionPlan: {
          type: "string",
          enum: ["basic", "standard", "premium"],
          description: "Insurance protection plan (default: basic)",
        },
        notes: {
          type: "string",
          description: "Special requests or notes for the host",
        },
      },
      required: ["vehicleId", "startDate", "endDate"],
    },
  },
  {
    name: "get_my_bookings",
    description:
      "Get all bookings for the authenticated user. Requires authentication. Returns booking history with status, dates, and vehicle info.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_booking",
    description:
      "Get full details for a specific booking by ID. Requires authentication. Shows status, pricing breakdown, vehicle info, and cancellation options.",
    inputSchema: {
      type: "object",
      properties: {
        bookingId: {
          type: "string",
          description: "The booking UUID",
        },
      },
      required: ["bookingId"],
    },
  },
  {
    name: "cancel_booking",
    description:
      "Cancel an existing booking. Requires authentication. Cancellation fees may apply based on how close to the start date: >48h free, 24-48h 25%, 6-24h 50%, <6h 100%.",
    inputSchema: {
      type: "object",
      properties: {
        bookingId: {
          type: "string",
          description: "The booking UUID to cancel",
        },
        reason: {
          type: "string",
          description: "Reason for cancellation (optional)",
        },
      },
      required: ["bookingId"],
    },
  },
  {
    name: "get_cities",
    description: "Get a list of all cities where Vroom vehicles are available, with vehicle counts.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

const server = new Server(
  { name: "vroom", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case "search_vehicles": {
        const params = new URLSearchParams();
        if (args.city) params.set("city", String(args.city));
        if (args.vehicleType) params.set("vehicleType", String(args.vehicleType));
        if (args.startDate) params.set("startDate", String(args.startDate));
        if (args.endDate) params.set("endDate", String(args.endDate));
        if (args.maxPricePerDay) params.set("maxPrice", String(Number(args.maxPricePerDay) * 100));
        params.set("limit", String(Math.min(Number(args.limit ?? 10), 20)));

        const data = await vroomFetch(`/api/vehicles?${params}`);
        const vehicles = (data as any).vehicles ?? data;
        return {
          content: [
            {
              type: "text",
              text: formatVehicleList(vehicles),
            },
          ],
        };
      }

      case "get_vehicle": {
        const data = await vroomFetch(`/api/vehicles/${args.vehicleId}`);
        return {
          content: [{ type: "text", text: formatVehicleDetail(data) }],
        };
      }

      case "get_price_estimate": {
        const start = normalizeDate(String(args.startDate));
        const end = normalizeDate(String(args.endDate));
        const data = await vroomFetch("/api/pricing/estimate", {
          method: "POST",
          body: JSON.stringify({
            vehicleId: args.vehicleId,
            startDate: start,
            endDate: end,
            protectionPlan: args.protectionPlan ?? "basic",
          }),
        });
        return {
          content: [{ type: "text", text: formatPriceEstimate(data) }],
        };
      }

      case "create_booking": {
        if (!API_KEY) {
          return {
            content: [{ type: "text", text: "Error: VROOM_API_KEY is required to create bookings. Get your token from POST /api/mcp/auth." }],
            isError: true,
          };
        }
        const start = normalizeDate(String(args.startDate));
        const end = normalizeDate(String(args.endDate));
        const data = await vroomFetch("/api/bookings", {
          method: "POST",
          body: JSON.stringify({
            vehicleId: args.vehicleId,
            startDate: start,
            endDate: end,
            pickupAddress: args.pickupAddress ?? "",
            dropoffAddress: args.dropoffAddress ?? args.pickupAddress ?? "",
            protectionPlan: args.protectionPlan ?? "basic",
            notes: args.notes ?? "",
          }),
        });
        return {
          content: [{ type: "text", text: formatBookingCreated(data) }],
        };
      }

      case "get_my_bookings": {
        if (!API_KEY) {
          return {
            content: [{ type: "text", text: "Error: VROOM_API_KEY is required to view bookings." }],
            isError: true,
          };
        }
        const data = await vroomFetch("/api/bookings");
        return {
          content: [{ type: "text", text: formatBookingList(data) }],
        };
      }

      case "get_booking": {
        if (!API_KEY) {
          return {
            content: [{ type: "text", text: "Error: VROOM_API_KEY is required to view booking details." }],
            isError: true,
          };
        }
        const data = await vroomFetch(`/api/bookings/${args.bookingId}`);
        return {
          content: [{ type: "text", text: formatBookingDetail(data) }],
        };
      }

      case "cancel_booking": {
        if (!API_KEY) {
          return {
            content: [{ type: "text", text: "Error: VROOM_API_KEY is required to cancel bookings." }],
            isError: true,
          };
        }
        const data = await vroomFetch(`/api/bookings/${args.bookingId}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "cancel", reason: args.reason ?? "Cancelled via MCP" }),
        });
        const b = data as any;
        return {
          content: [
            {
              type: "text",
              text: `Booking ${b.id} cancelled successfully.\nStatus: ${b.status}\n${b.refundAmount ? `Refund: ₹${Math.round(b.refundAmount / 100).toLocaleString("en-IN")}` : "No refund applicable."}`,
            },
          ],
        };
      }

      case "get_cities": {
        const data = await vroomFetch("/api/cities");
        const cities = data as Array<{ city: string; count: number }>;
        const lines = cities.map((c) => `• ${c.city}: ${c.count} vehicle${c.count === 1 ? "" : "s"}`);
        return {
          content: [
            {
              type: "text",
              text: `Available cities on Vroom:\n\n${lines.join("\n")}`,
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ── Formatters ────────────────────────────────────────────────────────────────

function paise(amount: number) {
  return `₹${Math.round(amount / 100).toLocaleString("en-IN")}`;
}

function normalizeDate(d: string): string {
  if (d.includes("T")) return d;
  return `${d}T00:00:00.000Z`;
}

function formatVehicleList(vehicles: unknown): string {
  const list = Array.isArray(vehicles) ? vehicles : [];
  if (list.length === 0) return "No vehicles found matching your criteria.";

  return (
    `Found ${list.length} vehicle${list.length === 1 ? "" : "s"}:\n\n` +
    list
      .map((v: any, i: number) => {
        const price = v.baseDailyRate ? paise(v.baseDailyRate) : v.pricePerDay ?? "N/A";
        const rating = v.ratingAvg ? `★ ${parseFloat(v.ratingAvg).toFixed(1)}` : "No ratings";
        const trips = v.tripCount ? `(${v.tripCount} trips)` : "";
        return `${i + 1}. ${v.year} ${v.make} ${v.model}
   ID: ${v.id}
   Type: ${v.vehicleType} | City: ${v.city}
   Price: ${price}/day | ${rating} ${trips}`;
      })
      .join("\n\n")
  );
}

function formatVehicleDetail(v: any): string {
  const price = v.baseDailyRate ? paise(v.baseDailyRate) : "N/A";
  const weekend = v.weekendRate ? paise(v.weekendRate) : null;
  const rating = v.ratingAvg ? `★ ${parseFloat(v.ratingAvg).toFixed(1)} (${v.tripCount ?? 0} trips)` : "No ratings yet";
  const features = Array.isArray(v.features) ? v.features.join(", ") : "N/A";

  return [
    `${v.year} ${v.make} ${v.model}`,
    `ID: ${v.id}`,
    ``,
    `Type: ${v.vehicleType} | Fuel: ${v.fuelType ?? "N/A"} | Transmission: ${v.transmission ?? "N/A"}`,
    `Seats: ${v.seats ?? "N/A"} | Color: ${v.color ?? "N/A"}`,
    ``,
    `Price: ${price}/day${weekend ? ` (weekend: ${weekend}/day)` : ""}`,
    `City: ${v.city}${v.address ? ` — ${v.address}` : ""}`,
    `Rating: ${rating}`,
    ``,
    `Features: ${features}`,
    v.description ? `\nDescription: ${v.description}` : "",
    ``,
    `Status: ${v.status}`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

function formatPriceEstimate(e: any): string {
  const lines = [
    `Price Estimate`,
    `═══════════════`,
    `Duration: ${e.days} day${e.days === 1 ? "" : "s"}`,
    ``,
    `Base price:       ${paise(e.baseAmount ?? 0)}`,
  ];

  if (e.weekendSurcharge) lines.push(`Weekend surcharge: ${paise(e.weekendSurcharge)}`);
  if (e.platformFee) lines.push(`Platform fee:      ${paise(e.platformFee)}`);
  if (e.insuranceAmount) lines.push(`Insurance (${e.protectionPlan ?? "basic"}): ${paise(e.insuranceAmount)}`);
  if (e.tax) lines.push(`Taxes (${e.taxRate ?? ""}):       ${paise(e.tax)}`);

  lines.push(``, `Total:             ${paise(e.total ?? 0)}`);
  return lines.join("\n");
}

function formatBookingCreated(b: any): string {
  return [
    `Booking Created Successfully!`,
    `════════════════════════════`,
    `Booking ID: ${b.id}`,
    `Status: ${b.status}`,
    ``,
    `Dates: ${b.startDate} → ${b.endDate}`,
    `Total: ${paise(b.totalAmount ?? 0)}`,
    ``,
    `View your booking at: ${BASE_URL}/bookings/${b.id}`,
  ].join("\n");
}

function formatBookingList(data: unknown): string {
  const list = Array.isArray(data) ? data : [];
  if (list.length === 0) return "You have no bookings yet.";

  return (
    `Your bookings (${list.length}):\n\n` +
    list
      .map((b: any, i: number) => {
        const name = b.vehicleName ?? `Vehicle ${b.vehicleId?.slice(0, 8)}`;
        return `${i + 1}. ${name}
   ID: ${b.id}
   Status: ${b.status} | ${b.startDate} → ${b.endDate}
   Total: ${paise(b.totalAmount ?? 0)}`;
      })
      .join("\n\n")
  );
}

function formatBookingDetail(b: any): string {
  const breakdown = b.priceBreakdown as any;
  const lines = [
    `Booking Details`,
    `═══════════════`,
    `ID: ${b.id}`,
    `Vehicle: ${b.vehicleName ?? b.vehicleId}`,
    `Status: ${b.status}`,
    ``,
    `Pickup:  ${b.startDate}`,
    `Return:  ${b.endDate}`,
    ``,
    `Total: ${paise(b.totalAmount ?? 0)}`,
  ];

  if (breakdown) {
    lines.push(``, `Price breakdown:`);
    if (breakdown.days) lines.push(`  Days: ${breakdown.days}`);
    if (breakdown.baseAmount) lines.push(`  Base: ${paise(breakdown.baseAmount)}`);
    if (breakdown.platformFee) lines.push(`  Fee:  ${paise(breakdown.platformFee)}`);
    if (breakdown.tax) lines.push(`  Tax:  ${paise(breakdown.tax)}`);
  }

  lines.push(``, `View at: ${BASE_URL}/bookings/${b.id}`);
  return lines.join("\n");
}

// ── Start server ──────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
