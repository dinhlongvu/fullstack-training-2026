// features/dashboard/components/UpcomingDeadlinesSkeleton.tsx
// Loading placeholder for the UpcomingDeadlines widget

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

const DEADLINE_ROW_COUNT = 3;

export function UpcomingDeadlinesSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* The overdue banner (shown only when overdueCount > 0 in the real
            widget) is intentionally omitted: it's conditional, so always
            rendering a placeholder would shift layout for the common
            zero-overdue case. */}
        <div className="divide-y">
          {Array.from({ length: DEADLINE_ROW_COUNT }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0 space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
