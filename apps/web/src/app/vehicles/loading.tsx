import { VehicleCardSkeleton } from "@/components/ui/vehicle-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function VehiclesLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Nav skeleton */}
      <div className="sticky top-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <Skeleton className="h-7 w-24 bg-[#1A1A1A]" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-20 bg-[#1A1A1A]" />
            <Skeleton className="h-8 w-8 rounded-full bg-[#1A1A1A]" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter skeleton */}
        <div className="bg-white border border-[#E8E6E1] rounded-xl p-4 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-56 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        {/* Results count skeleton */}
        <Skeleton className="h-5 w-48 mb-6" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
