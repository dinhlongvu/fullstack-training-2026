// features/projects/components/AddMemberDialog.tsx
// Dialog form to add a member to a project by email
// Uses React Hook Form + Zod for validation

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
import { useAddMemberMutation } from "../api/useProjects";

// Zod schema: email is required and must be a valid email format
const addMemberSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

// Infer the TypeScript type from the schema
type AddMemberFormValues = z.infer<typeof addMemberSchema>;

interface AddMemberDialogProps {
    projectId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({
    projectId,
    open,
    onOpenChange,
}: AddMemberDialogProps) {
    const form = useForm<AddMemberFormValues>({
        resolver: zodResolver(addMemberSchema),
        defaultValues: {
            email: "",
        },
    });

    const addMemberMutation = useAddMemberMutation(projectId);

    // Reset form when dialog closes
    const handleOpenChange = (next: boolean) => {
        if (!next) {
            form.reset();
        }
        onOpenChange(next);
    };

    const onSubmit = (values: AddMemberFormValues) => {
        addMemberMutation.mutate(
            { email: values.email },
            {
                onSuccess: () => {
                    toast.success("Member added successfully");
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
                    <DialogTitle>Add Member</DialogTitle>
                    <DialogDescription>
                        Invite a user to this project by their email address.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="colleague@example.com"
                                            disabled={addMemberMutation.isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={addMemberMutation.isPending}>
                                {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
