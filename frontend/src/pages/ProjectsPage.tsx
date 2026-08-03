// pages/ProjectsPage.tsx — Project list + create button.
// Displays the user's projects list with create functionality.
// Loading -> skeleton, failed fetch -> ErrorState, no projects -> EmptyState.

import { useState } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { isNetworkError } from "@/lib/api";
import { useProjectsQuery } from "@/features/projects/api/useProjects";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { ProjectListSkeleton } from "@/features/projects/components/ProjectListSkeleton";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";

export function ProjectsPage() {
  // Dialog open/close state - local UI state -> useState
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch projects via React Query
  const {
    data: projects,
    isPending,
    error,
    refetch,
    isFetching,
  } = useProjectsQuery();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Projects</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Loading state — isPending, not isLoading: an offline query is paused
          with isFetching=false, so isLoading stays false and the page would
          otherwise render blank (no skeleton, no error, no data). */}
      {isPending && <ProjectListSkeleton />}

      {/* Error state — only when there is nothing to show. A background
          refetch that fails leaves `error` set while the cached list is
          still on screen; hiding a working list behind a red box is worse
          than showing slightly stale data. */}
      {error && !projects && (
        <ErrorState
          message={
            // A dropped connection is not a server fault. Naming the wrong
            // cause sends the user looking for the wrong problem.
            isNetworkError(error)
              ? "Couldn't load your projects. Check your connection and try again."
              : "Couldn't load your projects. Try again in a moment."
          }
          retry={() => void refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* Empty state */}
      {projects && projects.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to get started."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          }
        />
      )}

      {/* Project list */}
      {projects && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create project dialog */}
      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
