import { NavLink } from "react-router-dom";
import { LifeBuoy, Settings, LogOut } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getNavForRole } from "@/config/navigation";
import { useAuth } from "@/features/authentication/auth-context";
import { cn, getInitials } from "@/lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const navItems = getNavForRole(user?.roleCode);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="px-5 py-5">
        <Logo subtitle={user?.roleCode === "COORDINATOR" ? "Coordinator Dashboard" : "National Dashboard"} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/" || item.to === "/coordinator"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active text-sidebar-active-foreground"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 px-3 py-3">
        {[
          { to: "/support", label: "Support", icon: LifeBuoy },
          { to: "/settings", label: "Settings", icon: Settings },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active text-sidebar-active-foreground"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-border px-4 py-4">
        <Avatar>
          <AvatarImage src={user?.avatar} alt={user?.name} />
          <AvatarFallback>{getInitials(user?.name ?? "PL")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {user?.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <button
          onClick={logout}
          aria-label="Log out"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
