import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { CommandBarTrigger } from "./command-bar";

export async function Nav({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const session = await auth();
  const isDark = variant === "dark";

  return (
    <nav className={`sticky top-0 z-50 border-b ${isDark ? "glass-dark border-white/[0.06]" : "glass border-[#E8E6E1]"}`}>
      <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Logo variant={isDark ? "light" : "dark"} />
        </div>
        <div className="flex items-center gap-6">
          <CommandBarTrigger variant={isDark ? "dark" : "light"} />
          <Link
            href="/vehicles"
            className={`text-sm font-medium transition-colors ${isDark ? "text-white/70 hover:text-white" : "text-[#6B6B6B] hover:text-[#1A1A1A]"}`}
          >
            Browse
          </Link>
          <Link
            href="/trip-planner"
            className={`text-sm font-medium transition-colors ${isDark ? "text-white/70 hover:text-white" : "text-[#6B6B6B] hover:text-[#1A1A1A]"}`}
          >
            Trip Planner
          </Link>
          {session?.user?.role === "host" || session?.user?.role === "admin" ? (
            <Link
              href="/dashboard/host"
              className={`text-sm font-medium transition-colors ${isDark ? "text-white/70 hover:text-white" : "text-[#6B6B6B] hover:text-[#1A1A1A]"}`}
            >
              Dashboard
            </Link>
          ) : null}
          {session?.user ? (
            <div className="flex items-center gap-3">
              <NotificationBell variant={isDark ? "dark" : "light"} />
              <UserMenu
                name={session.user.name ?? "User"}
                image={session.user.image}
                role={session.user.role}
              />
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold text-white bg-[#FF4D00] hover:bg-[#E64500] px-5 py-2 rounded-full transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
