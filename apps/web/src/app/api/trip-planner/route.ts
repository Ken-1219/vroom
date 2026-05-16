import { NextRequest } from "next/server";
import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { vehicleService } from "@/services/vehicle";
import { formatPrice } from "@/lib/format";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { prompt, city } = await request.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response("Missing prompt", { status: 400 });
    }

    // Fetch available vehicles for the city (if provided)
    let vehicleContext = "";
    try {
      const result = await vehicleService.search({
        city: city || undefined,
        page: 1,
        limit: 8,
        sortBy: "rating",
        country: "IN",
        radiusKm: 50,
      });
      if (result.vehicles.length > 0) {
        vehicleContext = "\n\nAvailable vehicles on Vroom:\n";
        for (const v of result.vehicles) {
          vehicleContext += `- ${v.make} ${v.model} ${v.year} (${v.vehicleType}, ${v.transmission}, ${v.fuelType}): ${formatPrice(v.baseDailyRate, v.currency)}/day, rated ${v.ratingAvg ?? "N/A"}/5 — [View](/vehicles/${v.id})\n`;
        }
      }
    } catch {
      // Non-critical — proceed without vehicle data
    }

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are Vroom Trip Planner, an AI assistant that creates personalized self-drive road trip plans for India.

When the user describes a trip, respond with:
1. **Best Vehicle Pick** — recommend the ideal vehicle type and why (seats, trunk, fuel for long drives, etc.)
2. **Day-by-Day Itinerary** — concise daily plan with driving distances and key stops
3. **Cost Estimate** — breakdown: rental cost (days × daily rate), fuel estimate, tolls, total
4. **Tips** — 2-3 practical tips specific to the route (best time to leave, highway vs scenic, etc.)

Keep it conversational, helpful, and specific to Indian roads/conditions. Use markdown formatting.
${vehicleContext}`,
      prompt,
      maxOutputTokens: 800,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[trip-planner]", err);
    return new Response("Failed to generate plan", { status: 500 });
  }
}
