import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { getCachedAiResponse, setCachedAiResponse, makeCacheKey } from "@/lib/ai-cache";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const EV_RANGES: Record<string, number> = {
  "tata nexon ev": 312,
  "tata tigor ev": 306,
  "tata tiago ev": 315,
  "mg zs ev": 461,
  "hyundai kona electric": 452,
  "byd atto 3": 521,
  "kia ev6": 528,
  "mahindra xuv400": 456,
  default: 350,
};

function getHaversineKm(from: string, to: string): number | null {
  const CITIES: Record<string, [number, number]> = {
    bangalore: [12.9716, 77.5946], bengaluru: [12.9716, 77.5946],
    mumbai: [19.076, 72.8777], delhi: [28.6139, 77.209],
    hyderabad: [17.385, 78.4867], chennai: [13.0827, 80.2707],
    pune: [18.5204, 73.8567], goa: [15.2993, 74.124],
    coorg: [12.3375, 75.8069], ooty: [11.4102, 76.695],
    mysore: [12.2958, 76.6394], mysuru: [12.2958, 76.6394],
    hampi: [15.335, 76.462], kodaikanal: [10.2381, 77.4892],
    kolkata: [22.5726, 88.3639], jaipur: [26.9124, 75.7873],
    ahmedabad: [23.0225, 72.5714], kochi: [9.9312, 76.2673],
    chandigarh: [30.7333, 76.7794], manali: [32.2396, 77.1887],
    shimla: [31.1048, 77.1734], pondicherry: [11.9416, 79.8083],
  };

  const fromCoords = CITIES[from.toLowerCase().trim()];
  const toCoords = CITIES[to.toLowerCase().trim()];
  if (!fromCoords || !toCoords) return null;

  const R = 6371;
  const dLat = ((toCoords[0] - fromCoords[0]) * Math.PI) / 180;
  const dLon = ((toCoords[1] - fromCoords[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromCoords[0] * Math.PI) / 180) *
      Math.cos((toCoords[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function POST(request: NextRequest) {
  const { from, to, vehicleName, fuelType } = await request.json();

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const distanceKm = getHaversineKm(from, to);
  const isEV = fuelType === "electric" || fuelType === "ev";

  const modelKey = vehicleName?.toLowerCase() ?? "default";
  const evRange = EV_RANGES[Object.keys(EV_RANGES).find((k) => modelKey.includes(k)) ?? "default"] ?? 350;

  // Check cache first
  const cacheKey = makeCacheKey("range-advisor", {
    from: from.toLowerCase().trim(),
    to: to.toLowerCase().trim(),
    vehicleName: (vehicleName ?? "").toLowerCase().trim(),
    fuelType: (fuelType ?? "petrol").toLowerCase().trim(),
  });
  const cached = await getCachedAiResponse<{ from: string; to: string; distanceKm: number | null; isEV: boolean; evRange: number | null; advice: string }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `You are a helpful Indian road trip advisor for Vroom car rentals.

Trip: ${from} → ${to}
${distanceKm ? `Estimated distance: ~${distanceKm} km` : "Distance unknown"}
Vehicle: ${vehicleName ?? "Unknown"} (${fuelType ?? "petrol"})
${isEV ? `EV range on full charge: ~${evRange} km` : ""}

Give practical, concise advice in 3-4 bullet points covering:
${isEV ? "- Will this EV complete the trip on one charge? Charging stops needed?\n- Charging stations en route (mention Tata Power, ATHER Grid, BPCL EV chargers)" : "- Fuel stops needed? Approximate fuel cost at ₹100/litre"}
- Route highlights or road quality tips
- Estimated drive time
- Any important precautions (ghat roads, tolls, permits if applicable)

Format: bullet points only, no headings, keep it practical for an Indian driver.`,
      maxOutputTokens: 350,
    });

    const result = {
      from,
      to,
      distanceKm,
      isEV,
      evRange: isEV ? evRange : null,
      advice: text.trim(),
    };

    // Cache the result for 24 hours
    await setCachedAiResponse(cacheKey, result, 86400);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[range-advisor]", err);
    return NextResponse.json({
      from,
      to,
      distanceKm,
      isEV,
      evRange: isEV ? evRange : null,
      advice: "Our trip advisor is temporarily unavailable. Please try again in a few minutes.",
    });
  }
}
