"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-[#999] hover:text-white transition-colors cursor-pointer"
    >
      Sign Out
    </button>
  );
}
