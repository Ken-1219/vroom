import { NextRequest, NextResponse } from "next/server";
import { vehicleService } from "@/services/vehicle";
import { auth } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api-error";
import { updateVehicleSchema } from "@vroom/validators";
import { z } from "zod";

const vehicleStatusSchema = z.object({
  status: z.enum(["listed", "delisted", "draft"]),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const vehicle = await vehicleService.getById(id);
    if (!vehicle) {
      return errorResponse(new ApiError(404, "NOT_FOUND", "Vehicle not found"));
    }
    return NextResponse.json(vehicle);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const vehicle = await vehicleService.update(id, session.user.id, parsed.data);
    return NextResponse.json(vehicle);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = vehicleStatusSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const vehicle = await vehicleService.updateStatus(id, session.user.id, parsed.data.status);
    return NextResponse.json(vehicle);
  } catch (error) {
    return errorResponse(error);
  }
}
