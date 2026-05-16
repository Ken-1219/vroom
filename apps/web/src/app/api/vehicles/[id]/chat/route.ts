import { NextRequest } from "next/server";
import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { vehicleService } from "@/services/vehicle";
import { formatPrice } from "@/lib/format";
import { auth } from "@/lib/auth";

function estimatedMileage(tripCount: number): string {
  const km = tripCount * 145; // avg ~145km per trip
  if (km < 1000) return `${km} km`;
  return `${(km / 1000).toFixed(1)}k km`;
}

function conditionLabel(tripCount: number, year: number): string {
  const age = new Date().getFullYear() - year;
  if (tripCount < 10 && age <= 1) return "Like new";
  if (tripCount < 30 && age <= 2) return "Excellent";
  if (tripCount < 60 && age <= 4) return "Good";
  if (tripCount < 100 && age <= 6) return "Fair";
  return "Regular";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const { messages } = await request.json();

    const vehicle = await vehicleService.getById(id);
    if (!vehicle) {
      return new Response("Vehicle not found", { status: 404 });
    }

    const features = (vehicle.features ?? []) as string[];
    const rules = (vehicle.rules ?? {}) as Record<string, unknown>;
    const trips = vehicle.tripCount ?? 0;
    const year = vehicle.year;
    const estMileage = estimatedMileage(trips);
    const condition = conditionLabel(trips, year);
    const age = new Date().getFullYear() - year;

    const systemPrompt = `You are the AI assistant for a specific rental car listed on Vroom.

## Vehicle Details
- **Car**: ${vehicle.make} ${vehicle.model} ${year}${vehicle.variant ? ` (${vehicle.variant})` : ""}
- **Type**: ${vehicle.vehicleType}, ${vehicle.transmission}, ${vehicle.fuelType}
- **Seats**: ${vehicle.seats}
- **Color**: ${vehicle.color ?? "Not specified"}
- **Location**: ${vehicle.address ?? vehicle.city}
- **Price**: ${formatPrice(vehicle.baseDailyRate, vehicle.currency)}/day${vehicle.weekendRate ? ` (weekends: ${formatPrice(vehicle.weekendRate, vehicle.currency)}/day)` : ""}

## Condition & Usage
- **Age**: ${age} year${age !== 1 ? "s" : ""} old (${year})
- **Trips completed**: ${trips} trip${trips !== 1 ? "s" : ""} on Vroom
- **Estimated mileage**: ~${estMileage} based on trip history
- **Condition rating**: ${condition}

## Features
${features.length > 0 ? features.map((f) => `- ${f.replace(/_/g, " ")}`).join("\n") : "- Standard features"}

## Rules
${rules.mileageLimit ? `- Daily km limit: ${rules.mileageLimit} km` : "- No mileage limit specified"}
${rules.noSmoking ? "- No smoking inside the car" : ""}
${rules.noPets ? "- No pets allowed" : ""}
${Object.keys(rules).length === 0 ? "- No special rules" : ""}

## Your role
Answer questions about this car honestly and helpfully. Common questions:
- Condition, wear, expected issues for cars of this age/mileage
- Features explanation (what they do, how to use them)
- Fuel type guidance (petrol/diesel/EV charging)
- Daily km limit, late return policy
- Insurance and what it covers
- Pickup process, OTP verification
- Whether this car is good for specific trip types (highway, city, hills)

Be concise. If you don't know something specific, say so rather than guessing. Keep responses under 4 sentences unless a detailed explanation is needed.`;

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages,
      maxOutputTokens: 300,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[vehicle-chat]", err);
    return new Response("Chat failed", { status: 500 });
  }
}
