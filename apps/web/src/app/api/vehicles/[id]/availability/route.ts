import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/services/booking";
import { errorResponse, ApiError } from "@/lib/api-error";
import { z } from "zod";

const schema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vehicleId } = await params;
    const { searchParams } = new URL(request.url);

    const parsed = schema.safeParse({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    if (!parsed.success) {
      return errorResponse(new ApiError(400, "VALIDATION_ERROR", "startDate and endDate are required (ISO 8601)"));
    }

    const startDate = new Date(parsed.data.startDate);
    const endDate = new Date(parsed.data.endDate);

    if (endDate <= startDate) {
      return errorResponse(new ApiError(400, "VALIDATION_ERROR", "endDate must be after startDate"));
    }

    const isBooked = await bookingService.hasOverlappingBooking(vehicleId, startDate, endDate);

    return NextResponse.json({ available: !isBooked });
  } catch (error) {
    return errorResponse(error);
  }
}
