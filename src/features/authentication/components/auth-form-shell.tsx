import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/features/authentication/auth-context";

interface AuthFormShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthFormShell({ title, subtitle, children }: AuthFormShellProps) {
  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center text-center">
        <img
          src="/favicon.svg"
          alt="Peace and Love Proclaimers"
          className="h-14 w-14 object-contain"
        />
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mt-7">{children}</div>
    </div>
  );
}

export function GoogleButton() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogle = async () => {
    try {
      const user = await login("admin@plp.rw", "password123");
      toast.success("Signed in with Google");
      navigate(user.roleCode === "COORDINATOR" ? "/coordinator" : "/");
    } catch {
      toast.error("Google sign-in is not configured. Use email login.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogle}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
        />
      </svg>
      Continue with Google
    </button>
  );
}
