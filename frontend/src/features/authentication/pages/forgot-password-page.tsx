import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormShell } from "@/features/authentication/components/auth-form-shell";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    await new Promise((r) => setTimeout(r, 700));
    toast.success(`Reset code sent to ${values.email}`);
    navigate("/auth/verify-email");
  };

  return (
    <AuthFormShell
      title="Forgot Your Password?"
      subtitle="Enter your email and we'll help you reset it."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Continue
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account yet?{" "}
          <Link
            to="/auth/signup"
            className="font-semibold text-primary underline hover:no-underline"
          >
            Sign up here
          </Link>
        </p>
      </form>
    </AuthFormShell>
  );
}
