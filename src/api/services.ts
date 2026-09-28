import { apiGet, apiSend, apiUrl } from "@/api/client";
import {
  mapActivity,
  mapCertification,
  mapEvent,
  mapMember,
  mapNotification,
  mapReport,
  mapResource,
  mapSchool,
} from "@/api/mappers";
import type {
  Activity,
  AppNotification,
  Paginated,
  PlpEvent,
  Report,
  School,
  StatMetric,
  User,
} from "@/types";

interface ApiUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  schoolId: string | null;
}

function toUser(u: ApiUser): User {
  const roleLabels: Record<string, string> = {
    NATIONAL_ADMIN: "National Administrator",
    COORDINATOR: "School Coordinator",
    FACILITATOR: "Facilitator",
    STUDENT: "Student",
  };
  return {
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    avatar: u.avatarUrl ?? "",
    role: roleLabels[u.role] ?? u.role,
    roleCode: u.role as User["roleCode"],
    schoolId: u.schoolId,
  };
}

async function fetchPage<T>(
  path: string,
  mapper: (row: Record<string, unknown>) => T
): Promise<T[]> {
  const res = await apiGet<Paginated<Record<string, unknown>>>(path);
  return res.data.map(mapper);
}

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiSend<{ user: ApiUser; token: string }>("/auth/login", "POST", {
      email,
      password,
    });
    return { user: toUser(res.user), token: res.token };
  },
  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    const res = await apiSend<{ user: ApiUser; token: string }>("/auth/register", "POST", data);
    return { user: toUser(res.user), token: res.token };
  },
  me: async () => {
    const res = await apiGet<ApiUser>("/auth/me");
    return toUser(res);
  },
};

export const publicSchoolApi = {
  apply: (data: Record<string, unknown>) =>
    apiSend("/public/school-applications", "POST", data),
};

export const dashboardApi = {
  stats: () => apiGet<Record<string, number>>("/dashboard/stats"),
  overview: async () => {
    const res = await apiGet<{
      stats: Record<string, number>;
      activities: Record<string, unknown>[];
      applications: Record<string, unknown>[];
      events: Record<string, unknown>[];
    }>("/dashboard/overview");

    return {
      stats: res.stats,
      activities: res.activities.map(mapActivity) as Activity[],
      applications: res.applications.map(mapSchool) as School[],
      events: res.events.map(mapEvent) as PlpEvent[],
    };
  },
};

export const schoolsApi = {
  list: (status?: string) =>
    fetchPage(
      `/schools?pageSize=100${status ? `&status=${status.toUpperCase()}` : ""}`,
      mapSchool
    ),
  applications: () => fetchPage("/schools/applications?pageSize=100", mapSchool),
  get: (id: string) => apiGet<Record<string, unknown>>(`/schools/${id}`),
  create: (data: Record<string, unknown>) => apiSend("/schools", "POST", data),
  updateStatus: (id: string, status: string) =>
    apiSend(`/schools/${id}/status`, "PATCH", { status }),
  update: (id: string, data: Record<string, unknown>) =>
    apiSend(`/schools/${id}`, "PATCH", data),
  remove: (id: string) => apiSend(`/schools/${id}`, "DELETE"),
};

export const membersApi = {
  list: (kind?: string, status?: string) =>
    fetchPage(
      `/members?pageSize=100${kind ? `&kind=${kind}` : ""}${status ? `&status=${status}` : ""}`,
      mapMember
    ),
  get: (id: string) => apiGet<Record<string, unknown>>(`/members/${id}`),
  create: (data: Record<string, unknown>) => apiSend("/members", "POST", data),
  update: (id: string, data: Record<string, unknown>) =>
    apiSend(`/members/${id}`, "PATCH", data),
  remove: (id: string) => apiSend(`/members/${id}`, "DELETE"),
};

export const activitiesApi = {
  list: (pageSize = 100) => fetchPage(`/activities?pageSize=${pageSize}`, mapActivity),
  get: (id: string) => apiGet<Record<string, unknown>>(`/activities/${id}`),
  create: (data: Record<string, unknown>) => apiSend("/activities", "POST", data),
  update: (id: string, data: Record<string, unknown>) =>
    apiSend(`/activities/${id}`, "PATCH", data),
  updateStatus: (id: string, status: string) =>
    apiSend(`/activities/${id}/status`, "PATCH", { status }),
  remove: (id: string) => apiSend(`/activities/${id}`, "DELETE"),
};

export const meetingsApi = {
  list: () => apiGet<Paginated<Record<string, unknown>>>("/meetings?pageSize=100"),
  create: (data: Record<string, unknown>) => apiSend("/meetings", "POST", data),
};

export const eventsApi = {
  list: (params?: string) =>
    fetchPage(`/events?pageSize=100${params ? `&${params}` : ""}`, mapEvent),
  get: (id: string) => apiGet<Record<string, unknown>>(`/events/${id}`),
  create: (data: Record<string, unknown>) => apiSend("/events", "POST", data),
  update: (id: string, data: Record<string, unknown>) =>
    apiSend(`/events/${id}`, "PATCH", data),
  publish: (id: string) => apiSend(`/events/${id}/publish`, "PATCH", {}),
  confirmAttendance: (id: string) => apiSend(`/events/${id}/attendance`, "PATCH", {}),
  remove: (id: string) => apiSend(`/events/${id}`, "DELETE"),
};

export const certificationsApi = {
  list: (status?: string) =>
    fetchPage(
      `/certifications?pageSize=100${status ? `&status=${status.toUpperCase()}` : ""}`,
      mapCertification
    ),
  get: (id: string) => apiGet<Record<string, unknown>>(`/certifications/${id}`),
  request: (data: Record<string, unknown>) => apiSend("/certifications", "POST", data),
  updateStatus: (id: string, status: string) =>
    apiSend(`/certifications/${id}/status`, "PATCH", { status }),
};

export const certificatesApi = {
  list: () => apiGet<Paginated<Record<string, unknown>>>("/certificates?pageSize=100"),
  create: (data: Record<string, unknown>) => apiSend("/certificates", "POST", data),
  verify: (code: string) => apiGet(`/public/verify/${code}`),
  downloadUrl: (id: string) => apiUrl(`/certificates/${id}/download`),
  downloadAllUrl: () => apiUrl("/certificates/download/all"),
};

export const programApi = {
  modules: () => apiGet<Array<{ id: string; name: string; lastUpdated: string }>>("/program/modules"),
  resources: () => fetchPage("/program/resources?pageSize=100", mapResource),
  upload: (data: Record<string, unknown>) => apiSend("/program/resources", "POST", data),
  updateResource: (id: string, data: Record<string, unknown>) =>
    apiSend(`/program/resources/${id}`, "PATCH", data),
  archiveResource: (id: string) => apiSend(`/program/resources/${id}`, "DELETE"),
  downloadUrl: (id: string) => apiUrl(`/program/resources/${id}/download`),
};

export const reportsApi = {
  list: async (): Promise<Report[]> => {
    const rows = await apiGet<Record<string, unknown>[]>("/reports");
    return rows.map(mapReport);
  },
  generate: (data: Record<string, unknown>) => apiSend("/reports/generate", "POST", data),
};

export const notificationsApi = {
  list: async (): Promise<AppNotification[]> => {
    const rows = await apiGet<Record<string, unknown>[]>("/notifications");
    return rows.map(mapNotification);
  },
  markRead: (id: string) => apiSend(`/notifications/${id}/read`, "PATCH", {}),
  markAllRead: () => apiSend("/notifications/read-all", "PATCH", {}),
  remove: (id: string) => apiSend(`/notifications/${id}`, "DELETE"),
};

export const announcementsApi = {
  list: () => apiGet<Paginated<Record<string, unknown>>>("/announcements?pageSize=100"),
  create: (data: Record<string, unknown>) => apiSend("/announcements", "POST", data),
  update: (id: string, data: Record<string, unknown>) =>
    apiSend(`/announcements/${id}`, "PATCH", data),
  archive: (id: string) => apiSend(`/announcements/${id}`, "DELETE"),
};

export const publicApi = {
  studentProfile: (qrCode: string) => apiGet(`/public/student/${qrCode}`),
  website: () =>
    apiGet<{
      upcomingEvents: Record<string, unknown>[];
      recentActivities: Record<string, unknown>[];
      nationalAnnouncements: Record<string, unknown>[];
      syncedAt: string;
    }>("/public/website"),
};

export function statsToMetrics(
  stats: Record<string, number>,
  config: Array<{ key: string; label: string; icon: string }>
): StatMetric[] {
  return config.map(({ key, label, icon }) => ({
    id: key,
    label,
    value: String(stats[key] ?? 0),
    change: "—",
    trend: "up" as const,
    caption: "current total",
    icon,
  }));
}
