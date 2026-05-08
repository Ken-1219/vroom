import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Nav skeleton */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E8E6E1]">
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <Skeleton className="h-7 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back link */}
        <Skeleton className="h-4 w-28 mb-6" />

        {/* Photo gallery skeleton */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[420px]">
          <div className="col-span-2 row-span-2">
            <Skeleton className="w-full h-full rounded-none" />
          </div>
          <Skeleton className="w-full h-full rounded-none" />
          <Skeleton className="w-full h-full rounded-none" />
          <Skeleton className="w-full h-full rounded-none" />
          <Skeleton className="w-full h-full rounded-none" />
        </div>

        {/* Content skeleton */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <Skeleton className="h-9 w-72 mb-2" />
              <Skeleton className="h-5 w-40" />
              <div className="flex items-center gap-4 mt-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            <Skeleton className="h-px w-full" />

            {/* Description */}
            <div>
              <Skeleton className="h-6 w-40 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/6" />
            </div>

            {/* Specs */}
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className="space-y-6">
              {/* Pricing card */}
              <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6">
                <Skeleton className="h-9 w-36 mb-2" />
                <Skeleton className="h-4 w-24 mb-6" />
                <Skeleton className="h-12 w-full rounded-full" />
                <Skeleton className="h-3 w-40 mx-auto mt-3" />
              </div>

              {/* Host card */}
              <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6">
                <Skeleton className="h-4 w-20 mb-4" />
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
