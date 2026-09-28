import {
  Home,
  Users,
  BadgeCheck,
  UserCog,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MemberTab =
  | "overview"
  | "students"
  | "coordinators"
  | "facilitators"
  | "graduates";

const TABS: { id: MemberTab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "students", label: "Students", icon: Users },
  { id: "coordinators", label: "Coordinators", icon: BadgeCheck },
  { id: "facilitators", label: "Facilitators", icon: UserCog },
  { id: "graduates", label: "Graduates", icon: GraduationCap },
];

interface MemberSubNavProps {
  active: MemberTab;
  onChange: (tab: MemberTab) => void;
}

export function MemberSubNav({ active, onChange }: MemberSubNavProps) {
  return (
    <div className="lg:w-52 lg:shrink-0">
      <p className="mb-3 text-sm font-semibold text-foreground">Members</p>
      <nav className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-current={active === tab.id ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active === tab.id
                ? "bg-sidebar-active text-sidebar-active-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <tab.icon className="h-[18px] w-[18px]" />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
