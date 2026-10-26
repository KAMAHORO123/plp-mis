import { useEffect, useState } from "react";
import { platformApi } from "./platform-api";
import { useLiveTick } from "./live";

type Named = { name: string; value: number };
type Change = { current: number; previous: number };
/** One row per month for the last 12 months (oldest first), keyed by "YYYY-MM". */
export type MonthRow<K extends string> = { month: string } & Record<K, number>;
export interface ReportTask { id: string; title: string; detail: string; status: string; value: string; link: string }
export interface AdminOverview { role: "admin"; members: number; staff: number; pendingAccounts: number; schools: number; activities: number; upcomingActivities: number; reportsSubmitted: number; attendance: number; creditsAwarded: number; coursesPublished: number; coursesCompleted: number; coursesInProgress: number; openOpportunities: number; certificatesIssued: number; pathways: Named[]; tasks: ReportTask[];
  trend: MonthRow<"activities" | "attendance" | "credits" | "members" | "completions">[]; change: { members: Change; credits: Change; completions: Change };
  activityTypes: Named[]; topSchools: { name: string; activities: number; attendance: number }[]; mentoring: Named[] }
export interface MemberOverview { role: string; coursesInProgress: number; coursesCompleted: number; credits: number; certificates: number; activitiesAttended: number; activityHours: number; volunteerHours: number; upcomingActivities: number; pathways: Named[] }

/** Figures computed on the server from the real records; refreshes live. `null` while loading or if unavailable. */
export function useOverview<T extends AdminOverview | MemberOverview>() {
  const [data, setData] = useState<T | null>(null);
  const live = useLiveTick();
  useEffect(() => {
    let active = true;
    platformApi<T>("/reports/overview").then((d) => { if (active) setData(d); }).catch(() => {});
    return () => { active = false; };
  }, [live]);
  return data;
}
/** Shows a count, or a dash while the real figure is still loading, never a misleading 0. */
export const figure = (n: number | undefined | null) => (typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en") : "—");
