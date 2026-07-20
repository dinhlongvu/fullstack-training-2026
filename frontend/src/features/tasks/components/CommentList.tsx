// features/tasks/components/CommentList.tsx
// Renders the comment list for a task.
// Handles its own loading, error, and empty states.
// Comments arrive already sorted (createdAt ascending) from the API.

import { Loader2 } from "lucide-react";
import { type Comment } from "../api/tasksApi";

interface CommentListProps {
  comments: Comment[] | undefined;
  isLoading: boolean;
  error: Error | null;
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

export function CommentList({ comments, isLoading, error }: CommentListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <p className="py-6 text-center text-sm text-destructive">
        Failed to load comments.
      </p>
    );
  }

  // Empty state
  if (!comments || comments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No comments yet.
      </p>
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
            {comment.content}
          </p>
        </li>
      ))}
    </ul>
  );
}
