"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InspectionForm, type InspectionData } from "@/components/inspection-form";

interface CompleteTripFormProps {
  tripId: string;
}

export function CompleteTripForm({ tripId }: CompleteTripFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: InspectionData) {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          odometer: data.odometer,
          fuelLevel: data.fuelLevel,
          postInspection: data.inspection,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error?.message ?? "Failed to complete trip");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}
      <InspectionForm type="post" onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
