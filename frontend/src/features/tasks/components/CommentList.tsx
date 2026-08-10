// features/tasks/components/CommentList.tsx
// Renders the comment list for a task.
// Handles its own loading, error, and empty states.
// Comments arrive already sorted (createdAt ascending) from the API.

import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { isNetworkError } from "@/lib/api";
import { normalizeNewlines } from "@/lib/text";
import { CommentListSkeleton } from "./CommentListSkeleton";
import { isThreadUnavailable } from "../lib/commentThreadState";
import { type Comment } from "../api/tasksApi";

interface CommentListProps {
  comments: Comment[] | undefined;
  isPending: boolean;
  error: Error | null;
  // Owned by the page, which holds the query.
  onRetry?: () => void;
  isRetrying?: boolean;
}

// Format a timestamp for display (e.g., "Jul 9, 2026, 2:30 PM")
function formatCreatedAt(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommentList({
  comments,
  isPending,
  error,
  onRetry,
  isRetrying,
}: CommentListProps) {
  // Error before loading: they are mutually exclusive under
  // networkMode: 'always' (a failed query reports status "error", never
  // "pending"), so the order only fixes the reading order of the branches.
  if (isThreadUnavailable(error, comments)) {
    return (
      <ErrorState
        message={
          isNetworkError(error)
            ? "You seem to be offline. Comments will load once the connection is back."
            : "Failed to load comments."
        }
        retry={onRetry}
        isRetrying={isRetrying}
      />
    );
  }

  // Loading state
  if (isPending) {
    return <CommentListSkeleton />;
  }

  // Empty state
  if (!comments || comments.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No comments yet"
        description="Be the first to comment on this task."
      />
    );
  }

  // Comment list
  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="border-b pb-3 last:border-b-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatCreatedAt(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
            {normalizeNewlines(comment.content)}
          </p>
        </li>
      ))}
    </ul>
  );
}
