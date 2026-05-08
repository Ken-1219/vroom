import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, vehicles, users } from "@vroom/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatPrice } from "@/lib/format";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const statusFilter = params.status ?? "";

  let query = (db as any)
    .select({
      booking: bookings,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      renterName: users.name,
    })
    .from(bookings)
    .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .leftJoin(users, eq(bookings.renterId, users.id));

  if (statusFilter) {
    query = query.where(eq(bookings.status, statusFilter));
  }

  const rows = (await query.orderBy(desc(bookings.createdAt)).limit(200)) as {
    booking: typeof bookings.$inferSelect;
    vehicleMake: string | null;
    vehicleModel: string | null;
    renterName: string | null;
  }[];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-[#FFF1EB] text-[#FF4D00]",
    active: "bg-blue-100 text-blue-700",
    completed: "bg-[#F0EFEC] text-[#6B6B6B]",
    cancelled: "bg-red-100 text-red-600",
  };

  const statuses = ["", "pending", "confirmed", "active", "completed", "cancelled"];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">All Bookings</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">{rows.length} bookings</p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map((s) => (
          <a
            key={s}
            href={`/dashboard/admin/bookings${s ? `?status=${s}` : ""}`}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === s
                ? "bg-[#FF4D00] text-white"
                : "bg-white text-[#6B6B6B] border border-[#E8E6E1] hover:bg-[#FAFAF8]"
            }`}
          >
            {s || "All"}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F0EFEC] bg-[#FAFAF8]">
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Renter</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Dates</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ booking: b, vehicleMake, vehicleModel, renterName }) => (
                <tr key={b.id} className="border-b border-[#F0EFEC] hover:bg-[#FAFAF8]/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="font-medium text-[#1A1A1A] hover:text-[#E64500]"
                    >
                      {vehicleMake && vehicleModel
                        ? `${vehicleMake} ${vehicleModel}`
                        : "Vehicle"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B]">
                    {renterName ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] text-xs">
                    {new Date(b.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" - "}
                    {new Date(b.endDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1A1A1A]">
                    {formatPrice(b.totalAmount, b.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        statusColors[b.status] ?? statusColors.pending
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] text-xs">
                    {b.createdAt
                      ? new Date(b.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="py-12 text-center text-sm text-[#999]">
            No bookings found
          </div>
        )}
      </div>
    </div>
  );
}
