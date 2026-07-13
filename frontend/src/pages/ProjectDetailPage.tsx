// pages/ProjectDetailPage.tsx — Kanban board (3 columns).
// Displays project detail: info, members list, and owner action buttons.
// Uses React Query for data fetching, Zustand for current user.

import { useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, UserPlus, Pencil, Trash2, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectDetailQuery } from "@/features/projects/api/useProjects";
import { MemberList } from "@/features/projects/components/MemberList";
import { AddMemberDialog } from "@/features/projects/components/AddMemberDialog";
import { EditProjectDialog } from "@/features/projects/components/EditProjectDialog";
import { DeleteProjectDialog } from "@/features/projects/components/DeleteProjectDialog";
import { KanbanBoard } from "@/features/tasks/components/KanbanBoard";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.currentUser);

  // Dialog open/close states - local UI state -> useState
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Parse URL param to number - no hardcoded IDs
  const projectId = Number(id);

  // Fetch project detail via React Query
  const { data: project, isLoading, error } = useProjectDetailQuery(projectId);

  // Check if current user is the project owner
  const isOwner = project !== undefined && currentUser !== null && project.createdById === currentUser.id;

  // Invalid ID in URL (e.g., /projects/abc)
  if (isNaN(projectId)) {
    return <Navigate to="/projects" replace />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state — 404 not found or 403 not authorized
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <p className="mt-2 text-muted-foreground">
          This project doesn't exist or you don't have access.
        </p>
        <Link
          to="/projects"
          className="mt-4 inline-flex items-center text-sm underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/projects"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to projects
      </Link>

      {/* Project info section */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
            {project.description || "No description"}
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {new Date(project.createdAt).toLocaleDateString()}
              {project.updatedAt !== project.createdAt && (
                <span className="ml-1 italic">
                  (Updated {new Date(project.updatedAt).toLocaleDateString()})
                </span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {project.members.length}{" "}
              {project.members.length === 1 ? "member" : "members"}
            </span>
          </div>
        </div>

        {/* Owner-only action buttons */}
        {isOwner && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddMemberOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Members section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members</CardTitle>
          <CardDescription>
            People who have access to this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberList members={project.members} />
        </CardContent>
      </Card>

      {/* Kanban Board section */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Task Board</h3>
        <KanbanBoard projectId={project.id} members={project.members} />
      </div>

      {/* Dialogs — only rendered when project data is available */}
      <AddMemberDialog
        projectId={project.id}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />
      <EditProjectDialog
        projectId={project.id}
        currentName={project.name}
        currentDescription={project.description}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteProjectDialog
        projectId={project.id}
        projectName={project.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
