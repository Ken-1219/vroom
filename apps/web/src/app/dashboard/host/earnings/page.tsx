import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { bookingService } from "@/services/booking";
import { vehicleService } from "@/services/vehicle";
import { formatPrice } from "@/lib/format";

export default async function HostEarningsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [bookings, vehicles] = await Promise.all([
    bookingService.getByHost(session.user.id),
    vehicleService.getByHost(session.user.id),
  ]);

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

  const confirmedOrCompleted = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  );

  const totalRevenue = confirmedOrCompleted.reduce(
    (sum, b) => sum + b.totalAmount,
    0
  );

  const platformFee = Math.round(totalRevenue * 0.18);
  const netEarnings = totalRevenue - platformFee;

  // Earnings per vehicle
  const vehicleEarnings = new Map<string, { revenue: number; trips: number }>();
  for (const b of confirmedOrCompleted) {
    const prev = vehicleEarnings.get(b.vehicleId) ?? { revenue: 0, trips: 0 };
    vehicleEarnings.set(b.vehicleId, {
      revenue: prev.revenue + b.totalAmount,
      trips: prev.trips + 1,
    });
  }

  // Monthly breakdown
  const monthlyMap = new Map<string, number>();
  for (const b of confirmedOrCompleted) {
    const date = new Date(b.createdAt!);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + b.totalAmount);
  }
  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Earnings</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          Revenue overview across all your vehicles
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-[#FFF1EB] rounded-xl p-6">
          <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
            Gross Revenue
          </p>
          <p className="text-3xl font-bold text-[#FF4D00] mt-2">
            {formatPrice(totalRevenue, "INR")}
          </p>
          <p className="text-xs text-[#6B6B6B] mt-1">
            from {confirmedOrCompleted.length} booking{confirmedOrCompleted.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-[#FAFAF8] rounded-xl p-6 border border-[#E8E6E1]">
          <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
            Platform Fee (18%)
          </p>
          <p className="text-3xl font-bold text-[#6B6B6B] mt-2">
            {formatPrice(platformFee, "INR")}
          </p>
          <p className="text-xs text-[#6B6B6B] mt-1">
            service + payment processing
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-6">
          <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
            Net Earnings
          </p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {formatPrice(netEarnings, "INR")}
          </p>
          <p className="text-xs text-[#6B6B6B] mt-1">your payout</p>
        </div>
      </div>

      {/* Per Vehicle Breakdown */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">By Vehicle</h2>
        {vehicleEarnings.size === 0 ? (
          <p className="text-sm text-[#6B6B6B]">No earnings yet</p>
        ) : (
          <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EFEC] bg-[#FAFAF8]/50">
                  <th className="text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">Vehicle</th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">Trips</th>
                  <th className="text-right text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEC]">
                {Array.from(vehicleEarnings.entries())
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([vehicleId, data]) => {
                    const vehicle = vehicleMap.get(vehicleId);
                    return (
                      <tr key={vehicleId} className="hover:bg-[#FAFAF8]/50">
                        <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6B6B6B]">{data.trips}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-[#1A1A1A] text-right">
                          {formatPrice(data.revenue, "INR")}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Monthly Breakdown */}
      {monthlyBreakdown.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Monthly</h2>
          <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EFEC] bg-[#FAFAF8]/50">
                  <th className="text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">Month</th>
                  <th className="text-right text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEC]">
                {monthlyBreakdown.map(([month, revenue]) => (
                  <tr key={month} className="hover:bg-[#FAFAF8]/50">
                    <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                      {new Date(month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#1A1A1A] text-right">
                      {formatPrice(revenue, "INR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
