// features/tasks/components/TaskCard.tsx
// Displays a single task as a card within a Kanban column.
// Shows title, priority badge, an assignee picker, and due date.
// Click navigates to /tasks/:id. Move Left/Right buttons change status (column).

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { PriorityBadge } from "./PriorityBadge";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import {
  useUpdateTaskStatusMutation,
  useAssignTaskMutation,
} from "../api/useTasks";
import { TASK_STATUS_ORDER, type Task } from "../api/tasksApi";
import { type ProjectMember } from "@/features/projects/api/projectsApi";
import { useAuthStore } from "@/stores/useAuthStore";

interface TaskCardProps {
  task: Task;
  projectId: number;
  members: ProjectMember[];
}

// Sentinel value for the "Unassigned" option — shadcn Select cannot use an
// empty string as an item value, so we map this to `null` on change.
const UNASSIGNED_VALUE = "unassigned";

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

export function TaskCard({ task, projectId, members }: TaskCardProps) {
  const navigate = useNavigate();
  const updateStatus = useUpdateTaskStatusMutation(projectId);
  const assignTask = useAssignTaskMutation(projectId);

  // Local UI state for the delete confirmation dialog
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Only project members (owner included) may delete a task — mirror the
  // membership-based access rules used elsewhere in the app.
  const currentUser = useAuthStore((s) => s.currentUser);
  const canDelete =
    currentUser !== null &&
    members.some((member) => member.userId === currentUser.id);

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

  // Open the delete confirmation dialog.
  // stopPropagation so clicking the trash icon doesn't navigate to the detail page.
  function handleDeleteClick(event: React.MouseEvent) {
    event.stopPropagation();
    setDeleteOpen(true);
  }

  // Reflect the current assignee as the selected value in the picker.
  // `null` (unassigned) maps to the UNASSIGNED_VALUE sentinel.
  const assigneeValue =
    task.assigneeId === null ? UNASSIGNED_VALUE : String(task.assigneeId);

  // Assign/unassign the task when a picker option is chosen.
  // The sentinel maps back to `null` for the API.
  function handleAssigneeChange(value: string) {
    const nextAssigneeId = value === UNASSIGNED_VALUE ? null : Number(value);

    // Skip the request if the value did not actually change.
    if (nextAssigneeId === task.assigneeId) return;

    assignTask.mutate(
      { taskId: task.id, assigneeId: nextAssigneeId },
      {
        onSuccess: () => toast.success("Assignee updated"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <>
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={() => navigate(`/tasks/${task.id}`)}
      >
        <CardContent className="p-4">
          {/* Header: priority badge + delete action */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <PriorityBadge priority={task.priority} />
            {canDelete && (
              <button
                type="button"
                aria-label="Delete task"
                onClick={handleDeleteClick}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Task title */}
          <h4 className="text-sm font-medium leading-tight">{task.title}</h4>

          {/* Footer: assignee picker + due date */}
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            {/* Assignee picker — stopPropagation so opening it doesn't navigate */}
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={assigneeValue}
                onValueChange={handleAssigneeChange}
                disabled={assignTask.isPending}
              >
                <SelectTrigger className="h-7 w-[140px] text-xs">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem
                      key={member.userId}
                      value={String(member.userId)}
                    >
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due date */}
            {task.dueDate && (
              <div
                className={`flex items-center gap-1 ${
                  isOverdue(task.dueDate) && task.status !== "Done"
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
          {/* flex-wrap + flex-1 lets buttons resize to share the row, then stack
              vertically when the column is too narrow to fit both side by side. */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2">
            <Button
              variant="outline"
              size="sm"
              className="min-w-[7rem] flex-1"
              disabled={!canMoveLeft || updateStatus.isPending}
              onClick={(e) => handleMove(e, "left")}
            >
              ← Move Left
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[7rem] flex-1"
              disabled={!canMoveRight || updateStatus.isPending}
              onClick={(e) => handleMove(e, "right")}
            >
              Move Right →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog — kept OUTSIDE <Card> so its (portaled)
          button clicks don't bubble through the React tree into the card's
          navigate handler. */}
      {canDelete && (
        <DeleteTaskDialog
          taskId={task.id}
          projectId={projectId}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}
