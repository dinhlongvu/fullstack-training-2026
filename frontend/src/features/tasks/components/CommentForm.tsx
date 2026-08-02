// features/tasks/components/CommentForm.tsx
// Form to post a new comment on a task.
// Uses React Hook Form + Zod for validation, React Query mutation for the API call.
// On success, clears the textarea; the mutation hook invalidates the comment list.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { useCreateCommentMutation } from "../api/useTasks";

// 1. Zod schema — content required, max 1000 characters
const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be at most 2000 characters"),
});

// 2. Infer form type from schema (single source of truth)
type CommentFormValues = z.infer<typeof commentSchema>;

// Ties `disabledReason` to the textarea via aria-describedby.
const REASON_ID = "comment-disabled-reason";

interface CommentFormProps {
  taskId: number;
  // Set when the thread cannot be shown. The form stays mounted so the user
  // keeps what they typed; this explains why it is inert.
  disabledReason?: string;
}

export function CommentForm({ taskId, disabledReason }: CommentFormProps) {
  // 3. Initialize React Hook Form with Zod resolver
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  // 4. Setup mutation
  const createMutation = useCreateCommentMutation(taskId);

  const isInert = disabledReason !== undefined || createMutation.isPending;

  // 5. Submit handler
  const onSubmit = (values: CommentFormValues) => {
    // Neither readOnly nor the disabled button stops a submit event that
    // reaches the form directly, so the last word has to be here.
    if (isInert) return;

    createMutation.mutate(
      { content: values.content },
      {
        onSuccess: () => {
          // Clear the textarea after a successful post
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Add a comment</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write a comment..."
                  rows={3}
                  // readOnly, not disabled: a disabled textarea cannot be
                  // selected, so the draft we kept could not be copied out.
                  // It also drops out of the tab order without saying why.
                  readOnly={isInert}
                  aria-disabled={isInert}
                  aria-describedby={disabledReason ? REASON_ID : undefined}
                  className={cn(isInert && "cursor-not-allowed bg-muted")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {disabledReason && (
          <p
            id={REASON_ID}
            role="status"
            className="text-sm text-muted-foreground"
          >
            {disabledReason}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={isInert}>
            {createMutation.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
