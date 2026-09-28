import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Circle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AuthFormShell,
  GoogleButton,
} from "@/features/authentication/components/auth-form-shell";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[^A-Za-z0-9]/, "Must contain one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-success" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/40" />
      )}
      <span className={cn(ok ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </li>
  );
}

export function NewPasswordPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onChange" });

  const password = watch("password") ?? "";

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 700));
    toast.success("Password updated successfully");
    navigate("/auth/login");
  };

  return (
    <AuthFormShell
      title="Login Your Account"
      subtitle="Choose a strong password to secure your account."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type={show ? "text" : "password"}
            placeholder="Enter your password"
            rightIcon={
              <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password">
                {show ? <EyeOff /> : <Eye />}
              </button>
            }
            {...register("password")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type={show ? "text" : "password"}
            placeholder="Confirm your password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <ul className="space-y-2">
          <Rule ok={/[^A-Za-z0-9]/.test(password)} label="Must contain one special character" />
          <Rule ok={password.length >= 8} label="Must be at least 8 characters" />
          <Rule ok={/[A-Z]/.test(password)} label="Must contain one uppercase letter" />
        </ul>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Continue
        </Button>
        <GoogleButton />

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account yet?{" "}
          <Link to="/auth/signup" className="font-semibold text-primary underline hover:no-underline">
            Sign up here
          </Link>
        </p>
      </form>
    </AuthFormShell>
  );
}
