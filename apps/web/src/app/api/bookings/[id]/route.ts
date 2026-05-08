import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/services/booking";
import { vehicleService } from "@/services/vehicle";
import { auth } from "@/lib/auth";
import { bearerAuth } from "@/lib/bearer-auth";
import { ApiError, errorResponse } from "@/lib/api-error";
import { bookingActionSchema } from "@vroom/validators";
import { registerEventHandlers } from "@/lib/event-handlers";

registerEventHandlers();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const bearer = session?.user ? null : await bearerAuth(request);
  const currentUser = session?.user ?? bearer;

  if (!currentUser?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  const { id } = await params;

  try {
    const booking = await bookingService.getById(id);
    if (!booking) {
      return errorResponse(
        new ApiError(404, "NOT_FOUND", "Booking not found")
      );
    }

    if (
      booking.renterId !== currentUser.id &&
      booking.hostId !== currentUser.id &&
      currentUser.role !== "admin"
    ) {
      return errorResponse(new ApiError(403, "FORBIDDEN", "Forbidden"));
    }

    const vehicle = await vehicleService.getById(booking.vehicleId);
    return NextResponse.json({
      ...booking,
      vehicleName: vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown Vehicle",
      vehiclePhoto: (vehicle?.photos as Array<{ url: string }> | null)?.[0]?.url ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const bearer = session?.user ? null : await bearerAuth(request);
  const currentUser = session?.user ?? bearer;

  if (!currentUser?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = bookingActionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const booking = await bookingService.getById(id);
    if (!booking) {
      return errorResponse(
        new ApiError(404, "NOT_FOUND", "Booking not found")
      );
    }

    const isRenter = booking.renterId === currentUser.id;
    const isHost = booking.hostId === currentUser.id;
    const isAdmin = currentUser.role === "admin";

    if (!isRenter && !isHost && !isAdmin) {
      return errorResponse(new ApiError(403, "FORBIDDEN", "Forbidden"));
    }

    switch (parsed.data.action) {
      case "cancel": {
        const reason = parsed.data.reason ?? "Cancelled by user";
        const updated = await bookingService.cancel(
          id,
          currentUser.id,
          reason
        );
        return NextResponse.json(updated);
      }
      case "accept": {
        if (!isHost && !isAdmin) {
          return errorResponse(
            new ApiError(403, "FORBIDDEN", "Only the host can accept bookings")
          );
        }
        const updated = await bookingService.accept(id, currentUser.id);
        return NextResponse.json(updated);
      }
      case "reject": {
        if (!isHost && !isAdmin) {
          return errorResponse(
            new ApiError(403, "FORBIDDEN", "Only the host can reject bookings")
          );
        }
        const reason = parsed.data.reason ?? "Rejected by host";
        const updated = await bookingService.reject(
          id,
          currentUser.id,
          reason
        );
        return NextResponse.json(updated);
      }
      default:
        return errorResponse(
          new ApiError(400, "INVALID_ACTION", "Unknown action")
        );
    }
  } catch (error) {
    return errorResponse(error);
  }
}
