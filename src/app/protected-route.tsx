import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageLoader } from "@/components/shared/page-loader";
import { useAuth } from "@/features/authentication/auth-context";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (user?.roleCode !== "NATIONAL_ADMIN" && user?.roleCode !== "COORDINATOR") {
    return <Navigate to="/sign-in" replace />;
  }
  const isCoordinatorRoute = location.pathname.startsWith("/coordinator");
  const isNationalRoute =
    !isCoordinatorRoute &&
    location.pathname !== "/notifications" &&
    location.pathname !== "/settings" &&
    location.pathname !== "/support";

  if (user?.roleCode === "COORDINATOR" && isNationalRoute) {
    return <Navigate to="/coordinator" replace />;
  }

  if (user?.roleCode === "NATIONAL_ADMIN" && isCoordinatorRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
