import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, type User } from "@vroom/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";
import { AdminUserActions } from "./user-actions";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const search = params.search ?? "";
  const roleFilter = params.role ?? "";

  let query = (db as any).select().from(users);

  if (search) {
    query = query.where(
      or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
    );
  }
  if (roleFilter) {
    query = query.where(eq(users.role, roleFilter));
  }

  const allUsers = (await query.orderBy(desc(users.createdAt)).limit(200)) as User[];

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    host: "bg-blue-100 text-blue-700",
    renter: "bg-[#F0EFEC] text-[#6B6B6B]",
  };

  const statusColors: Record<string, string> = {
    active: "bg-[#FFF1EB] text-[#FF4D00]",
    suspended: "bg-amber-100 text-amber-700",
    banned: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">User Management</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">{allUsers.length} users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form className="flex-1 min-w-[200px]">
          <input
            type="text"
            name="search"
            placeholder="Search by name or email..."
            defaultValue={search}
            className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
          />
        </form>
        <div className="flex gap-2">
          {["", "renter", "host", "admin"].map((r) => (
            <a
              key={r}
              href={`/dashboard/admin/users${r ? `?role=${r}` : ""}${search ? `${r ? "&" : "?"}search=${search}` : ""}`}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                roleFilter === r
                  ? "bg-[#FF4D00] text-white"
                  : "bg-white text-[#6B6B6B] border border-[#E8E6E1] hover:bg-[#FAFAF8]"
              }`}
            >
              {r || "All"}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F0EFEC] bg-[#FAFAF8]">
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Name</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Email</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Role</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} className="border-b border-[#F0EFEC] hover:bg-[#FAFAF8]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#E8E6E1] flex items-center justify-center text-xs font-semibold text-[#6B6B6B] flex-shrink-0">
                        {(u.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#1A1A1A] truncate max-w-[160px]">
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] truncate max-w-[200px]">
                    {u.email ?? "--"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[u.role] ?? roleColors.renter}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[u.status ?? "active"] ?? statusColors.active}`}>
                      {u.status ?? "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] text-xs">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "--"}
                  </td>
                  <td className="px-4 py-3">
                    <AdminUserActions
                      userId={u.id}
                      currentRole={u.role}
                      currentStatus={u.status ?? "active"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allUsers.length === 0 && (
          <div className="py-12 text-center text-sm text-[#999]">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
