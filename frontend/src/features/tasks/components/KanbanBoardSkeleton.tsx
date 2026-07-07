// features/tasks/components/KanbanBoardSkeleton.tsx
// Skeleton loading state for the Kanban board.
// Shows 3 placeholder columns while tasks are being fetched.

import { Skeleton } from "@/components/ui/Skeleton";

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <Skeleton className="mb-2 h-5 w-16" />
      <Skeleton className="mb-3 h-4 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function SkeletonColumn() {
  return (
    <div className="flex flex-col rounded-lg bg-muted/30 p-3">
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-2.5 w-2.5 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex flex-col gap-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export function KanbanBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <SkeletonColumn />
      <SkeletonColumn />
      <SkeletonColumn />
    </div>
  );
}
