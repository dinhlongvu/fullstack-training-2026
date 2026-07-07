// features/projects/components/EditProjectDialog.tsx
// Dialog form to edit a project's name and description.
// Pre-fills the form with the current project values.

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useUpdateProjectMutation } from "../api/useProjects";

// Same validation rules as Create — name required, max 200; description optional, max 2000
const editProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(200, "Project name must be at most 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .or(z.literal("")),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

interface EditProjectDialogProps {
  projectId: number;
  currentName: string;
  currentDescription: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({
  projectId,
  currentName,
  currentDescription,
  open,
  onOpenChange,
}: EditProjectDialogProps) {
  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: currentName,
      description: currentDescription,
    },
  });

  const updateMutation = useUpdateProjectMutation(projectId);

  // Re-sync form values when project data changes 
  useEffect(() => {
    if (open) {
      form.reset({
        name: currentName,
        description: currentDescription,
      });
    }
  }, [open, currentName, currentDescription, form]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
    }
    onOpenChange(next);
  };

  const onSubmit = (values: EditProjectFormValues) => {
    updateMutation.mutate(
      {
        name: values.name,
        description: values.description ?? "",
      },
      {
        onSuccess: () => {
          toast.success("Project updated successfully");
          handleOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the project name and description.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Project name"
                      disabled={updateMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Project description (optional)"
                      rows={3}
                      disabled={updateMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
