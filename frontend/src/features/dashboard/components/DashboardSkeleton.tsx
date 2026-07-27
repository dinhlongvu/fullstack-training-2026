// features/dashboard/components/DashboardSkeleton.tsx
// Full-page loading placeholder for /dashboard: the four stat cards plus the
// Upcoming Deadlines widget. DashboardStatsSkeleton only covers the cards.

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardStatsSkeleton } from "./DashboardStatsSkeleton";

const DEADLINE_ROW_COUNT = 3;

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <DashboardStatsSkeleton />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent className="divide-y">
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
        </CardContent>
      </Card>
    </div>
  );
}
