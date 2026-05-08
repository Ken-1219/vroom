import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "host" && session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      <DashboardSidebar
        userName={session.user.name}
        userRole={session.user.role}
        userImage={session.user.image}
      />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
