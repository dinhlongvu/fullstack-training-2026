// pages/TaskDetailPage.tsx — Task detail + comment list.
// Fetches task detail and comments via React Query (separate cache keys).
// Renders task info (status/priority badges, assignee, dates) + CommentList below.

import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Calendar, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  useTaskQuery,
  useTaskCommentsQuery,
} from "@/features/tasks/api/useTasks";
import { PriorityBadge } from "@/features/tasks/components/PriorityBadge";
import { StatusBadge } from "@/features/tasks/components/StatusBadge";
import { CommentList } from "@/features/tasks/components/CommentList";
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
  const navigate = useNavigate();

  // Parse URL param to number — no hardcoded IDs
  const taskId = Number(id);

  // Two independent queries, two cache keys (as required by the issue)
  const {
    data: task,
    isLoading: isTaskLoading,
    error: taskError,
  } = useTaskQuery(taskId);
  const {
    data: comments,
    isLoading: isCommentsLoading,
    error: commentsError,
  } = useTaskCommentsQuery(taskId);

  // Invalid ID in URL (e.g., /tasks/abc)
  if (isNaN(taskId)) {
    return <Navigate to="/projects" replace />;
  }

  // Loading state — task detail
  if (isTaskLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state — 404 not found or 403 not authorized
  if (taskError || !task) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">Task not found</h2>
        <p className="mt-2 text-muted-foreground">
          This task doesn't exist or you don't have access.
        </p>
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="mt-4 inline-flex items-center text-sm underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to project
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link — go to the projects list, a safe in-app fallback that
          works even when the task was opened via a direct URL (no app history) */}
      <button
        type="button"
        onClick={() => navigate("/projects")}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to project
      </button>

      {/* Task info section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>

        <h2 className="text-2xl font-bold">{task.title}</h2>

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
            Comments ({task.commentCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommentList
            comments={comments}
            isLoading={isCommentsLoading}
            error={commentsError}
          />
          <div className="mt-6 border-t pt-6">
            <CommentForm taskId={taskId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
