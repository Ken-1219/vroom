import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { bookingService } from "@/services/booking";
import { vehicleService } from "@/services/vehicle";
import { reviewService } from "@/services/review";
import { Nav } from "@/components/nav";
import { ReviewForm } from "@/components/review-form";
import { resolveUserId } from "@/lib/resolve-user-id";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const booking = await bookingService.getById(id);
  if (!booking) notFound();

  const userId = await resolveUserId(session.user.id, session.user.email);

  if (booking.renterId !== userId && booking.hostId !== userId) {
    notFound();
  }

  if (booking.status !== "completed") {
    redirect(`/bookings/${id}`);
  }

  const alreadyReviewed = await reviewService.hasReviewed(id, userId);
  if (alreadyReviewed) {
    redirect(`/bookings/${id}`);
  }

  const vehicle = await vehicleService.getById(booking.vehicleId);
  const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle";
  const photos = vehicle ? (vehicle.photos ?? []) : [];
  const primaryPhoto = photos.find((p) => p.isPrimary) ?? photos[0] ?? null;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href={`/bookings/${id}`}
          className="inline-flex items-center gap-1 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors mb-6"
        >
          &larr; Back to booking
        </Link>

        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Leave a Review</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">
          Share your experience to help other renters
        </p>

        {/* Vehicle preview */}
        <div className="flex items-center gap-4 bg-white border border-[#E8E6E1] rounded-xl p-4 mb-8">
          <div className="w-20 h-14 rounded-lg bg-[#E8E6E1] overflow-hidden flex-shrink-0">
            {primaryPhoto ? (
              <img
                src={primaryPhoto.url}
                alt={vehicleName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#999] text-xs">
                No photo
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-[#1A1A1A]">{vehicleName}</p>
            <p className="text-xs text-[#6B6B6B]">
              {vehicle?.year}
              {vehicle?.variant ? ` · ${vehicle.variant}` : ""}
            </p>
          </div>
        </div>

        <ReviewForm
          bookingId={id}
          vehicleId={booking.vehicleId}
          vehicleName={vehicleName}
        />
      </main>
    </div>
  );
}
