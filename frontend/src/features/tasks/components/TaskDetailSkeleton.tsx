// features/tasks/components/TaskDetailSkeleton.tsx
// Loading placeholder for /tasks/:id — badges, title, description, meta row,
// and the comments card (which reuses CommentListSkeleton).

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { CommentListSkeleton } from "./CommentListSkeleton";

export function TaskDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading task...</span>

      <div aria-hidden="true" className="space-y-6">
        {/* Back link */}
        <Skeleton className="h-4 w-32" />

        {/* Task info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>

        {/* Comments */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <CommentListSkeleton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
