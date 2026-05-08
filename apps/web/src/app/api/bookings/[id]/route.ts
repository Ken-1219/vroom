import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/services/booking";
import { vehicleService } from "@/services/vehicle";
import { auth } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api-error";
import { bookingActionSchema } from "@vroom/validators";
import { registerEventHandlers } from "@/lib/event-handlers";

registerEventHandlers();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
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
      booking.renterId !== session.user.id &&
      booking.hostId !== session.user.id &&
      session.user.role !== "admin"
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
  if (!session?.user?.id) {
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

    const isRenter = booking.renterId === session.user.id;
    const isHost = booking.hostId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isRenter && !isHost && !isAdmin) {
      return errorResponse(new ApiError(403, "FORBIDDEN", "Forbidden"));
    }

    switch (parsed.data.action) {
      case "cancel": {
        const reason = parsed.data.reason ?? "Cancelled by user";
        const updated = await bookingService.cancel(
          id,
          session.user.id,
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
        const updated = await bookingService.accept(id, session.user.id);
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
          session.user.id,
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
