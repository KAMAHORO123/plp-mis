import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AuthFormShell,
  GoogleButton,
} from "@/features/authentication/components/auth-form-shell";
import { useAuth } from "@/features/authentication/auth-context";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const user = await login(values.email, values.password);
      toast.success("Welcome back to PLP MIS");
      navigate(user.roleCode === "COORDINATOR" ? "/coordinator" : "/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <AuthFormShell
      title="Login Your Account"
      subtitle="Enter your credentials to access portal"
    >
      <Link to="/sign-in" className="mb-5 block text-center text-sm font-semibold text-primary">Sign in to the PLP member Hub →</Link>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@plp.rw"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="pointer-events-auto"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            }
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={watch("remember")}
              onCheckedChange={(c) => setValue("remember", c === true)}
            />
            Remember for 30 days
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-sm font-medium text-[#1D75DB] hover:underline"
          >
            Forgot password
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Continue
        </Button>
        <GoogleButton />

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account yet?{" "}
          <Link
            to="/auth/signup"
            className="font-semibold text-[#1D75DB] underline hover:no-underline"
          >
            Sign up here
          </Link>
        </p>
      </form>
    </AuthFormShell>
  );
}
