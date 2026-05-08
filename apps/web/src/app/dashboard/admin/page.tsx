import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, vehicles, bookings, payments } from "@vroom/db/schema";
import { count, sum, eq } from "drizzle-orm";
import { formatPrice } from "@/lib/format";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/");
  }

  const [userCount, vehicleCount, bookingCount, revenueResult, hostCount, pendingCount] =
    await Promise.all([
      (db as any).select({ total: count() }).from(users) as Promise<{ total: number }[]>,
      (db as any).select({ total: count() }).from(vehicles) as Promise<{ total: number }[]>,
      (db as any).select({ total: count() }).from(bookings) as Promise<{ total: number }[]>,
      (db as any).select({ total: sum(payments.amount) }).from(payments).where(eq(payments.status, "captured")) as Promise<{ total: string | null }[]>,
      (db as any).select({ total: count() }).from(users).where(eq(users.role, "host")) as Promise<{ total: number }[]>,
      (db as any).select({ total: count() }).from(bookings).where(eq(bookings.status, "pending")) as Promise<{ total: number }[]>,
    ]);

  const stats = [
    { label: "Total Users", value: userCount[0]?.total ?? 0, href: "/dashboard/admin/users" },
    { label: "Hosts", value: hostCount[0]?.total ?? 0, href: "/dashboard/admin/users?role=host" },
    { label: "Vehicles", value: vehicleCount[0]?.total ?? 0, href: null },
    { label: "Total Bookings", value: bookingCount[0]?.total ?? 0, href: "/dashboard/admin/bookings" },
    { label: "Pending Bookings", value: pendingCount[0]?.total ?? 0, href: "/dashboard/admin/bookings?status=pending" },
    { label: "Revenue", value: formatPrice(parseInt(revenueResult[0]?.total ?? "0"), "INR"), href: "/dashboard/admin/analytics" },
  ];

  const links = [
    { label: "User Management", description: "View and manage all users, change roles", href: "/dashboard/admin/users" },
    { label: "All Bookings", description: "View all bookings across the platform", href: "/dashboard/admin/bookings" },
    { label: "Analytics", description: "Revenue trends and platform metrics", href: "/dashboard/admin/analytics" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Admin Dashboard</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">Platform overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => {
          const content = (
            <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 hover:border-[#FF4D00]/30 transition-colors">
              <p className="text-xs text-[#999] uppercase tracking-wider">
                {s.label}
              </p>
              <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{s.value}</p>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href}>{content}</Link>
          ) : (
            <div key={s.label}>{content}</div>
          );
        })}
      </div>

      {/* Quick links */}
      <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Manage</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="bg-white border border-[#E8E6E1] rounded-xl p-5 hover:border-[#FF4D00]/30 hover:shadow-sm transition-all"
          >
            <h3 className="text-sm font-semibold text-[#1A1A1A]">{l.label}</h3>
            <p className="text-xs text-[#6B6B6B] mt-1">{l.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
