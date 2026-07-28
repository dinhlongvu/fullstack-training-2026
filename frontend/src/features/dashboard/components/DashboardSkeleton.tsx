// features/dashboard/components/DashboardSkeleton.tsx
// Full-page loading placeholder for /dashboard

import { DashboardStatsSkeleton } from "./DashboardStatsSkeleton";
import { UpcomingDeadlinesSkeleton } from "./UpcomingDeadlinesSkeleton";

export function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading dashboard...</span>

      <div aria-hidden="true" className="space-y-6">
        <DashboardStatsSkeleton />
        <UpcomingDeadlinesSkeleton />
      </div>
    </div>
  );
}
