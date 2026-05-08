"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@vroom/db/schema";

interface VehicleFormProps {
  vehicle?: Vehicle;
}

const VEHICLE_TYPES = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "luxury", label: "Luxury" },
  { value: "ev", label: "EV" },
  { value: "mpv", label: "MPV" },
];

const FUEL_TYPES = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
  { value: "cng", label: "CNG" },
];

const FEATURE_OPTIONS = [
  "ac", "bluetooth", "usb", "gps", "cruise_control", "sunroof",
  "parking_sensors", "reverse_camera", "airbags", "abs",
  "power_steering", "power_windows", "keyless_entry", "push_start",
  "apple_carplay", "android_auto", "dashcam",
];

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const isEditing = !!vehicle;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    make: vehicle?.make ?? "",
    model: vehicle?.model ?? "",
    year: vehicle?.year ?? new Date().getFullYear(),
    variant: vehicle?.variant ?? "",
    vehicleType: vehicle?.vehicleType ?? "sedan",
    fuelType: vehicle?.fuelType ?? "petrol",
    transmission: vehicle?.transmission ?? "manual",
    seats: vehicle?.seats ?? 5,
    color: vehicle?.color ?? "",
    registrationNumber: vehicle?.registrationNumber ?? "",
    city: vehicle?.city ?? "",
    address: vehicle?.address ?? "",
    latitude: vehicle ? Number(vehicle.latitude) : 0,
    longitude: vehicle ? Number(vehicle.longitude) : 0,
    baseDailyRate: vehicle ? vehicle.baseDailyRate / 100 : 0,
    weekendRate: vehicle?.weekendRate ? vehicle.weekendRate / 100 : 0,
    weeklyDiscountPct: vehicle?.weeklyDiscountPct ?? 0,
    monthlyDiscountPct: vehicle?.monthlyDiscountPct ?? 0,
    description: vehicle?.description ?? "",
    features: (vehicle?.features ?? []) as string[],
    instantBooking: vehicle?.instantBooking ?? false,
  });

  function updateField(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFeature(feature: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      baseDailyRate: Math.round(form.baseDailyRate * 100),
      weekendRate: form.weekendRate ? Math.round(form.weekendRate * 100) : undefined,
    };

    try {
      const url = isEditing ? `/api/vehicles/${vehicle.id}` : "/api/vehicles";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? data.error ?? "Failed to save vehicle");
      }

      router.push("/dashboard/host/vehicles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-[#E8E6E1] rounded-lg text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] transition-shadow disabled:opacity-50";
  const labelClass = "block text-sm font-medium text-[#1A1A1A] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Vehicle Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Make *</label>
            <input
              type="text"
              value={form.make}
              onChange={(e) => updateField("make", e.target.value)}
              placeholder="e.g. Hyundai"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Model *</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
              placeholder="e.g. Creta"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Year *</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => updateField("year", Number(e.target.value))}
              min={2000}
              max={2030}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Variant</label>
            <input
              type="text"
              value={form.variant}
              onChange={(e) => updateField("variant", e.target.value)}
              placeholder="e.g. SX(O)"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Vehicle Type *</label>
            <select
              value={form.vehicleType}
              onChange={(e) => updateField("vehicleType", e.target.value)}
              className={inputClass}
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Fuel Type *</label>
            <select
              value={form.fuelType}
              onChange={(e) => updateField("fuelType", e.target.value)}
              className={inputClass}
            >
              {FUEL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Transmission *</label>
            <select
              value={form.transmission}
              onChange={(e) => updateField("transmission", e.target.value)}
              className={inputClass}
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Seats *</label>
            <input
              type="number"
              value={form.seats}
              onChange={(e) => updateField("seats", Number(e.target.value))}
              min={2}
              max={12}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Color</label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => updateField("color", e.target.value)}
              placeholder="e.g. White"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Registration Number *</label>
            <input
              type="text"
              value={form.registrationNumber}
              onChange={(e) => updateField("registrationNumber", e.target.value.toUpperCase())}
              placeholder="e.g. KA01AB1234"
              required
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Location</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>City *</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="e.g. Bangalore"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Latitude *</label>
            <input
              type="number"
              value={form.latitude || ""}
              onChange={(e) => updateField("latitude", Number(e.target.value))}
              step="any"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Longitude *</label>
            <input
              type="number"
              value={form.longitude || ""}
              onChange={(e) => updateField("longitude", Number(e.target.value))}
              step="any"
              required
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelClass}>Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Full address"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Daily Rate (INR) *</label>
            <input
              type="number"
              value={form.baseDailyRate || ""}
              onChange={(e) => updateField("baseDailyRate", Number(e.target.value))}
              min={0}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Weekend Rate (INR)</label>
            <input
              type="number"
              value={form.weekendRate || ""}
              onChange={(e) => updateField("weekendRate", Number(e.target.value))}
              min={0}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Weekly Discount %</label>
            <input
              type="number"
              value={form.weeklyDiscountPct}
              onChange={(e) => updateField("weeklyDiscountPct", Number(e.target.value))}
              min={0}
              max={80}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Monthly Discount %</label>
            <input
              type="number"
              value={form.monthlyDiscountPct}
              onChange={(e) => updateField("monthlyDiscountPct", Number(e.target.value))}
              min={0}
              max={80}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Description */}
      <section>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Description</h2>
        <textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Describe your vehicle — condition, mileage, any special features or rules..."
          rows={4}
          maxLength={2000}
          className={inputClass}
        />
        <p className="text-xs text-[#999] mt-1">{form.description.length}/2000</p>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Features</h2>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFeature(f)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                form.features.includes(f)
                  ? "bg-[#FFF1EB] border-[#FF4D00]/30 text-[#FF4D00] font-medium"
                  : "bg-white border-[#E8E6E1] text-[#6B6B6B] hover:border-[#E8E6E1]"
              }`}
            >
              {f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </section>

      {/* Instant Booking */}
      <section>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.instantBooking}
            onChange={(e) => updateField("instantBooking", e.target.checked)}
            className="w-4 h-4 rounded border-[#E8E6E1] text-[#FF4D00] focus:ring-[#FF4D00]"
          />
          <div>
            <span className="text-sm font-medium text-[#1A1A1A]">Instant Booking</span>
            <p className="text-xs text-[#6B6B6B]">
              Allow renters to book without waiting for your approval
            </p>
          </div>
        </label>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-4 border-t border-[#E8E6E1]">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-[#E8E6E1] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {loading
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create Vehicle"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-sm font-medium text-[#6B6B6B] bg-white border border-[#E8E6E1] rounded-lg hover:bg-[#FAFAF8] transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
