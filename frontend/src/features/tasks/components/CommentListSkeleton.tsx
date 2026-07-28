// features/tasks/components/CommentListSkeleton.tsx
// Loading placeholder for the comment list: author + timestamp on one row,
// then two lines of body text.

import { Skeleton } from "@/components/ui/Skeleton";

const PLACEHOLDER_COUNT = 3;

export function CommentListSkeleton() {
  return (
    // role="status" overrides the list semantics so a screen reader announces
    // "Loading comments..." instead of reading out an empty 3-item list.
    <ul role="status" aria-busy="true" aria-live="polite" className="space-y-4">
      <span className="sr-only">Loading comments...</span>
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <li key={index} aria-hidden="true" className="border-b pb-3 last:border-b-0">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-2/3" />
        </li>
      ))}
    </ul>
  );
}
