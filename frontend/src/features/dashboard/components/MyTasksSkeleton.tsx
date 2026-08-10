// features/dashboard/components/MyTasksSkeleton.tsx
// Loading placeholder for the My Tasks list. Mirrors a MyTaskList row so the
// page does not jump when the real data arrives.

import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

const PLACEHOLDER_ROW_COUNT = 6;

export function MyTasksSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your tasks...</span>

      <Card aria-hidden="true">
        <CardContent className="divide-y p-0">
          {Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
