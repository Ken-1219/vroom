import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { tripService } from "@/services/trip";
import { bookingService } from "@/services/booking";
import { vehicleService } from "@/services/vehicle";
import { Nav } from "@/components/nav";
import { TripTimeline } from "@/components/trip-timeline";
import { CompleteTripForm } from "./complete-trip-form";

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
  active: { bg: "bg-blue-100", text: "text-blue-800", label: "Active" },
  completed: { bg: "bg-[#FFF1EB]", text: "text-[#E64500]", label: "Completed" },
};

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const trip = await tripService.getById(id);
  if (!trip) notFound();

  const booking = await bookingService.getById(trip.bookingId);
  if (!booking) notFound();

  if (
    booking.renterId !== session.user.id &&
    booking.hostId !== session.user.id &&
    session.user.role !== "admin"
  ) {
    notFound();
  }

  const vehicle = await vehicleService.getById(booking.vehicleId);
  const isHost = booking.hostId === session.user.id;

  const status = statusStyles[trip.status ?? "pending"] ?? statusStyles.pending!;

  const timelineEvents = [];
  if (trip.actualStart) {
    timelineEvents.push({
      label: "Trip started",
      time: trip.actualStart.toISOString(),
      icon: "start" as const,
    });
  }
  if (trip.status === "active") {
    timelineEvents.push({
      label: "Trip in progress",
      time: null,
      icon: "active" as const,
    });
  }
  if (trip.actualEnd) {
    timelineEvents.push({
      label: "Trip completed",
      time: trip.actualEnd.toISOString(),
      icon: "end" as const,
    });
  }

  const kmDriven =
    trip.startOdometer != null && trip.endOdometer != null
      ? trip.endOdometer - trip.startOdometer
      : null;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href={`/bookings/${trip.bookingId}`}
          className="inline-flex items-center gap-1 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors mb-6"
        >
          &larr; Back to booking
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Trip Details</h1>
            {vehicle && (
              <p className="text-sm text-[#6B6B6B] mt-1">
                {vehicle.make} {vehicle.model} · {vehicle.year}
              </p>
            )}
          </div>
          <span
            className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-full ${status.bg} ${status.text}`}
          >
            {status.label}
          </span>
        </div>

        {/* Timeline */}
        {timelineEvents.length > 0 && (
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">Timeline</h3>
            <TripTimeline events={timelineEvents} />
          </div>
        )}

        {/* Trip Data */}
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">Trip Data</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-[#999]">Start Odometer</p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {trip.startOdometer != null ? `${trip.startOdometer.toLocaleString()} km` : "--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#999]">End Odometer</p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {trip.endOdometer != null ? `${trip.endOdometer.toLocaleString()} km` : "--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#999]">Distance Driven</p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {kmDriven != null ? `${kmDriven.toLocaleString()} km` : "--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#999]">Fuel</p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {trip.startFuelLevel != null
                  ? `${Math.round(Number(trip.startFuelLevel) * 100)}%`
                  : "--"}
                {trip.endFuelLevel != null
                  ? ` → ${Math.round(Number(trip.endFuelLevel) * 100)}%`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Complete Trip Form (host only, active trip) */}
        {isHost && trip.status === "active" && (
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">
              Complete Trip
            </h3>
            <CompleteTripForm tripId={trip.id} />
          </div>
        )}
      </main>
    </div>
  );
}
