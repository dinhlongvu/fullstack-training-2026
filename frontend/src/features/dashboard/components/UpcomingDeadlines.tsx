// features/dashboard/components/UpcomingDeadlines.tsx
// Dashboard widget: an "N overdue" summary plus the list of tasks due within the
// next 3 days. Overdue is a count-only summary so a large overdue backlog can
// never push upcoming tasks out of the list. Presentational only — data is
// passed in by the page (no extra query).

import { Link } from "react-router-dom";
import { CalendarClock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { type UpcomingDeadline } from "../api/dashboardApi";
import { type Project } from "@/features/projects/api/projectsApi";

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  projects: Project[];
  overdueCount: number;
}

// Whole days from today to the given date. Both sides use UTC calendar days so
// this matches the backend, which stores due dates at end-of-day UTC — comparing
// by local day would shift the label by ±1 for users far from UTC (issue #3).
function daysUntil(dateString: string): number {
  const due = new Date(dateString);
  const dueUtc = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
  );
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dueUtc - todayUtc) / msPerDay);
}

// Human-friendly due label. The absolute date is formatted in UTC for the same
// reason as daysUntil above.
function formatDueLabel(dateString: string): string {
  const days = daysUntil(dateString);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function UpcomingDeadlines({
  deadlines,
  projects,
  overdueCount,
}: UpcomingDeadlinesProps) {
  // Resolve projectId -> name. Lists are small, so building the map on render is fine.
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

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
      <CardContent className="space-y-4">
        {/* Overdue summary — count only, so a large backlog can't crowd out the list. */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {overdueCount} overdue {overdueCount === 1 ? "task" : "tasks"}
            </span>
          </div>
        )}

        {/* Upcoming — always rendered so the widget never looks broken (issue #2). */}
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No upcoming deadlines 🎉
          </p>
        ) : (
          // Cap the height and scroll instead of letting the list grow down the
          // page — keeps the widget compact even when many deadlines are due.
          <ul className="max-h-80 divide-y overflow-y-auto">
            {sorted.map((deadline) => (
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
                  <span className="text-xs font-medium text-yellow-600">
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
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
