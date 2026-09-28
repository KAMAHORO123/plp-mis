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
import {
  AuthFormShell,
  GoogleButton,
} from "@/features/authentication/components/auth-form-shell";
import { useAuth } from "@/features/authentication/auth-context";

const schema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  schoolName: z.string().min(1, "School name is required"),
  district: z.string().min(1, "District is required"),
  phone: z.string().min(1, "Phone number is required"),
});

type FormValues = z.infer<typeof schema>;

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "Coordinator",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

export function SignupPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      schoolName: "",
      district: "",
      phone: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { firstName, lastName } = splitName(values.name);
      const user = await registerUser({
        firstName,
        lastName,
        email: values.email,
        password: values.password,
        schoolName: values.schoolName.trim().toUpperCase(),
        district: values.district,
        coordinatorPhone: values.phone,
      });
      toast.success("School application submitted. Awaiting PLP National approval.");
      navigate(user.roleCode === "COORDINATOR" ? "/coordinator" : "/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <AuthFormShell
      title="Register Your School"
      subtitle="Apply to join PLP as a school coordinator"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="schoolName">School Name</Label>
          <Input id="schoolName" placeholder="Your school name" {...register("schoolName", { onChange: e => { e.target.value = e.target.value.toUpperCase(); } })} autoCapitalize="characters" />
          {errors.schoolName && <p className="text-xs text-destructive">{errors.schoolName.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="district">District</Label>
            <Input id="district" placeholder="District" {...register("district")} />
            {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="+250..." {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Coordinator Full Name</Label>
          <Input id="name" placeholder="Your full name" autoComplete="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="coordinator@school.rw" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            autoComplete="new-password"
            rightIcon={
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="pointer-events-auto" aria-label="Toggle password">
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            }
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Submit Application
        </Button>
        <GoogleButton />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-primary underline hover:no-underline">
            Login here
          </Link>
        </p>
      </form>
    </AuthFormShell>
  );
}
