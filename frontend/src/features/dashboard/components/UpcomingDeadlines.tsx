// features/dashboard/components/UpcomingDeadlines.tsx
// Dashboard widget: an "N overdue" summary plus the list of tasks due within the
// next 3 days. Overdue is a count-only summary so a large overdue backlog can
// never push upcoming tasks out of the list. Presentational only — data is
// passed in by the page (no extra query).

import { Link } from "react-router-dom";
import { CalendarClock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { daysUntil } from "@/lib/date";
import { type UpcomingDeadline } from "../api/dashboardApi";
import { type Project } from "@/features/projects/api/projectsApi";

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  projects: Project[];
  overdueCount: number;
}

// Human-friendly due label: relative for the nearest days so urgency reads at a
// glance, absolute otherwise (e.g. "Today", "Tomorrow", "Jun 30").
function formatDueLabel(dateString: string): string {
  const days = daysUntil(dateString);
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
        <CalendarClock
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue summary — count only, so a large backlog can't crowd out the list. */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {overdueCount} overdue {overdueCount === 1 ? "task" : "tasks"}
            </span>
          </div>
        )}

        {/* Always render the upcoming block so the widget never looks half-empty
            when there are overdue tasks but nothing coming up. */}
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
                  <span className="text-xs font-medium text-muted-foreground">
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
