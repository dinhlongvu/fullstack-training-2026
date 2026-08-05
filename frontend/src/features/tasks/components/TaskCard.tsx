// features/tasks/components/TaskCard.tsx
// Displays a single task as a card within a Kanban column.
// Shows title, priority badge, an assignee picker, and due date.
// Click navigates to /tasks/:id. Move Left/Right buttons change status (column).

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Calendar, Pencil, Trash2 } from "lucide-react";
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
import { daysUntil } from "@/lib/date";
import { PriorityBadge } from "./PriorityBadge";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
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
  return daysUntil(dateString) < 0;
}

export function TaskCard({ task, projectId, members }: TaskCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const updateStatus = useUpdateTaskStatusMutation(projectId);
  const assignTask = useAssignTaskMutation(projectId);

  // Carry the board's active filters so "Back to project" returns to this exact
  // view. Router state rides in the history entry, so it survives a reload too.
  function openTask() {
    navigate(`/tasks/${task.id}`, { state: { boardSearch: location.search } });
  }

  // Local UI state for the edit + delete dialogs
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Only project members (owner included) may edit or delete a task — mirror the
  // membership-based access rules used elsewhere in the app.
  const currentUser = useAuthStore((s) => s.currentUser);
  const canModify =
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
  // Error handling (rollback + toast) lives in the mutation hook.
  function handleMove(event: React.MouseEvent, direction: "left" | "right") {
    event.stopPropagation();
    const nextIndex =
      direction === "left" ? currentIndex - 1 : currentIndex + 1;
    const nextStatus = TASK_STATUS_ORDER[nextIndex];

    updateStatus.mutate({ taskId: task.id, status: nextStatus });
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

  const assigneeLabelId = `assignee-label-${task.id}`;
  const assigneeTriggerId = `assignee-trigger-${task.id}`;

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
      {/* The card stays a mouse shortcut; the title link is the keyboard and
          screen-reader path in, so the card is not a button wrapping buttons. */}
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={openTask}
      >
        <CardContent className="p-4">
          {/* Header: priority badge + edit/delete actions */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <PriorityBadge priority={task.priority} />
            {canModify && (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label={`Edit task: ${task.title}`}
                  onClick={() => setEditOpen(true)}
                  className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete task: ${task.title}`}
                  onClick={handleDeleteClick}
                  className="rounded-sm text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Task title — carries the same router state as the card's own
              click, so "Back to project" returns to the filtered board. */}
          <h4 className="text-sm font-medium leading-tight">
            <Link
              to={`/tasks/${task.id}`}
              state={{ boardSearch: location.search }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {task.title}
            </Link>
          </h4>

          {/* Footer: assignee picker + due date */}
          {/* flex-wrap keeps the due date from being pushed out of the card;
              the picker flexes/shrinks while the due date stays intact. */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            {/* Assignee picker — stopPropagation so opening it doesn't navigate */}
            <div
              className="min-w-[110px] flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span id={assigneeLabelId} className="sr-only">
                {`Assignee for ${task.title}`}
              </span>
              <Select
                value={assigneeValue}
                onValueChange={handleAssigneeChange}
                disabled={assignTask.isPending}
              >
                <SelectTrigger
                  id={assigneeTriggerId}
                  // The trigger's own id comes last, so the accessible name is
                  // "<label> <selected value>" and the assignee is still read.
                  aria-labelledby={`${assigneeLabelId} ${assigneeTriggerId}`}
                  className="h-7 w-full text-xs"
                >
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
                className={`flex shrink-0 items-center gap-1 ${
                  isOverdue(task.dueDate) && task.status !== "Done"
                    ? "text-destructive"
                    : ""
                }`}
              >
                <Calendar className="h-3 w-3" aria-hidden="true" />
                <span>{formatDueDate(task.dueDate)}</span>
              </div>
            )}
          </div>

          {/* Move Left / Move Right — change status (column). */}
          {/* flex-wrap + flex-1 lets buttons resize to share the row, then stack
              vertically when the column is too narrow to fit both side by side. */}
          {(canMoveLeft || canMoveRight) && (
            <div
              className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {canMoveLeft && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-[7rem] flex-1"
                  aria-label={`Move Left: ${task.title}`}
                  disabled={updateStatus.isPending}
                  onClick={(e) => handleMove(e, "left")}
                >
                  ← Move Left
                </Button>
              )}
              {canMoveRight && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-[7rem] flex-1"
                  aria-label={`Move Right: ${task.title}`}
                  disabled={updateStatus.isPending}
                  onClick={(e) => handleMove(e, "right")}
                >
                  Move Right →
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit + delete dialogs — kept OUTSIDE <Card> so their (portaled)
          button clicks don't bubble through the React tree into the card's
          navigate handler. */}
      {canModify && (
        <>
          <EditTaskDialog
            task={task}
            members={members}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <DeleteTaskDialog
            taskId={task.id}
            projectId={projectId}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}
    </>
  );
}
