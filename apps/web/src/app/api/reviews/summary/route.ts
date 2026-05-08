import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { reviewService } from "@/services/review";

export async function GET(request: NextRequest) {
  const vehicleId = request.nextUrl.searchParams.get("vehicleId");
  if (!vehicleId) {
    return NextResponse.json({ error: "Missing vehicleId" }, { status: 400 });
  }

  try {
    const { reviews, total, avgRating } = await reviewService.getByVehicle(vehicleId, 30, 0);

    if (total < 3) {
      return NextResponse.json({ summary: null });
    }

    const reviewTexts = reviews
      .filter((r) => r.text && r.text.trim().length > 10)
      .slice(0, 20)
      .map((r) => `[${r.rating}/5] ${r.text}`)
      .join("\n");

    if (!reviewTexts) {
      return NextResponse.json({ summary: null });
    }

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `You are summarizing customer reviews for a self-drive car rental listing.

Average rating: ${avgRating?.toFixed(1) ?? "N/A"}/5 across ${total} reviews.

Reviews:
${reviewTexts}

Write a 2-3 sentence neutral summary that captures: what renters love most, any consistent complaints, and overall sentiment. Be specific and honest. Do NOT use bullet points or headers. Write in plain prose.`,
      maxOutputTokens: 150,
    });

    return NextResponse.json({ summary: text.trim() });
  } catch (err) {
    console.error("[review-summary]", err);
    return NextResponse.json({ summary: null });
  }
}
