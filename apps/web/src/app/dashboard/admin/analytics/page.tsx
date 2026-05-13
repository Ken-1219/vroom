import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, payments } from "@vroom/db/schema";
import { count, sum, eq, sql, and, gte } from "drizzle-orm";
import { formatPrice } from "@/lib/format";

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/");
  }

  const revenueByMonth = (await db
    .select({
      month: sql<string>`to_char(${payments.createdAt}, 'YYYY-MM')`,
      total: sum(payments.amount),
      count: count(),
    })
    .from(payments)
    .where(eq(payments.status, "captured"))
    .groupBy(sql`to_char(${payments.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${payments.createdAt}, 'YYYY-MM') DESC`)
    .limit(12)) as { month: string; total: string | null; count: number }[];

  const bookingsByStatus = (await db
    .select({
      status: bookings.status,
      count: count(),
    })
    .from(bookings)
    .groupBy(bookings.status)) as { status: string; count: number }[];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentBookings = (await db
    .select({ count: count() })
    .from(bookings)
    .where(gte(bookings.createdAt, thirtyDaysAgo))) as { count: number }[];

  const recentRevenue = (await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(
      and(
        eq(payments.status, "captured"),
        gte(payments.createdAt, thirtyDaysAgo)
      )
    )) as { total: string | null }[];

  const totalRevenue = revenueByMonth.reduce(
    (acc, r) => acc + parseInt(r.total ?? "0"),
    0
  );

  const statusOrder = ["pending", "confirmed", "active", "completed", "cancelled"];
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-400",
    confirmed: "bg-[#FF4D00]",
    active: "bg-blue-400",
    completed: "bg-[#999]",
    cancelled: "bg-red-400",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Analytics</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">Platform performance metrics</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <p className="text-xs text-[#999] uppercase tracking-wider">
            Total Revenue
          </p>
          <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
            {formatPrice(totalRevenue, "INR")}
          </p>
        </div>
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <p className="text-xs text-[#999] uppercase tracking-wider">
            Last 30 Days Revenue
          </p>
          <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
            {formatPrice(parseInt(recentRevenue[0]?.total ?? "0"), "INR")}
          </p>
        </div>
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-5">
          <p className="text-xs text-[#999] uppercase tracking-wider">
            Last 30 Days Bookings
          </p>
          <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
            {recentBookings[0]?.count ?? 0}
          </p>
        </div>
      </div>

      {/* Booking status breakdown */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">
          Bookings by Status
        </h2>
        <div className="space-y-3">
          {statusOrder.map((status) => {
            const item = bookingsByStatus.find((b) => b.status === status);
            const cnt = item?.count ?? 0;
            const total = bookingsByStatus.reduce((a, b) => a + b.count, 0);
            const pct = total > 0 ? (cnt / total) * 100 : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="text-xs text-[#6B6B6B] w-20 capitalize">
                  {status}
                </span>
                <div className="flex-1 h-6 bg-[#F0EFEC] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${statusColors[status] ?? "bg-[#999]"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[#1A1A1A] w-12 text-right">
                  {cnt}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly revenue table */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EFEC]">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">
            Monthly Revenue
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F0EFEC] bg-[#FAFAF8]">
                <th className="text-left px-6 py-3 font-medium text-[#6B6B6B]">
                  Month
                </th>
                <th className="text-right px-6 py-3 font-medium text-[#6B6B6B]">
                  Transactions
                </th>
                <th className="text-right px-6 py-3 font-medium text-[#6B6B6B]">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {revenueByMonth.length > 0 ? (
                revenueByMonth.map((r) => (
                  <tr
                    key={r.month}
                    className="border-b border-[#F0EFEC] hover:bg-[#FAFAF8]/50"
                  >
                    <td className="px-6 py-3 font-medium text-[#1A1A1A]">
                      {r.month}
                    </td>
                    <td className="px-6 py-3 text-right text-[#6B6B6B]">
                      {r.count}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-[#1A1A1A]">
                      {formatPrice(parseInt(r.total ?? "0"), "INR")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-[#999]">
                    No revenue data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
