import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AuthFormShell,
  GoogleButton,
} from "@/features/authentication/components/auth-form-shell";
import { cn } from "@/lib/utils";

const LENGTH = 6;

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    if (char && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (pasted) setDigits(pasted.padEnd(LENGTH, "").split("").slice(0, LENGTH));
  };

  const onSubmit = async () => {
    if (digits.some((d) => !d)) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    toast.success("Email verified successfully");
    navigate("/auth/new-password");
  };

  return (
    <AuthFormShell
      title="Verify Your Email"
      subtitle="Enter the 6-digit code we sent to your email."
    >
      <p className="-mt-5 mb-6 text-center text-sm font-medium text-primary">
        (johndoe@example.com)
      </p>
      <div className="space-y-5">
        <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              aria-label={`Digit ${index + 1}`}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={cn(
                "h-12 w-12 rounded-lg border bg-card text-center text-lg font-semibold text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40",
                digit ? "border-primary" : "border-input"
              )}
            />
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Didn't receive code?{" "}
          <button className="font-medium text-primary hover:underline">
            Resent in 1:20
          </button>
        </p>

        <Button onClick={onSubmit} className="w-full" size="lg" loading={submitting}>
          Continue
        </Button>
        <GoogleButton />

        <p className="text-center text-sm text-muted-foreground">
          Don't got an account yet?{" "}
          <Link to="/auth/login" className="font-semibold text-primary underline hover:no-underline">
            Sign up here
          </Link>
        </p>
      </div>
    </AuthFormShell>
  );
}
