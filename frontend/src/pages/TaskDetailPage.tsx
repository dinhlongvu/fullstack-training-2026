// pages/TaskDetailPage.tsx — Task detail + comment list.
// Fetches task detail and comments via React Query (separate cache keys).
// Renders task info (status/priority badges, assignee, dates) + CommentList below.

import { useState } from "react";
import { useParams, Navigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, User, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  useTaskQuery,
  useTaskCommentsQuery,
} from "@/features/tasks/api/useTasks";
import { useProjectDetailQuery } from "@/features/projects/api/useProjects";
import { useAuthStore } from "@/stores/useAuthStore";
import { PriorityBadge } from "@/features/tasks/components/PriorityBadge";
import { StatusBadge } from "@/features/tasks/components/StatusBadge";
import { EditTaskDialog } from "@/features/tasks/components/EditTaskDialog";
import { TaskDetailSkeleton } from "@/features/tasks/components/TaskDetailSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { isNetworkError } from "@/lib/api";
import {
  CommentList,
  isThreadUnavailable,
} from "@/features/tasks/components/CommentList";
import { CommentForm } from "@/features/tasks/components/CommentForm";

// Format a date for display (e.g., "Jul 9, 2026")
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Parse URL param to number — no hardcoded IDs
  const taskId = Number(id);

  // Two independent queries, two cache keys (as required by the issue)
  const {
    data: task,
    isPending: isTaskPending,
    error: taskError,
    refetch: refetchTask,
    isFetching: isTaskFetching,
  } = useTaskQuery(taskId);

  const {
    data: comments,
    isPending: isCommentsPending,
    isPaused: isCommentsPaused,
    error: commentsError,
    refetch: refetchComments,
    isFetching: isCommentsFetching,
  } = useTaskCommentsQuery(taskId);

  // Edit dialog state + members needed for the assignee dropdown
  const [editOpen, setEditOpen] = useState(false);
  const currentUser = useAuthStore((s) => s.currentUser);
  const {
    data: project,
    isPending: isProjectPending,
    error: projectError,
  } = useProjectDetailQuery(task?.projectId ?? 0);
  const members = project?.members ?? [];
  const canEdit =
    currentUser !== null && members.some((m) => m.userId === currentUser.id);

  // A running project query means membership is genuinely UNKNOWN.
  const isMembershipUnknown = isProjectPending && projectError === null;

  const location = useLocation();
  const stateSearch = (location.state as { boardSearch?: unknown } | null)
    ?.boardSearch;

  // Filters of the board this task was opened from, so the back link returns to that exact view.
  const boardSearch =
    typeof stateSearch === "string" && stateSearch.startsWith("?")
      ? stateSearch
      : "";

  // Same rule CommentList renders on, so the form and the thread never
  // disagree about whether comments are usable.
  const commentsUnavailable = isThreadUnavailable(
    commentsError,
    isCommentsPaused,
    comments,
  );

  // Invalid id in the URL (/tasks/abc, /tasks/0). Both task queries are
  // `enabled: taskId > 0`, so a non-positive id would leave the page with no
  // data, no error and a retry button that cannot do anything.
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return <Navigate to="/projects" replace />;
  }

  // Loading state — task detail.
  if (isTaskPending) {
    return <TaskDetailSkeleton />;
  }

  // Only take over the whole page when there is genuinely nothing to show
  if (!task) {
    return (
      <div className="space-y-4">
        {/* No task loaded here, so there is no projectId to go back to */}
        <Link
          to="/projects"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to projects
        </Link>
        <ErrorState
          message={
            // A dropped connection is not a missing task. Naming the wrong
            // cause sends the user looking for the wrong problem.
            isNetworkError(taskError)
              ? "Couldn't load this task. Check your connection and try again."
              : "Couldn't load this task. It may have been deleted, or you may not have access."
          }
          retry={() => void refetchTask()}
          isRetrying={isTaskFetching}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link — go to the parent project's board, not the projects list */}
      <Link
        to={`/projects/${task.projectId}${boardSearch}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to project
      </Link>

      {/* Task info section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>

        <div className="flex items-start justify-between gap-2">
          <h2 className="text-2xl font-bold">{task.title}</h2>
          {(canEdit || isMembershipUnknown) && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={isMembershipUnknown}
              title={
                isMembershipUnknown
                  ? "Checking your access to this project..."
                  : undefined
              }
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>

        <p className="whitespace-pre-wrap break-words text-muted-foreground">
          {task.description || "No description"}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {task.assigneeName ?? "Unassigned"}
          </span>
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Due {formatDate(task.dueDate)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Created {formatDate(task.createdAt)}
          </span>
        </div>
      </div>

      {/* Comments section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Comments ({comments?.length ?? task.commentCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommentList
            comments={comments}
            isPending={isCommentsPending}
            isPaused={isCommentsPaused}
            error={commentsError}
            onRetry={() => void refetchComments()}
            isRetrying={isCommentsFetching}
          />

          {/* Kept mounted while the thread is unavailable — unmounting would
              throw away whatever the user had typed. */}
          <div className="mt-6 border-t pt-6">
            <CommentForm
              taskId={taskId}
              disabledReason={
                commentsUnavailable
                  ? "Comments couldn't be loaded, so posting is unavailable right now."
                  : undefined
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog — only for project members */}
      {canEdit && (
        <EditTaskDialog
          task={task}
          members={members}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
