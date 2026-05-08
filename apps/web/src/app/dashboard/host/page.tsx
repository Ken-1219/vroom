import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { vehicleService } from "@/services/vehicle";
import { bookingService } from "@/services/booking";
import { formatPrice } from "@/lib/format";

export default async function HostDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [stats, recentBookings, vehicles] = await Promise.all([
    vehicleService.getHostStats(session.user.id),
    bookingService.getByHost(session.user.id),
    vehicleService.getByHost(session.user.id),
  ]);

  const pendingBookings = recentBookings.filter((b) => b.status === "pending");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Host Dashboard</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Welcome back, {session.user.name}
          </p>
        </div>
        <Link
          href="/dashboard/host/vehicles/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Vehicle
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Vehicles"
          value={String(stats.vehicles.total)}
          sub={`${stats.vehicles.listed} listed`}
          color="brand"
        />
        <StatCard
          label="Total Bookings"
          value={String(stats.bookings.total)}
          sub={`${stats.bookings.pending} pending`}
          color="blue"
        />
        <StatCard
          label="Active Bookings"
          value={String(stats.bookings.confirmed)}
          sub="confirmed"
          color="amber"
        />
        <StatCard
          label="Total Revenue"
          value={formatPrice(stats.bookings.totalRevenue, "INR")}
          sub="all time"
          color="purple"
        />
      </div>

      {/* Pending Booking Requests */}
      {pendingBookings.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              Pending Requests ({pendingBookings.length})
            </h2>
            <Link
              href="/dashboard/host/bookings"
              className="text-sm text-[#FF4D00] hover:text-[#E64500] font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {pendingBookings.slice(0, 5).map((b) => {
              const vehicle = vehicles.find((v) => v.id === b.vehicleId);
              return (
                <div
                  key={b.id}
                  className="bg-white border border-[#E8E6E1] rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"}
                    </p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      {new Date(b.startDate).toLocaleDateString()} -{" "}
                      {new Date(b.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1A1A1A]">
                      {formatPrice(b.totalAmount, b.currency)}
                    </span>
                    <Link
                      href="/dashboard/host/bookings"
                      className="text-xs font-medium text-[#FF4D00] hover:text-[#E64500] bg-[#FFF1EB] px-3 py-1.5 rounded-md"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Vehicle Summary */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Your Vehicles</h2>
          <Link
            href="/dashboard/host/vehicles"
            className="text-sm text-[#FF4D00] hover:text-[#E64500] font-medium"
          >
            Manage all
          </Link>
        </div>
        {vehicles.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E8E6E1] rounded-xl p-12 text-center">
            <svg className="w-12 h-12 text-[#999] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <h3 className="text-base font-medium text-[#1A1A1A] mb-1">No vehicles yet</h3>
            <p className="text-sm text-[#6B6B6B] mb-4">
              List your first car and start earning
            </p>
            <Link
              href="/dashboard/host/vehicles/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF4D00] hover:bg-[#E64500] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Add Your First Vehicle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.slice(0, 6).map((v) => {
              const photo = (v.photos ?? []).find((p) => p.isPrimary) ?? (v.photos ?? [])[0];
              return (
                <Link
                  key={v.id}
                  href={`/dashboard/host/vehicles/${v.id}/edit`}
                  className="bg-white border border-[#E8E6E1] rounded-lg overflow-hidden hover:border-[#FF4D00]/30 hover:shadow-md transition-all group"
                >
                  <div className="aspect-[16/10] bg-[#F0EFEC] overflow-hidden">
                    {photo ? (
                      <img
                        src={photo.url}
                        alt={`${v.make} ${v.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#999]">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#1A1A1A]">
                        {v.make} {v.model}
                      </p>
                      <StatusBadge status={v.status ?? "draft"} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[#6B6B6B]">{v.city}</span>
                      <span className="text-xs font-medium text-[#FF4D00]">
                        {formatPrice(v.baseDailyRate, v.currency)}/day
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "brand" | "blue" | "amber" | "purple";
}) {
  const bgMap = {
    brand: "bg-[#FFF1EB]",
    blue: "bg-blue-50",
    amber: "bg-amber-50",
    purple: "bg-purple-50",
  };
  const textMap = {
    brand: "text-[#FF4D00]",
    blue: "text-blue-600",
    amber: "text-amber-600",
    purple: "text-purple-600",
  };

  return (
    <div className={`${bgMap[color]} rounded-xl p-5`}>
      <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-bold ${textMap[color]} mt-1`}>{value}</p>
      <p className="text-xs text-[#6B6B6B] mt-0.5">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    listed: "bg-[#FFF1EB] text-[#FF4D00]",
    draft: "bg-[#F0EFEC] text-[#6B6B6B]",
    delisted: "bg-red-100 text-red-700",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}
