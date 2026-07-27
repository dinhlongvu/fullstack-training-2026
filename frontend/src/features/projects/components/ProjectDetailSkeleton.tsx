// features/projects/components/ProjectDetailSkeleton.tsx
// Loading placeholder for /projects/:id — back link, project header,
// members card and the task board, in the same order as the real page.

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { KanbanBoardSkeleton } from "@/features/tasks/components/KanbanBoardSkeleton";

// Placeholder member rows in the members table.
const MEMBER_ROW_COUNT = 3;

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Skeleton className="h-4 w-32" />

      {/* Project name + description + meta row */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Members card */}
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: MEMBER_ROW_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>

      {/* Task board — reuse the board's own skeleton, no duplication */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <KanbanBoardSkeleton />
      </div>
    </div>
  );
}
