import { NextRequest, NextResponse } from "next/server";
import { createVehicleSchema } from "@vroom/validators";
import { vehicleService } from "@/services/vehicle";
import { auth } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }
  if (session.user.role !== "host" && session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Only hosts can create vehicles"));
  }

  try {
    const body = await request.json();
    const parsed = createVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const vehicle = await vehicleService.create(parsed.data, session.user.id);
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
