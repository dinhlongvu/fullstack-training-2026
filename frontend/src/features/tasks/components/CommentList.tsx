// features/tasks/components/CommentList.tsx
// Renders the comment list for a task.
// Handles its own loading, error, and empty states.
// Comments arrive already sorted (createdAt ascending) from the API.

import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { isNetworkError } from "@/lib/api";
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

// Normalize newlines for display. Two steps:
//   1. Convert Windows CRLF (and any lone CR) to LF so line endings are uniform.
//   2. Collapse any run of 3+ consecutive newlines down to 2 — i.e. allow AT MOST one blank line between paragraphs.
function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n");
}

export function CommentList({
  comments,
  isPending,
  error,
  onRetry,
  isRetrying,
}: CommentListProps) {
  // Checked before isPending: a thread that failed with nothing cached still
  // reads isPending true, so the skeleton would never resolve.
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
