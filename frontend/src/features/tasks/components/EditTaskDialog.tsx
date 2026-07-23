// features/tasks/components/EditTaskDialog.tsx
// Dialog form for editing an existing task's details.
// Mirrors CreateTaskDialog, but pre-populates from the current task and sends
// a PARTIAL update (only changed fields) to match PUT /api/tasks/{id}.

import { useEffect } from "react";
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
import { useUpdateTaskMutation } from "../api/useTasks";
import {
  type Task,
  type TaskPriority,
  type UpdateTaskRequest,
} from "../api/tasksApi";
import { type ProjectMember } from "@/features/projects/api/projectsApi";

// Sentinel for the "Unassigned" option — shadcn Select cannot use "" as a value.
const UNASSIGNED_VALUE = "unassigned";

// Zod schema — mirrors the backend UpdateTaskCommandValidator.
const editTaskSchema = z.object({
  title: z
    .string()
    .trim()
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
  assigneeId: z.string(), // member id as string, or UNASSIGNED_VALUE
});

type EditTaskFormValues = z.infer<typeof editTaskSchema>;

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

// Build form defaults from the task being edited.
function buildDefaults(task: Task): EditTaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    assigneeId:
      task.assigneeId === null ? UNASSIGNED_VALUE : String(task.assigneeId),
  };
}

interface EditTaskDialogProps {
  task: Task;
  members: ProjectMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({
  task,
  members,
  open,
  onOpenChange,
}: EditTaskDialogProps) {
  const form = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: buildDefaults(task),
  });

  const updateMutation = useUpdateTaskMutation(task.projectId);

  // Re-sync the form when reopening or when the task data changes underneath us.
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(task));
    }
  }, [open, task, form]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(buildDefaults(task));
    }
    onOpenChange(next);
  };

  const onSubmit = (values: EditTaskFormValues) => {
    // Build a PARTIAL request: only send fields that actually changed.
    // This is what lets us edit an OVERDUE task's title without the backend
    // rejecting its (unchanged) past due date.
    const request: UpdateTaskRequest = {};

    if (values.title !== task.title) request.title = values.title;

    const nextDescription = values.description ?? "";
    if (nextDescription !== task.description)
      request.description = nextDescription;

    if (values.priority !== task.priority) request.priority = values.priority;

    // Due date — compare by local calendar date (same convention as lib/date.ts).
    const originalDue = task.dueDate
      ? format(new Date(task.dueDate), "yyyy-MM-dd")
      : null;
    const nextDue = values.dueDate ? format(values.dueDate, "yyyy-MM-dd") : null;
    if (nextDue !== originalDue) {
      if (nextDue === null) request.clearDueDate = true;
      else request.dueDate = nextDue;
    }

    // Assignee — sentinel maps back to null. Explicit clear flag on unassign.
    const nextAssignee =
      values.assigneeId === UNASSIGNED_VALUE ? null : Number(values.assigneeId);
    if (nextAssignee !== task.assigneeId) {
      if (nextAssignee === null) request.clearAssignee = true;
      else request.assigneeId = nextAssignee;
    }

    // Nothing changed — don't hit the API.
    if (Object.keys(request).length === 0) {
      toast.info("No changes to save");
      handleOpenChange(false);
      return;
    }

    updateMutation.mutate(
      { taskId: task.id, data: request },
      {
        onSuccess: () => {
          toast.success("Task updated successfully");
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
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update this task's details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter task title"
                      disabled={updateMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
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
                      disabled={updateMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={updateMutation.isPending}
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

            {/* Due date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover modal>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                          disabled={updateMutation.isPending}
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
                  {/* Let the user remove an existing due date */}
                  {field.value && (
                    <button
                      type="button"
                      onClick={() => field.onChange(null)}
                      className="mt-1 self-start text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      Clear due date
                    </button>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignee */}
            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={updateMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>
                        Unassigned
                      </SelectItem>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
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
