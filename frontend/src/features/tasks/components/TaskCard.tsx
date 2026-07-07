// features/tasks/components/TaskCard.tsx
// Displays a single task as a card within a Kanban column.
// Shows title, priority badge, assignee initials, and due date.
// Click navigates to /tasks/:id. Move Left/Right buttons change status (column).

import { useNavigate } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PriorityBadge } from "./PriorityBadge";
import { useUpdateTaskStatusMutation } from "../api/useTasks";
import { TASK_STATUS_ORDER, type Task } from "../api/tasksApi";

interface TaskCardProps {
  task: Task;
  projectId: number;
}

// Extract initials from a full name (e.g., "Alice Smith" → "AS")
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Format due date for display (e.g., "Jun 30")
function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Check if a due date is overdue — compares calendar dates, not raw timestamps
function isOverdue(dateString: string): boolean {
  const due = new Date(dateString);
  const dueDateOnly = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
  );

  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return dueDateOnly < todayOnly;
}

export function TaskCard({ task, projectId }: TaskCardProps) {
  const navigate = useNavigate();
  const updateStatus = useUpdateTaskStatusMutation(projectId);

  const currentIndex = TASK_STATUS_ORDER.indexOf(task.status);
  // currentIndex === -1 means an unrecognized status — disable both buttons
  // instead of silently computing a wrong "next" column
  const canMoveLeft = currentIndex > 0;
  const canMoveRight =
    currentIndex !== -1 && currentIndex < TASK_STATUS_ORDER.length - 1;

  // Move task to the previous/next column.
  // stopPropagation prevents the card's own onClick (navigate to detail) from firing.
  function handleMove(event: React.MouseEvent, direction: "left" | "right") {
    event.stopPropagation();
    const nextIndex =
      direction === "left" ? currentIndex - 1 : currentIndex + 1;
    const nextStatus = TASK_STATUS_ORDER[nextIndex];

    updateStatus.mutate(
      { taskId: task.id, status: nextStatus },
      {
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <CardContent className="p-4">
        {/* Priority badge */}
        <div className="mb-2">
          <PriorityBadge priority={task.priority} />
        </div>

        {/* Task title */}
        <h4 className="text-sm font-medium leading-tight">{task.title}</h4>

        {/* Footer: assignee + due date */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          {/* Assignee initials */}
          {task.assigneeName ? (
            <div className="flex items-center gap-1" title={task.assigneeName}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                {getInitials(task.assigneeName)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground/50">
              <User className="h-4 w-4" />
              <span>Unassigned</span>
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== "Done"
                ? "text-red-500"
                : ""
                }`}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDueDate(task.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Move Left / Move Right — change status (column) */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canMoveLeft || updateStatus.isPending}
            onClick={(e) => handleMove(e, "left")}
          >
            ← Move Left
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canMoveRight || updateStatus.isPending}
            onClick={(e) => handleMove(e, "right")}
          >
            Move Right →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
