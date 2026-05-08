import { Skeleton } from "@/components/ui/skeleton";

export default function BookingsLoading() {
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

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Skeleton className="h-8 w-40 mb-6" />

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[#E8E6E1] rounded-xl p-5"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="w-full sm:w-28 h-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <div className="flex gap-3 pt-1">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
