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

// Normalize newlines for display. Two steps:
//   1. Convert Windows CRLF (and any lone CR) to LF so line endings are uniform.
//   2. Collapse any run of 3+ consecutive newlines down to 2 — i.e. allow AT MOST one blank line between paragraphs.
function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n");
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
            {normalizeNewlines(comment.content)}
          </p>
        </li>
      ))}
    </ul>
  );
}
