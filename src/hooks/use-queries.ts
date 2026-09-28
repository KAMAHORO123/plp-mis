import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/app/query-client";
import { USE_MOCK, mockResponse } from "@/api/client";
import * as data from "@/api/mock/datasets";
import {
  activitiesApi,
  announcementsApi,
  certificationsApi,
  certificatesApi,
  dashboardApi,
  eventsApi,
  meetingsApi,
  membersApi,
  notificationsApi,
  programApi,
  reportsApi,
  schoolsApi,
  statsToMetrics,
} from "@/api/services";
import type { StatMetric } from "@/types";

export const queryKeys = {
  dashboardStats: ["dashboard-stats"] as const,
  dashboardOverview: (scope: "national" | "coordinator") => ["dashboard-overview", scope] as const,
  members: (kind?: string) => ["members", kind] as const,
  schools: ["schools"] as const,
  applications: ["applications"] as const,
  activities: ["activities"] as const,
  certifications: ["certifications"] as const,
  certificates: ["certificates"] as const,
  events: (params?: string) => ["events", params] as const,
  meetings: ["meetings"] as const,
  resources: ["resources"] as const,
  modules: ["modules"] as const,
  pendingMembers: ["members", "pending"] as const,
  pendingSchools: ["schools", "pending"] as const,
  reports: ["reports"] as const,
  notifications: ["notifications"] as const,
  announcements: ["announcements"] as const,
};

const nationalStatConfig = [
  { key: "totalSchools", label: "Total Schools", icon: "school" },
  { key: "activeSchools", label: "Active Schools", icon: "users" },
  { key: "pendingSchoolApplications", label: "Pending Applications", icon: "alert" },
  { key: "totalCoordinators", label: "Total Coordinators", icon: "shield" },
  { key: "totalMembers", label: "Total Members", icon: "users" },
  { key: "totalGraduates", label: "Total Graduates", icon: "award" },
  { key: "totalActivities", label: "Total Activities", icon: "calendar" },
  { key: "totalMeetings", label: "Total Meetings", icon: "calendar" },
  { key: "totalUpcomingEvents", label: "Upcoming Events", icon: "calendar" },
  { key: "totalCertificatesIssued", label: "Certificates Issued", icon: "award" },
];

const coordinatorStatConfig = [
  { key: "totalMembers", label: "Total Members", icon: "users" },
  { key: "graduates", label: "Graduates", icon: "award" },
  { key: "activitiesCompleted", label: "Activities Completed", icon: "calendar" },
  { key: "meetingsHeld", label: "Meetings Held", icon: "calendar" },
  { key: "upcomingEvents", label: "Upcoming Events", icon: "calendar" },
  { key: "certificatesIssued", label: "Certificates Issued", icon: "award" },
];

export function useDashboardStats(scope: "national" | "coordinator" = "national") {
  return useQuery({
    queryKey: [...queryKeys.dashboardStats, scope],
    queryFn: async (): Promise<StatMetric[]> => {
      if (USE_MOCK) {
        const { overviewStats } = await import("@/api/mock/metrics");
        return mockResponse(overviewStats);
      }
      const stats = await dashboardApi.stats();
      const config = scope === "national" ? nationalStatConfig : coordinatorStatConfig;
      return statsToMetrics(stats, config);
    },
    staleTime: 300_000,
  });
}

export function useDashboardOverview(scope: "national" | "coordinator" = "national") {
  return useQuery({
    queryKey: queryKeys.dashboardOverview(scope),
    queryFn: async () => {
      if (USE_MOCK) {
        const { overviewStats } = await import("@/api/mock/metrics");
        return {
          stats: overviewStats,
          activities: data.activities.slice(0, 9),
          applications: scope === "national" ? data.schools.filter((s) => s.status === "pending").slice(0, 10) : [],
          events: data.events.slice(0, 8),
        };
      }

      const overview = await dashboardApi.overview();
      const config = scope === "national" ? nationalStatConfig : coordinatorStatConfig;
      return {
        ...overview,
        stats: statsToMetrics(overview.stats, config),
      };
    },
    staleTime: 300_000,
  });
}

export function prefetchDashboardOverview(scope: "national" | "coordinator" = "national") {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.dashboardOverview(scope),
    queryFn: async () => {
      const overview = await dashboardApi.overview();
      const config = scope === "national" ? nationalStatConfig : coordinatorStatConfig;
      return {
        ...overview,
        stats: statsToMetrics(overview.stats, config),
      };
    },
    staleTime: 300_000,
  });
}

export function useMembers(kind?: string, status?: string) {
  return useQuery({
    queryKey: status ? queryKeys.pendingMembers : queryKeys.members(kind),
    queryFn: () =>
      USE_MOCK
        ? mockResponse(
            data.members.filter((m) => !status || m.status === status)
          )
        : membersApi.list(kind?.toUpperCase(), status?.toUpperCase()),
    staleTime: 300_000,
  });
}

export function useSchools(status?: string) {
  return useQuery({
    queryKey: status ? queryKeys.pendingSchools : queryKeys.schools,
    queryFn: () =>
      USE_MOCK
        ? mockResponse(
            status
              ? data.schools.filter((s) => s.status === status)
              : data.schools
          )
        : schoolsApi.list(status),
    staleTime: 300_000,
  });
}

export function useProgramModules() {
  return useQuery({
    queryKey: queryKeys.modules,
    queryFn: async () => {
      if (USE_MOCK) {
        const { curriculumModules } = await import("@/api/mock/datasets");
        return curriculumModules;
      }
      const modules = await programApi.modules();
      return modules.map((m) => ({
        id: m.id,
        title: m.name,
        lastUpdated: new Date(m.lastUpdated).toLocaleDateString(),
      }));
    },
  });
}

export function useSchoolApplications() {
  return useQuery({
    queryKey: queryKeys.applications,
    queryFn: () =>
      USE_MOCK
        ? mockResponse(data.schools.filter((s) => s.status === "pending"))
        : schoolsApi.applications(),
    staleTime: 300_000,
  });
}

export function useActivities(pageSize = 100) {
  return useQuery({
    queryKey: [...queryKeys.activities, pageSize],
    queryFn: () =>
      USE_MOCK ? mockResponse(data.activities.slice(0, pageSize)) : activitiesApi.list(pageSize),
    staleTime: 300_000,
  });
}

export function useCertifications() {
  return useQuery({
    queryKey: queryKeys.certifications,
    queryFn: () =>
      USE_MOCK ? mockResponse(data.certifications) : certificationsApi.list(),
  });
}

export function useCertificates() {
  return useQuery({
    queryKey: queryKeys.certificates,
    queryFn: async () => {
      if (USE_MOCK) return mockResponse([]);
      const res = await certificatesApi.list();
      return res.data;
    },
  });
}

export function useEvents(params?: string) {
  return useQuery({
    queryKey: queryKeys.events(params),
    queryFn: () =>
      USE_MOCK ? mockResponse(data.events) : eventsApi.list(params),
    staleTime: 300_000,
  });
}

export function useUpcomingEvents() {
  return useEvents("status=UPCOMING");
}

export function useMeetings() {
  return useQuery({
    queryKey: queryKeys.meetings,
    queryFn: async () => {
      if (USE_MOCK) return mockResponse([]);
      const res = await meetingsApi.list();
      return res.data;
    },
  });
}

export function useResources() {
  return useQuery({
    queryKey: queryKeys.resources,
    queryFn: () =>
      USE_MOCK ? mockResponse(data.resources) : programApi.resources(),
  });
}

export function useReports() {
  return useQuery({
    queryKey: queryKeys.reports,
    queryFn: () =>
      USE_MOCK ? mockResponse(data.reports) : reportsApi.list(),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () =>
      USE_MOCK ? mockResponse(data.notifications) : notificationsApi.list(),
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements,
    queryFn: async () => {
      if (USE_MOCK) return mockResponse([]);
      const res = await announcementsApi.list();
      return res.data;
    },
  });
}

export function useEventUpdates() {
  return useQuery({
    queryKey: ["event-updates"],
    queryFn: () => mockResponse(data.eventUpdates),
  });
}
