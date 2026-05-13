import { NextRequest, NextResponse } from "next/server";
import { availabilityService } from "@/services/availability";
import { auth } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api-error";
import { setAvailabilitySchema } from "@vroom/validators";
import { z } from "zod";

const deleteSchema = z.object({
  availabilityId: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vehicleId } = await params;
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    // If startDate and endDate provided, also return an availability check
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return errorResponse(
          new ApiError(400, "VALIDATION_ERROR", "endDate must be after startDate")
        );
      }
      const isAvailable = await availabilityService.isAvailable(vehicleId, start, end);
      const blocks = await availabilityService.getByVehicle(vehicleId, startDate, endDate);
      return NextResponse.json({ available: isAvailable, blocks });
    }

    const blocks = await availabilityService.getByVehicle(vehicleId, startDate, endDate);
    return NextResponse.json({ blocks });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  if (session.user.role !== "host" && session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Only hosts can block availability"));
  }

  const { id: vehicleId } = await params;

  try {
    const body = await request.json();
    const parsed = setAvailabilitySchema.safeParse({ ...body, vehicleId });
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const startDate = new Date(parsed.data.startDate).toISOString().split("T")[0]!;
    const endDate = new Date(parsed.data.endDate).toISOString().split("T")[0]!;

    const block = await availabilityService.setBlocked(
      vehicleId,
      session.user.id,
      startDate,
      endDate,
      parsed.data.type,
      parsed.data.reason
    );

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  if (session.user.role !== "host" && session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Only hosts can remove availability blocks"));
  }

  // vehicleId from URL params is not needed for delete, but we validate the body
  await params;

  try {
    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    await availabilityService.removeBlocked(parsed.data.availabilityId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
