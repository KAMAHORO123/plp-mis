import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/authentication/auth-context";

export function RootLayout() {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
        <Outlet />
      </TooltipProvider>
    </AuthProvider>
  );
}
