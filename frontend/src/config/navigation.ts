import {
  LayoutGrid,
  School,
  Users,
  BookOpen,
  Award,
  CalendarDays,
  BarChart3,
  Bell,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { UserRoleCode } from "@/types";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles?: UserRoleCode[];
}

export const nationalNav: NavItem[] = [
  { label: "Overview", to: "/dashboard", icon: LayoutGrid, roles: ["NATIONAL_ADMIN"] },
  { label: "Schools", to: "/schools", icon: School, roles: ["NATIONAL_ADMIN"] },
  { label: "Members", to: "/members", icon: Users, roles: ["NATIONAL_ADMIN"] },
  { label: "Program", to: "/program", icon: BookOpen, roles: ["NATIONAL_ADMIN"] },
  { label: "Certification", to: "/certification", icon: Award, roles: ["NATIONAL_ADMIN"] },
  { label: "Events", to: "/events", icon: CalendarDays, roles: ["NATIONAL_ADMIN"] },
  { label: "Announcements", to: "/announcements", icon: Megaphone, roles: ["NATIONAL_ADMIN"] },
  { label: "Reports & Analytics", to: "/reports", icon: BarChart3, roles: ["NATIONAL_ADMIN"] },
  { label: "Notifications", to: "/notifications", icon: Bell, roles: ["NATIONAL_ADMIN"] },
];

export const coordinatorNav: NavItem[] = [
  { label: "Overview", to: "/coordinator", icon: LayoutGrid, roles: ["COORDINATOR"] },
  { label: "Members", to: "/coordinator/members", icon: Users, roles: ["COORDINATOR"] },
  { label: "Activities", to: "/coordinator/activities", icon: BookOpen, roles: ["COORDINATOR"] },
  { label: "Meetings", to: "/coordinator/meetings", icon: CalendarDays, roles: ["COORDINATOR"] },
  { label: "Events", to: "/coordinator/events", icon: CalendarDays, roles: ["COORDINATOR"] },
  { label: "Certificates", to: "/coordinator/certificates", icon: Award, roles: ["COORDINATOR"] },
  { label: "Documents", to: "/coordinator/documents", icon: BookOpen, roles: ["COORDINATOR"] },
  { label: "School Profile", to: "/coordinator/profile", icon: School, roles: ["COORDINATOR"] },
  { label: "Notifications", to: "/notifications", icon: Bell, roles: ["COORDINATOR"] },
];

export function getNavForRole(roleCode?: UserRoleCode): NavItem[] {
  if (roleCode === "COORDINATOR") return coordinatorNav;
  return nationalNav;
}

/** @deprecated use getNavForRole */
export const mainNav = nationalNav;
