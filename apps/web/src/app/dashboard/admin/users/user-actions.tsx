"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminUserActionsProps {
  userId: string;
  currentRole: string;
  currentStatus: string;
}

export function AdminUserActions({
  userId,
  currentRole,
  currentStatus,
}: AdminUserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateUser(updates: Record<string, string>) {
    setLoading(true);
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={currentRole}
        onChange={(e) => updateUser({ role: e.target.value })}
        disabled={loading}
        className="text-xs border border-[#E8E6E1] rounded px-1.5 py-1 text-[#6B6B6B] bg-white cursor-pointer disabled:opacity-50"
        aria-label="Change role"
      >
        <option value="renter">Renter</option>
        <option value="host">Host</option>
        <option value="admin">Admin</option>
      </select>

      {currentStatus === "active" ? (
        <button
          onClick={() => updateUser({ status: "suspended" })}
          disabled={loading}
          className="text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer disabled:opacity-50"
        >
          Suspend
        </button>
      ) : (
        <button
          onClick={() => updateUser({ status: "active" })}
          disabled={loading}
          className="text-xs text-[#FF4D00] hover:text-[#E64500] font-medium cursor-pointer disabled:opacity-50"
        >
          Activate
        </button>
      )}
    </div>
  );
}
