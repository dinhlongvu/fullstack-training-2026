// pages/ProjectsPage.tsx — Project list + create button.
// Displays the user's projects list with create funtionality
// Uses React Query for data fetching and shadcn/ui for layou

import { useState } from "react";
import { Loader2, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProjectsQuery } from "@/features/projects/api/useProjects";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";

export function ProjectsPage() {
  // Dialog open/close state - local UI state -> useState
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch projects via React Query
  const { data: projects, isLoading, error } = useProjectsQuery();

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
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {/* Error state */}
      {error && (
        <p className="text-center text-sm text-destructive">
          Failed to load projects: {error.message}
        </p>
      )}
      {/* Empty state */}
      {projects && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
        </div>
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
