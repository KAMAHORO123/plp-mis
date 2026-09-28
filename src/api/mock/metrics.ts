import type { StatMetric } from "@/types";
import type { TrendPoint } from "@/components/charts/area-trend-chart";
import type { BarPoint } from "@/components/charts/bar-activity-chart";
import type { MultiLinePoint } from "@/components/charts/multi-line-chart";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const areaTrend: TrendPoint[] = MONTHS.map((label, i) => ({
  label,
  value: 600 + Math.round(Math.sin(i / 1.7) * 60) + i * 18,
}));

export const barTrend: BarPoint[] = MONTHS.map((label, i) => {
  const value = 480 + Math.round(Math.cos(i / 1.3) * 120) + (i % 3) * 40;
  return { label, value, total: value + 180 };
});

export const certificationTrend: MultiLinePoint[] = MONTHS.map((label, i) => ({
  label,
  Issued: 520 + i * 14 + Math.round(Math.sin(i) * 30),
  Requested: 360 + i * 12 + Math.round(Math.cos(i) * 24),
}));

export const overviewStats: StatMetric[] = [
  { id: "schools", label: "Active Schools", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "school" },
  { id: "students", label: "Registered Students", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "users" },
  { id: "coordinators", label: "Active Coordinators", value: "23,000", change: "20%", trend: "down", caption: "vs last month", icon: "shield" },
  { id: "activities", label: "Activities Conducted", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "calendar" },
  { id: "graduates", label: "Certified Graduates", value: "23,000", change: "20%", trend: "down", caption: "vs last month", icon: "award" },
];

export const schoolStats: StatMetric[] = [
  { id: "total", label: "Total Schools", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "school" },
  { id: "verified", label: "Verified", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "users" },
  { id: "pending", label: "Pending", value: "23,000", change: "20%", trend: "up", caption: "vs last month", icon: "shield" },
  { id: "inactive", label: "Inactive", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "alert" },
  { id: "suspended", label: "Suspended", value: "2", change: "20%", trend: "up", caption: "vs last month", icon: "x" },
];

export const schoolStatusDonut = [
  { label: "Active", value: 58, color: "#2563eb" },
  { label: "Inactive", value: 30, color: "#93c5fd" },
  { label: "Suspended", value: 12, color: "#dbeafe" },
];

type MemberTabStats = Record<string, StatMetric[]>;

export const memberStats: MemberTabStats = {
  overview: [
    { id: "total", label: "Total Members", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "users" },
    { id: "students", label: "Active Students", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "users" },
    { id: "coordinators", label: "Active Coordinators", value: "23,000", change: "20%", trend: "down", caption: "vs last month", icon: "shield" },
    { id: "graduates", label: "Certified Graduates", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "award" },
  ],
  students: [
    { id: "total", label: "Total Students", value: "13,390", change: "20%", trend: "up", caption: "vs last month", icon: "users" },
    { id: "new", label: "New Students", value: "3,390", change: "20%", trend: "up", caption: "vs last month", icon: "users" },
    { id: "active", label: "Active Students", value: "12,000", change: "20%", trend: "down", caption: "vs last month", icon: "shield" },
    { id: "certified", label: "Certified Students", value: "13,390", change: "20%", trend: "up", caption: "vs last month", icon: "award" },
  ],
  coordinators: [
    { id: "total", label: "Total Coordinators", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "shield" },
    { id: "new", label: "New Coordinators", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "users" },
    { id: "elder", label: "Elder Coordinators", value: "23,000", change: "20%", trend: "down", caption: "vs last month", icon: "shield" },
    { id: "perschool", label: "Coordinators Per School", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "award" },
  ],
  facilitators: [
    { id: "total", label: "Total Facilitators", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "shield" },
    { id: "new", label: "New Students", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "users" },
    { id: "active", label: "Active Students", value: "23,000", change: "20%", trend: "down", caption: "vs last month", icon: "shield" },
    { id: "certified", label: "Certified Students", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "award" },
  ],
  graduates: [
    { id: "total", label: "Total Graduates", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "award" },
    { id: "this", label: "This Years Graduates", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "users" },
    { id: "older", label: "Older Graduates", value: "23,000", change: "20%", trend: "down", caption: "vs last month", icon: "shield" },
    { id: "certified", label: "Certified Graduates", value: "23,390", change: "20%", trend: "up", caption: "vs last month", icon: "award" },
  ],
};

export const certificationStats: StatMetric[] = [
  { id: "pending", label: "Pending Requests", value: "24", change: "20%", trend: "up", caption: "vs last month", icon: "school" },
  { id: "scans", label: "QR Verification Scans", value: "3,420", change: "20%", trend: "up", caption: "vs last month", icon: "users" },
  { id: "issued", label: "Certificates Issued (This Year)", value: "9,210", change: "20%", trend: "down", caption: "vs last month", icon: "shield" },
  { id: "rejected", label: "Rejected Requests", value: "11", change: "20%", trend: "down", caption: "vs last month", icon: "award" },
];

export const eventStats: StatMetric[] = [
  { id: "upcoming", label: "Upcoming Events", value: "24", change: "20%", trend: "up", caption: "Core + Supplementary", icon: "calendar" },
  { id: "total", label: "Total Events (This Year)", value: "120", change: "20%", trend: "up", caption: "All submitted events", icon: "users" },
  { id: "schools", label: "Active Participating Schools", value: "94 Schools", change: "20%", trend: "down", caption: "At least 1 event participation", icon: "school" },
  { id: "requests", label: "Pending Event Requests", value: "14", change: "20%", trend: "up", caption: "Requested by schools", icon: "shield" },
  { id: "reports", label: "Pending Event Reports", value: "14", change: "20%", trend: "up", caption: "Awaiting verification", icon: "award" },
];

export const programStats: StatMetric[] = [
  { id: "modules", label: "Total Curriculum Modules", value: "24", change: "20%", trend: "up", caption: "Core + Supplementary", icon: "school" },
  { id: "uploaded", label: "Uploaded Resources", value: "120", change: "20%", trend: "up", caption: "Manuals, guides, materials", icon: "users" },
  { id: "update", label: "Last Update", value: "15, Jan, 2026", change: "20%", trend: "down", caption: "Curriculum revision date", icon: "shield" },
  { id: "version", label: "Active Curriculum Version", value: "v3.2 – 2026 Edition", change: "20%", trend: "up", caption: "Monthly Subscriptions", icon: "award" },
];

export const reportPerformanceStats: StatMetric[] = [
  { id: "newschools", label: "Newly Active Schools", value: "23,390", change: "20%", trend: "up", caption: "Schools with verified activity", icon: "calendar" },
  { id: "coords", label: "Active Coordinators", value: "10,200", change: "20%", trend: "up", caption: "Monthly Subscriptions", icon: "award" },
  { id: "students", label: "Registered Students", value: "23,000", change: "20%", trend: "down", caption: "Students enrolled in PLP programs", icon: "shield" },
  { id: "inactive", label: "Inactive Schools Rate", value: "$41,382.80", change: "20%", trend: "up", caption: "Schools inactive for 60+ days", icon: "shield" },
];

export const reportImpactStats: StatMetric[] = [
  { id: "total", label: "Total Activities Conducted", value: "$41,382.80", change: "20%", trend: "up", caption: "Verified activities only", icon: "shield" },
  { id: "period", label: "Activities This Period", value: "$64,240.60", change: "20%", trend: "up", caption: "Activities within selected date range", icon: "calendar" },
  { id: "graduates", label: "Certified Graduates", value: "$2,220.42", change: "20%", trend: "down", caption: "Students issued PLP certificates", icon: "award" },
  { id: "avg", label: "Avg. Activities per School", value: "$18.40", change: "20%", trend: "up", caption: "Engagement depth indicator", icon: "users" },
];

export const reportReadinessStats: StatMetric[] = [
  { id: "compliance", label: "Reporting Compliance Rate", value: "82%", change: "20%", trend: "up", caption: "Schools submitting reports on time", icon: "school" },
  { id: "evidence", label: "Evidence Completeness Rate", value: "68%", change: "20%", trend: "up", caption: "Fully documented activities", icon: "calendar" },
  { id: "success", label: "Verification Success Rate", value: "96.4%", change: "20%", trend: "down", caption: "Activities approved after review", icon: "shield" },
  { id: "rejected", label: "Rejected / Returned Activities", value: "3.6%", change: "20%", trend: "up", caption: "Activities requiring correction or rejection", icon: "alert" },
];
