// features/dashboard/components/UpcomingDeadlines.tsx
// Dashboard widget: tasks due within the next 3 days.
// Presentational only — data is passed in by the page. The deadline list itself
// comes from #57's my-stats query (no extra query); project names are resolved
// from the shared, already-cached projects list.

import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { type UpcomingDeadline } from "../api/dashboardApi";
import { type Project } from "@/features/projects/api/projectsApi";

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  projects: Project[];
}

// Whole days from today to the given date, compared by local calendar date
// (not raw timestamps). Negative = overdue, 0 = today, positive = upcoming.
function daysUntil(dateString: string): number {
  const due = new Date(dateString);
  const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dueOnly.getTime() - todayOnly.getTime()) / msPerDay);
}

// Human-friendly due label: relative for the nearest days so urgency reads at a
// glance, absolute otherwise (e.g. "Yesterday", "Today", "Tomorrow", "Jun 30").
function formatDueLabel(dateString: string): string {
  const days = daysUntil(dateString);
  if (days === -1) return "Yesterday";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function UpcomingDeadlines({
  deadlines,
  projects,
}: UpcomingDeadlinesProps) {
  // Resolve projectId -> name. Lists are small, so building the map on render is fine.
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  // Drop any entry without a due date before sorting/formatting. A task with no
  // due date has no deadline to show, and this guards localeCompare/new Date
  // against dirty or future backend data — this component is not wrapped in an
  // ErrorBoundary, so an unguarded throw here would blank the whole dashboard.
  // dueDate is an ISO 8601 string, so a lexicographic compare is chronological.
  const sorted = [...deadlines]
    .filter((deadline) => deadline.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          // Empty state
          <p className="py-6 text-center text-sm text-muted-foreground">
            No upcoming deadlines 🎉
          </p>
        ) : (
          // Cap the height and scroll instead of letting the list grow down the
          // page — keeps the widget compact even when many deadlines are due.
          <ul className="max-h-80 divide-y overflow-y-auto">
            {sorted.map((deadline) => {
              // Overdue or due today → surface as urgent (red).
              const isUrgent = daysUntil(deadline.dueDate) <= 0;

              return (
                <li
                  key={deadline.taskId}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  {/* Title + project name */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {deadline.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {projectNameById.get(deadline.projectId) ??
                        "Unknown project"}
                    </p>
                  </div>

                  {/* Due date + View link */}
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`text-xs ${
                        isUrgent
                          ? "font-medium text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatDueLabel(deadline.dueDate)}
                    </span>
                    <Link
                      to={`/tasks/${deadline.taskId}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
