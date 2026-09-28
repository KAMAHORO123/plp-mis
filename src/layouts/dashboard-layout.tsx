import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Crumb } from "@/components/shared/breadcrumb";
import { cn } from "@/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
  "": "Overview",
  dashboard: "Overview",
  schools: "Schools",
  members: "Members",
  program: "Program",
  certification: "Certification",
  events: "Events Management",
  reports: "Reports & Analytics",
  announcements: "Announcements",
  notifications: "Notifications & Alerts",
  coordinator: "Coordinator Overview",
  settings: "Settings",
  support: "Support",
};

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const breadcrumb = useMemo<Crumb[]>(() => {
    const segment = location.pathname.split("/")[1] ?? "";
    const label = ROUTE_LABELS[segment] ?? "Overview";
    return [{ label: "", href: "/", icon: Home }, { label }];
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          breadcrumb={breadcrumb}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
