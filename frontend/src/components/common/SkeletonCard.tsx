import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl p-4 border border-border space-y-3">
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
      <div className="pt-2 space-y-2">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 w-16 rounded" />
        <Skeleton className="h-7 w-16 rounded" />
      </div>
    </div>
  );
}
