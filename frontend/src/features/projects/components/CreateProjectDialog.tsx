// features/projects/components/CreateProjectDialog.tsx
// Dialog form for creating a new project
// Uses React Hook Form + Zod for validation, React Query mutation for API call

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
import { useCreateProjectMutation } from "../api/useProjects";

// 1. Define Zod schema FIRST
const createProjectSchema = z.object({
    name: z
        .string()
        .min(1, "Project name is required")
        .max(100, "Project name must be at most 100 characters"),
    description: z
        .string()
        .max(500, "Description must be at most 500 characters")
        .optional()
        .or(z.literal("")),
});

// 2, Infer TypeScript type from schema
type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
    open,
    onOpenChange,
}: CreateProjectDialogProps) {
    // 3. Initialize React Hook Form with Zod resolver
    const form = useForm<CreateProjectFormValues>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    // 4. Setup mutation
    const createMutation = useCreateProjectMutation();

    // 5. Form submit handler
    const onSubmit = (values: CreateProjectFormValues) => {
        createMutation.mutate(
            {
                name: values.name,
                description: values.description ?? "",
            },
            {
                onSuccess: () => {
                    toast.success("Project created successfully");
                    form.reset();
                    onOpenChange(false);
                },
                onError: (error) => {
                    toast.error(error.message);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription>
                        Add a new project. You will be the owner.
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
                                            placeholder="My awesome project"
                                            disabled={createMutation.isPending}
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
                                            placeholder="What is this project about? (optional)"
                                            rows={3}
                                            disabled={createMutation.isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
