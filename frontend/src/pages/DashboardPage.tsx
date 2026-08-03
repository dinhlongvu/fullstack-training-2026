// pages/DashboardPage.tsx — Current user's task stats
// Fetches GET /api/dashboard/my-stats via React Query and renders stat cards
// plus an Upcoming Deadlines widget (both reuse the same my-stats query).

import { CheckCircle2, Circle, ListTodo, Timer } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { isNetworkError } from "@/lib/api";
import { useMyStatsQuery } from "@/features/dashboard/api/useDashboard";
import { StatsCard } from "@/features/dashboard/components/StatsCard";
import { DashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";
import { UpcomingDeadlines } from "@/features/dashboard/components/UpcomingDeadlines";
import { useProjectsQuery } from "@/features/projects/api/useProjects";

export function DashboardPage() {
  const {
    data: stats,
    isPending,
    error,
    refetch,
    isFetching,
  } = useMyStatsQuery();
  // Shared, already-cached query reused only to resolve project names for the
  // deadlines widget — the deadline list itself comes from my-stats (no new query).
  const { data: projects } = useProjectsQuery();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* Loading state — stat cards + deadlines widget */}
      {isPending && <DashboardSkeleton />}

      {/* Error state — only when there are no cached stats to show */}
      {error && !stats && (
        <ErrorState
          message={
            // A dropped connection is not a server fault. Naming the wrong
            // cause sends the user looking for the wrong problem.
            isNetworkError(error)
              ? "Couldn't load your dashboard. Check your connection and try again."
              : "Couldn't load your dashboard. Try again in a moment."
          }
          retry={() => void refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* Empty state — user has no tasks assigned */}
      {stats && stats.totalAssigned === 0 && (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Tasks assigned to you across all projects will show up here."
        />
      )}

      {/* Stats cards + upcoming deadlines */}
      {stats && stats.totalAssigned > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="Total Tasks"
              value={stats.totalAssigned}
              icon={ListTodo}
            />
            <StatsCard
              label="Todo"
              value={stats.tasksByStatus.todo}
              icon={Circle}
            />
            <StatsCard
              label="In Progress"
              value={stats.tasksByStatus.inProgress}
              icon={Timer}
            />
            <StatsCard
              label="Done"
              value={stats.tasksByStatus.done}
              icon={CheckCircle2}
            />
          </div>

          <UpcomingDeadlines
            deadlines={stats.upcomingDeadlines}
            projects={projects ?? []}
            overdueCount={stats.overdueCount}
          />
        </>
      )}
    </div>
  );
}
