import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { getCachedAiResponse, setCachedAiResponse, makeCacheKey } from "@/lib/ai-cache";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Check cache first
    const cacheKey = makeCacheKey("nl-search", { query: query.trim().toLowerCase() });
    const cached = await getCachedAiResponse<Record<string, unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `You are a car rental search assistant for Vroom — an Indian self-drive car rental app.

Parse the user's natural language search query into structured filters. Respond ONLY with valid JSON, no extra text.

User query: "${query}"

Return a JSON object with these optional fields:
- "city": Indian city name (bangalore, mumbai, delhi, pune, hyderabad, chennai, kolkata, goa, etc.)
- "vehicleType": one of "sedan", "suv", "hatchback", "luxury", "ev", "mpv"
- "transmission": "manual" or "automatic"
- "maxPrice": number in PAISE (₹1 = 100 paise, so ₹3000/day = 300000). Extract from "under ₹3000", "below 2k", "cheap"/"budget" = 150000
- "sortBy": "price" if user wants cheapest, "rating" if user wants best rated
- "query": remaining text like make/model names
- "explanation": a 1-line confirmation like "Showing automatic SUVs in Mumbai under ₹3,000/day"

Only include fields that are clearly mentioned. Example response:
{"vehicleType":"sedan","maxPrice":150000,"sortBy":"price","explanation":"Showing budget sedans sorted by price"}`,
      maxOutputTokens: 200,
    });

    // Extract JSON from the response (strip any markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Cache the result for 1 hour
    await setCachedAiResponse(cacheKey, parsed, 3600);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[nl-search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
