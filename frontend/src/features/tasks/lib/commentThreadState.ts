// features/tasks/lib/commentThreadState.ts
// Shared rule for whether the comment thread can be shown at all.
// CommentList renders on it, TaskDetailPage gates the comment form on it.

import { type Comment } from "../api/tasksApi";

// Nothing to render: the fetch failed with nothing cached to fall back on.
// A failed background refetch also sets `error`, but an already-loaded
// thread is still fine to show — hence `!comments`.
export function isThreadUnavailable(
  error: Error | null,
  comments: Comment[] | undefined,
): boolean {
  return error !== null && !comments;
}
