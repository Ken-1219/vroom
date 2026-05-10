import { NextRequest, NextResponse } from "next/server";
import { vehicleService } from "@/services/vehicle";
import { pricingService } from "@/services/pricing";
import { ApiError, errorResponse } from "@/lib/api-error";
import { z } from "zod";

const estimateSchema = z.object({
  vehicleId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  protectionPlan: z.enum(["basic", "standard", "premium"]).default("basic"),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(new ApiError(400, "VALIDATION_ERROR", "Request body is missing or not valid JSON"));
    }
    const parsed = estimateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const vehicle = await vehicleService.getById(parsed.data.vehicleId);
    if (!vehicle) {
      return errorResponse(new ApiError(404, "NOT_FOUND", "Vehicle not found"));
    }

    const breakdown = pricingService.calculateEstimate({
      vehicle,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      protectionPlan: parsed.data.protectionPlan,
    });

    return NextResponse.json(breakdown);
  } catch (error) {
    return errorResponse(error);
  }
}
