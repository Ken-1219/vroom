import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

const filtersSchema = z.object({
  city: z.string().optional(),
  vehicleType: z.enum(["sedan", "suv", "hatchback", "luxury", "ev", "mpv"]).optional(),
  transmission: z.enum(["manual", "automatic"]).optional(),
  maxPrice: z.number().optional(),
  sortBy: z.enum(["relevance", "price", "rating"]).optional(),
  query: z.string().optional(),
  explanation: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const result = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: filtersSchema,
      prompt: `You are a car rental search assistant for Vroom — an Indian self-drive car rental app.

Parse the user's natural language search query into structured filters.

User query: "${query}"

Rules:
- city: extract Indian city names (bangalore, mumbai, delhi, pune, hyderabad, chennai, kolkata, etc.)
- vehicleType: sedan/suv/hatchback/luxury/ev/mpv
- transmission: manual/automatic
- maxPrice: price in PAISE (₹1 = 100 paise, so ₹3000/day = 300000 paise). Extract from "under ₹3000", "below 2k", "cheap", "budget" (budget = under ₹150000), etc.
- sortBy: "price" if user wants cheapest, "rating" if user wants best rated
- query: any remaining text (make/model names, fuel type, etc.) that doesn't fit above
- explanation: a 1-line friendly confirmation like "Showing automatic SUVs in Mumbai under ₹3,000/day"

Only set fields that are clearly mentioned. Leave others as undefined.`,
    });

    return NextResponse.json(result.object);
  } catch (err) {
    console.error("[nl-search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
