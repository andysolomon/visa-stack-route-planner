import { Skeleton } from "@/components/ui/skeleton";

export default function PlannerDetailLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
      <aside className="w-full md:w-96 border-r p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </aside>
      <div className="flex-1">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}
