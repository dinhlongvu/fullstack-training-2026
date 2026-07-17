// features/dashboard/components/UpcomingDeadlines.tsx
// Dashboard widget: tasks due within the next 3 days.
// Presentational only — data is passed in by the page. The deadline list itself
// comes from #57's my-stats query (no extra query); project names are resolved
// from the shared, already-cached projects list.

import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { type UpcomingDeadline } from "../api/dashboardApi";
import { type Project } from "@/features/projects/api/projectsApi";

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  projects: Project[];
}

// Format a due date for display, e.g. "Jun 30" — same style as TaskCard.
function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function UpcomingDeadlines({
  deadlines,
  projects,
}: UpcomingDeadlinesProps) {
  // Resolve projectId -> name. Lists are small, so building the map on render is fine.
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  // Make the due-date-ascending order explicit at the presentation layer.
  // dueDate is an ISO 8601 string, so a lexicographic compare is chronological.
  const sorted = [...deadlines].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );

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
          <ul className="divide-y">
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
                  <span className="text-xs text-muted-foreground">
                    {formatDueDate(deadline.dueDate)}
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
