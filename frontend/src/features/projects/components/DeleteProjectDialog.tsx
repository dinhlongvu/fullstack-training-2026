// features/projects/components/DeleteProjectDialog.tsx
// Confirmation dialog before deleting a project.
// Uses shadcn AlertDialog for destructive action confirmation.

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { useDeleteProjectMutation } from "../api/useProjects";

interface DeleteProjectDialogProps {
    projectId: number;
    projectName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({
    projectId,
    projectName,
    open,
    onOpenChange,
}: DeleteProjectDialogProps) {
    const navigate = useNavigate();
    const deleteMutation = useDeleteProjectMutation(projectId);

    const handleDelete = () => {
        deleteMutation.mutate(undefined, {
            onSuccess: () => {
                toast.success("Project deleted successfully");
                navigate("/projects");
            },
            onError: (error) => {
                toast.error(error.message);
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete "{projectName}"?
                        This action cannot be undone. All tasks and comments
                        in this project will be permanently deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteMutation.isPending}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
