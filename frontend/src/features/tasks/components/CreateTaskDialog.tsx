// features/tasks/components/CreateTaskDialog.tsx
// Dialog form for creating a new task.
// Uses React Hook Form + Zod for validation, React Query mutation for API call.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { useCreateTaskMutation } from "../api/useTasks";
import { type TaskPriority } from "../api/tasksApi";
import { type ProjectMember } from "@/features/projects/api/projectsApi";

// 1. Define Zod schema — single source of truth for validation
const createTaskSchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .max(200, "Title must be at most 200 characters"),
    description: z
        .string()
        .max(2000, "Description must be at most 2000 characters")
        .optional()
        .or(z.literal("")),
    priority: z.enum(["Low", "Medium", "High"], {
        required_error: "Priority is required",
    }),
    dueDate: z.date().nullable().optional(),
    assigneeId: z.string().nullable().optional(),
});

// 2. Infer TypeScript type from schema
type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

// Valid priority options for the select dropdown
const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
];

interface CreateTaskDialogProps {
    projectId: number;
    members: ProjectMember[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({
    projectId,
    members,
    open,
    onOpenChange,
}: CreateTaskDialogProps) {
    // 3. Initialize React Hook Form with Zod resolver
    const form = useForm<CreateTaskFormValues>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            title: "",
            description: "",
            priority: undefined,
            dueDate: null,
            assigneeId: null,
        },
    });

    // 4. Setup mutation
    const createMutation = useCreateTaskMutation(projectId);

    // Reset form when dialog closes
    const handleOpenChange = (next: boolean) => {
        if (!next) {
            form.reset();
        }
        onOpenChange(next);
    };

    // 5. Form submit handler
    const onSubmit = (values: CreateTaskFormValues) => {
        createMutation.mutate(
            {
                title: values.title,
                description: values.description ?? "",
                priority: values.priority as TaskPriority,
                dueDate: values.dueDate ? format(values.dueDate, "yyyy-MM-dd") : null,
                assigneeId: values.assigneeId ? Number(values.assigneeId) : null,
            },
            {
                onSuccess: () => {
                    toast.success("Task created successfully");
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to this project.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Title field */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter task title"
                                            disabled={createMutation.isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description field */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe the task (optional)"
                                            rows={3}
                                            disabled={createMutation.isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Priority select */}
                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Priority</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={createMutation.isPending}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {PRIORITY_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Due date picker */}
                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Due Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground",
                                                    )}
                                                    disabled={createMutation.isPending}
                                                >
                                                    {field.value
                                                        ? format(field.value, "PPP")
                                                        : "Pick a date (optional)"}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value ?? undefined}
                                                onSelect={field.onChange}
                                                disabled={{ before: new Date() }}
                                                autoFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Assignee select */}
                        <FormField
                            control={form.control}
                            name="assigneeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assignee</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value ?? undefined}
                                        disabled={createMutation.isPending}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Unassigned (optional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {members.map((member) => (
                                                <SelectItem
                                                    key={member.userId}
                                                    value={String(member.userId)}
                                                >
                                                    {member.fullName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Create Task"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
