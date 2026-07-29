// features/projects/components/ProjectListSkeleton.tsx
// Loading placeholder for the /projects grid. Mirrors the ProjectCard layout
// (title, two description lines, member count) so the page does not jump
// when the real data arrives.

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

// Enough cards to fill the first row on a large screen without looking fake.
const PLACEHOLDER_COUNT = 6;

function ProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}

export function ProjectListSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <span className="sr-only">Loading projects...</span>
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <div key={index} aria-hidden="true">
          <ProjectCardSkeleton />
        </div>
      ))}
    </div>
  );
}
