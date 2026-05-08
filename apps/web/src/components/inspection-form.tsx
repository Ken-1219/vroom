"use client";

import { useState } from "react";

interface InspectionFormProps {
  type: "pre" | "post";
  onSubmit: (data: InspectionData) => void;
  submitting?: boolean;
}

export interface InspectionData {
  odometer: number;
  fuelLevel: number;
  inspection: Record<string, unknown>;
}

const CHECKLIST_ITEMS = [
  { key: "exterior", label: "Exterior condition" },
  { key: "interior", label: "Interior condition" },
  { key: "tires", label: "Tires" },
  { key: "lights", label: "Lights & signals" },
  { key: "brakes", label: "Brakes" },
  { key: "ac", label: "Air conditioning" },
  { key: "documents", label: "Documents present" },
];

const FUEL_LEVELS = [
  { value: 0, label: "Empty" },
  { value: 0.25, label: "1/4" },
  { value: 0.5, label: "1/2" },
  { value: 0.75, label: "3/4" },
  { value: 1, label: "Full" },
];

export function InspectionForm({ type, onSubmit, submitting }: InspectionFormProps) {
  const [odometer, setOdometer] = useState("");
  const [fuelLevel, setFuelLevel] = useState(0.5);
  const [checks, setChecks] = useState<Record<string, "ok" | "issue">>({});
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const odometerVal = parseInt(odometer);
    if (isNaN(odometerVal) || odometerVal < 0) return;

    onSubmit({
      odometer: odometerVal,
      fuelLevel,
      inspection: {
        checks,
        notes: notes.trim() || undefined,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Odometer */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
          Odometer Reading (km)
        </label>
        <input
          type="number"
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
          placeholder="e.g. 45230"
          min={0}
          required
          className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
        />
      </div>

      {/* Fuel Level */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Fuel Level
        </label>
        <div className="flex gap-2">
          {FUEL_LEVELS.map((fl) => (
            <button
              key={fl.value}
              type="button"
              onClick={() => setFuelLevel(fl.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                fuelLevel === fl.value
                  ? "bg-[#FF4D00] text-white"
                  : "bg-[#F0EFEC] text-[#6B6B6B] hover:bg-[#E8E6E1]"
              }`}
            >
              {fl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-3">
          Vehicle Checklist
        </label>
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between bg-[#FAFAF8] rounded-lg px-4 py-2.5"
            >
              <span className="text-sm text-[#1A1A1A]">{item.label}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setChecks((prev) => ({ ...prev, [item.key]: "ok" }))
                  }
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    checks[item.key] === "ok"
                      ? "bg-[#FFF1EB] text-[#FF4D00]"
                      : "bg-white text-[#999] border border-[#E8E6E1]"
                  }`}
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setChecks((prev) => ({ ...prev, [item.key]: "issue" }))
                  }
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    checks[item.key] === "issue"
                      ? "bg-red-100 text-red-700"
                      : "bg-white text-[#999] border border-[#E8E6E1]"
                  }`}
                >
                  Issue
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
          Notes <span className="text-[#999] font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional observations..."
          rows={3}
          className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !odometer}
        className="w-full py-3 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-[#E8E6E1] text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {submitting
          ? "Processing..."
          : type === "pre"
            ? "Start Trip"
            : "Complete Trip"}
      </button>
    </form>
  );
}
