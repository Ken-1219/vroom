import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { bookingService } from "@/services/booking";
import { vehicleService } from "@/services/vehicle";
import { tripService } from "@/services/trip";
import { formatPrice } from "@/lib/format";
import { BookingRequestActions } from "@/components/dashboard/booking-request-actions";
import { StartTripButton } from "@/components/start-trip-button";

export default async function HostBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [bookings, vehicles] = await Promise.all([
    bookingService.getByHost(session.user.id),
    vehicleService.getByHost(session.user.id),
  ]);

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

  const pending = bookings.filter((b) => b.status === "pending");
  const active = bookings.filter((b) => b.status === "confirmed" || b.status === "active");
  const past = bookings.filter((b) => b.status === "cancelled" || b.status === "completed");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Booking Requests</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          {bookings.length} total booking{bookings.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            Pending
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          </h2>
          <div className="space-y-4">
            {pending.map((b) => {
              const vehicle = vehicleMap.get(b.vehicleId);
              return (
                <div
                  key={b.id}
                  className="bg-white border border-amber-200 rounded-xl p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <p className="text-sm font-semibold text-[#1A1A1A]">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"}
                        </p>
                      </div>
                      <div className="text-sm text-[#6B6B6B] space-y-0.5">
                        <p>
                          {new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {" - "}
                          {new Date(b.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        {b.pickupAddress && (
                          <p className="text-xs text-[#999]">Pickup: {b.pickupAddress}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#1A1A1A]">
                          {formatPrice(b.totalAmount, b.currency)}
                        </p>
                        <p className="text-xs text-[#999]">
                          Booked {new Date(b.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <BookingRequestActions bookingId={b.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Active Bookings */}
      {active.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            Active
            <span className="text-xs font-medium text-[#FF4D00] bg-[#FFF1EB] px-2 py-0.5 rounded-full">
              {active.length}
            </span>
          </h2>
          <div className="space-y-4">
            {active.map((b) => {
              const vehicle = vehicleMap.get(b.vehicleId);
              return (
                <div key={b.id} className="bg-white border border-[#E8E6E1] rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.status === "active" ? "bg-blue-100 text-blue-700" : "bg-[#FFF1EB] text-[#FF4D00]"}`}>
                        {b.status === "active" ? "Trip in progress" : "Confirmed"}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"}
                        </p>
                        <p className="text-xs text-[#6B6B6B]">
                          {new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {" - "}
                          {new Date(b.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-[#1A1A1A]">
                        {formatPrice(b.totalAmount, b.currency)}
                      </p>
                      {b.status === "confirmed" && (
                        <StartTripButton bookingId={b.id} />
                      )}
                      {b.status === "active" && (
                        <Link
                          href={`/bookings/${b.id}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          View Trip
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Past Bookings */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Past</h2>
          <div className="space-y-3">
            {past.map((b) => {
              const vehicle = vehicleMap.get(b.vehicleId);
              return (
                <BookingRow key={b.id} booking={b} vehicle={vehicle} status={b.status} />
              );
            })}
          </div>
        </section>
      )}

      {bookings.length === 0 && (
        <div className="bg-white border border-dashed border-[#E8E6E1] rounded-xl p-16 text-center">
          <svg className="w-16 h-16 text-[#999] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <h2 className="text-lg font-medium text-[#1A1A1A] mb-2">
            No bookings yet
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            Booking requests from renters will appear here
          </p>
        </div>
      )}
    </div>
  );
}

function BookingRow({
  booking,
  vehicle,
  status,
}: {
  booking: { id: string; startDate: Date; endDate: Date; totalAmount: number; currency: string; createdAt: Date | null };
  vehicle?: { make: string; model: string } | null;
  status: string;
}) {
  const statusStyles: Record<string, string> = {
    confirmed: "bg-[#FFF1EB] text-[#FF4D00]",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-[#F0EFEC] text-[#6B6B6B]",
  };

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-lg px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[status] ?? statusStyles.cancelled}`}>
          {status}
        </span>
        <div>
          <p className="text-sm font-medium text-[#1A1A1A]">
            {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"}
          </p>
          <p className="text-xs text-[#6B6B6B]">
            {new Date(booking.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {" - "}
            {new Date(booking.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>
      <p className="text-sm font-semibold text-[#1A1A1A]">
        {formatPrice(booking.totalAmount, booking.currency)}
      </p>
    </div>
  );
}
