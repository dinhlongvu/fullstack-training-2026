// pages/DashboardPage.tsx — Current user's task stats
// Fetches GET /api/dashboard/my-stats via React Query and renders stat cards
// plus an Upcoming Deadlines widget (both reuse the same my-stats query).

import { CheckCircle2, Circle, ListTodo, Timer } from "lucide-react";
import { useMyStatsQuery } from "@/features/dashboard/api/useDashboard";
import { StatsCard } from "@/features/dashboard/components/StatsCard";
import { DashboardStatsSkeleton } from "@/features/dashboard/components/DashboardStatsSkeleton";
import { UpcomingDeadlines } from "@/features/dashboard/components/UpcomingDeadlines";
import { useProjectsQuery } from "@/features/projects/api/useProjects";

export function DashboardPage() {
  const { data: stats, isLoading, error } = useMyStatsQuery();
  // Shared, already-cached query reused only to resolve project names for the
  // deadlines widget — the deadline list itself comes from my-stats (no new query).
  const { data: projects } = useProjectsQuery();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* Loading state — skeleton cards */}
      {isLoading && <DashboardStatsSkeleton />}

      {/* Error state */}
      {error && (
        <p className="text-center text-sm text-destructive">
          Failed to load dashboard: {error.message}
        </p>
      )}

      {/* Empty state — user has no tasks assigned */}
      {stats && stats.totalAssigned === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <ListTodo className="h-12 w-12 text-muted-foreground" />
          <p className="text-base font-medium">
            No tasks yet — create your first project!
          </p>
        </div>
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
          />
        </>
      )}
    </div>
  );
}
