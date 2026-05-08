import Link from "next/link";
import { VehicleForm } from "@/components/dashboard/vehicle-form";

export default function NewVehiclePage() {
  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/host/vehicles"
          className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1 mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Vehicles
        </Link>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Add New Vehicle</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          Fill in the details to list your car for rent
        </p>
      </div>
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-6">
        <VehicleForm />
      </div>
    </div>
  );
}
