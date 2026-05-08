import { Skeleton } from "./skeleton";

export function VehicleCardSkeleton() {
  return (
    <div className="rounded-xl bg-white border border-[#E8E6E1] overflow-hidden">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="pt-3 border-t border-[#F0EFEC] flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
