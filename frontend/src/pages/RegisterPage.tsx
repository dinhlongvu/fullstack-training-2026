import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { register } from "@/features/auth/api/authApi";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";

// Define validation schema for Registration
// Added 'fullName' requirement compared to Login schema.
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  fullName: z.string().min(1, "Full name is required."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

// Infer TypeScript type directly from the schema
type RegisterFormValues = z.infer<typeof registerSchema>;

// Register Page Component
// Registration succeeds without a token, so the user signs in next.
export function RegisterPage() {
  const navigate = useNavigate();

  // Initialize form with default values and Zod validation
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
    },
  });

  // Setup API mutation for user registration
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Account created successfully. Please sign in.");
      navigate("/login");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Submit handler triggered only when Zod validation passes
  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground">
            Create your TaskBoard account to manage projects and tasks.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Your full name"
                      autoComplete="name"
                      disabled={registerMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={registerMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      disabled={registerMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? "Creating account..."
                : "Create Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Already have account?{" "}
          <Link to="/login" className="font-medium text-foreground underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
