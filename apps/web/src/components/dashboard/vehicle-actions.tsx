"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface VehicleActionsProps {
  vehicleId: string;
  currentStatus: string;
}

export function VehicleActions({ vehicleId, currentStatus }: VehicleActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    const newStatus = currentStatus === "listed" ? "delisted" : "listed";
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={toggleStatus}
        disabled={loading}
        className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
          currentStatus === "listed"
            ? "text-red-600 bg-red-50 hover:bg-red-100"
            : "text-[#FF4D00] bg-[#FFF1EB] hover:bg-[#FFF1EB]"
        }`}
      >
        {loading ? "..." : currentStatus === "listed" ? "Delist" : "List"}
      </button>
      <Link
        href={`/dashboard/host/vehicles/${vehicleId}/edit`}
        className="text-xs font-medium text-[#6B6B6B] bg-[#F0EFEC] hover:bg-[#E8E6E1] px-3 py-1.5 rounded-md transition-colors"
      >
        Edit
      </Link>
    </div>
  );
}
