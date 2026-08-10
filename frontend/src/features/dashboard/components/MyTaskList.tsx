// features/dashboard/components/MyTaskList.tsx
// One row per task: title + project on the left, due date and badges on the
// right. Presentational only — the page owns the query.

import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { daysUntil } from "@/lib/date";
import { StatusBadge } from "@/features/tasks/components/StatusBadge";
import { PriorityBadge } from "@/features/tasks/components/PriorityBadge";
import { type MyTask } from "../api/dashboardApi";
import { type Project } from "@/features/projects/api/projectsApi";

interface MyTaskListProps {
  tasks: MyTask[];
  projects: Project[];
}

// A full list spans more than a few days, so the dashboard widget's relative
// labels ("Today", "Tomorrow") would stop being useful here.
function formatDueDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MyTaskList({ tasks, projects }: MyTaskListProps) {
  // The payload carries projectId only, so names come from the already-cached
  // projects query. Lists are small, so building the map on render is fine.
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {tasks.map((task) => {
            // A done task is not late, however old its due date.
            const isOverdue =
              task.dueDate !== null &&
              task.status !== "Done" &&
              daysUntil(task.dueDate) < 0;

            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {task.title}
                    </Link>
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {projectNameById.get(task.projectId) ?? "Unknown project"}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      isOverdue ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    {task.dueDate ? formatDueDate(task.dueDate) : "No due date"}
                    {/* Red alone does not reach a screen reader. */}
                    {isOverdue && <span className="sr-only">(overdue)</span>}
                  </span>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
