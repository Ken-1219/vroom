import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reviewService } from "@/services/review";
import { bookingService } from "@/services/booking";
import { createReviewSchema } from "@vroom/validators";
import { ApiError, errorResponse } from "@/lib/api-error";
import { resolveUserId } from "@/lib/resolve-user-id";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const body = await request.json();
    const input = createReviewSchema.parse(body);

    const booking = await bookingService.getById(input.bookingId);
    if (!booking) {
      return errorResponse(new ApiError(404, "NOT_FOUND", "Booking not found"));
    }

    if (booking.status !== "completed") {
      return errorResponse(
        new ApiError(400, "INVALID_STATE", "Can only review completed bookings")
      );
    }

    const userId = await resolveUserId(session.user.id, session.user.email);

    const isRenter = booking.renterId === userId;
    const isHost = booking.hostId === userId;
    if (!isRenter && !isHost) {
      return errorResponse(new ApiError(403, "FORBIDDEN", "Not part of this booking"));
    }

    const alreadyReviewed = await reviewService.hasReviewed(input.bookingId, userId);
    if (alreadyReviewed) {
      return errorResponse(
        new ApiError(409, "ALREADY_REVIEWED", "You have already reviewed this booking")
      );
    }

    const review = await reviewService.create(input, userId);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const vehicleId = searchParams.get("vehicleId");
  const bookingId = searchParams.get("bookingId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0);

  try {
    if (vehicleId) {
      const data = await reviewService.getByVehicle(vehicleId, limit, offset);
      return NextResponse.json(data);
    }

    if (bookingId) {
      const reviews = await reviewService.getByBooking(bookingId);
      return NextResponse.json({ reviews });
    }

    return errorResponse(
      new ApiError(400, "BAD_REQUEST", "vehicleId or bookingId required")
    );
  } catch (error) {
    return errorResponse(error);
  }
}
