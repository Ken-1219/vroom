import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { bookingService } from "@/services/booking";
import { formatPrice } from "@/lib/format";
import { Nav } from "@/components/nav";
import { MutationListener } from "@/components/mutation-listener";

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-[#FFF1EB] text-[#E64500]",
  cancelled: "bg-red-100 text-red-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-[#F0EFEC] text-[#6B6B6B]",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bookings = await bookingService.getByRenter(session.user.id);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <MutationListener keys={["bookings"]} />
      <Nav />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="bg-white border border-[#E8E6E1] rounded-xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F0EFEC] rounded-full mb-4">
              <svg
                className="w-8 h-8 text-[#999]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
              No bookings yet
            </h3>
            <p className="text-[#6B6B6B] text-sm mb-6">
              Browse vehicles to get started
            </p>
            <Link
              href="/vehicles"
              className="inline-block text-sm font-medium text-white bg-[#FF4D00] hover:bg-[#E64500] px-5 py-2.5 rounded-lg transition-colors"
            >
              Browse Vehicles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block bg-white border border-[#E8E6E1] rounded-xl p-5 hover:border-[#E8E6E1] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyles[booking.status] ?? statusStyles.completed}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B6B6B]">
                      {formatDate(booking.startDate)} &mdash;{" "}
                      {formatDate(booking.endDate)}
                    </p>
                    <p className="text-xs text-[#999] mt-1">
                      ID: {booking.id}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-[#1A1A1A]">
                      {formatPrice(booking.totalAmount, booking.currency)}
                    </p>
                    <p className="text-xs text-[#999] mt-1">Total</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
