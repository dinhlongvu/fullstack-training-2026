// features/tasks/components/DeleteTaskDialog.tsx
// Confirmation dialog before deleting a task.
// Uses shadcn AlertDialog for destructive action confirmation.

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
import { useDeleteTaskMutation } from "../api/useTasks";

interface DeleteTaskDialogProps {
  taskId: number;
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTaskDialog({
  taskId,
  projectId,
  open,
  onOpenChange,
}: DeleteTaskDialogProps) {
  const deleteMutation = useDeleteTaskMutation(projectId);

  // preventDefault keeps the dialog open so the pending state ("Deleting...")
  // is visible; we close it manually once the mutation resolves
  const handleDelete = (event: React.MouseEvent) => {
    event.preventDefault();
    deleteMutation.mutate(taskId, {
      onSuccess: () => {
        toast.success("Task deleted successfully");
        onOpenChange(false);
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
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Delete this task? This action cannot be undone.
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
