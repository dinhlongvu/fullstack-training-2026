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

// Normalize newlines for display: collapse any run of consecutive line breaks
// (CRLF, lone CR, or repeated LF) into a single "\n". Under `whitespace-pre-wrap`
// every preserved newline becomes a forced line break, so multiple consecutive
// newlines render as a large vertical gap ("excessive blank space"). Collapsing
// runs keeps line breaks but guarantees normal single-line spacing.
function normalizeNewlines(text: string): string {
  return text.replace(/[\r\n]+/g, "\n");
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
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {normalizeNewlines(comment.content)}
          </p>
        </li>
      ))}
    </ul>
  );
}
