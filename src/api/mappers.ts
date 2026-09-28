import type {
  Activity,
  AppNotification,
  CertificationRequest,
  Member,
  MemberRole,
  PlpEvent,
  Report,
  Resource,
  School,
  VerificationStatus,
} from "@/types";

function toStatus(value: string): VerificationStatus {
  return value.toLowerCase() as VerificationStatus;
}

function kindToRole(kind: string): MemberRole {
  const map: Record<string, MemberRole> = {
    STUDENT: "Student",
    COORDINATOR: "Coordinator",
    FACILITATOR: "Facilitator",
    GRADUATE: "Graduate",
  };
  return map[kind] ?? "Student";
}

export function mapMember(row: Record<string, unknown>): Member {
  const school = row.school as { name?: string } | undefined;
  return {
    id: String(row.id),
    name: String(row.name),
    memberId: String(row.memberCode),
    avatar: String(row.avatarUrl ?? ""),
    role: kindToRole(String(row.kind)),
    affiliation: school?.name ?? String(row.affiliation),
    district: String(row.district),
    lastActivityDate: String(row.updatedAt ?? row.joinedAt),
    joinedDate: String(row.joinedAt),
    graduationYear: row.graduationYear ? String(row.graduationYear) : "—",
    status: toStatus(String(row.status)),
  };
}

export function mapSchool(row: Record<string, unknown>): School {
  const counts = row._count as { activities?: number } | undefined;
  return {
    id: String(row.id),
    name: String(row.name),
    logo: String(row.logoUrl ?? ""),
    district: String(row.district),
    country: String(row.country ?? "Rwanda"),
    activities: counts?.activities ?? 0,
    lastActivityDate: String(row.lastActivityAt ?? row.updatedAt),
    coordinatorName: String(row.coordinatorName),
    coordinatorPhone: String(row.coordinatorPhone),
    coordinatorEmail: String(row.coordinatorEmail ?? ""),
    status: toStatus(String(row.status)),
  };
}

export function mapActivity(row: Record<string, unknown>): Activity {
  const school = row.school as { name?: string; logoUrl?: string; coordinatorName?: string } | undefined;
  return {
    id: String(row.id),
    schoolName: school?.name ?? "—",
    schoolLogo: school?.logoUrl ?? "",
    activityName: String(row.name),
    description: String(row.description),
    category: String(row.category ?? "—"),
    coordinatorName: String(row.coordinatorName ?? school?.coordinatorName ?? "—"),
    date: String(row.occurredAt),
    attachments: Number(row.attachments ?? 0),
    status: toStatus(String(row.status)),
  };
}

export function mapCertification(row: Record<string, unknown>): CertificationRequest {
  const school = row.school as { name?: string; logoUrl?: string } | undefined;
  const members = row.members as Array<{ name?: string; memberCode?: string }> | undefined;
  return {
    id: String(row.id),
    schoolName: school?.name ?? "—",
    schoolLogo: school?.logoUrl ?? "",
    certificateCount: Number(row.certificates),
    activityName: String(row.activityName ?? "PLP Leadership Program"),
    memberNames: members?.map((member) => `${member.name ?? "Member"}${member.memberCode ? ` (${member.memberCode})` : ""}`) ?? [],
    requestDate: String(row.requestedAt),
    attachments: Number(row.attachments ?? 0),
    status: toStatus(String(row.status)),
  };
}

export function mapEvent(row: Record<string, unknown>): PlpEvent {
  const school = row.school as { name?: string; district?: string; country?: string } | undefined;
  const startsAt = new Date(String(row.startsAt));
  return {
    id: String(row.id),
    title: String(row.name),
    description: String(row.description),
    type: String(row.level),
    host: String(row.host),
    category: String(row.category ?? "—"),
    school: school?.name ?? "National",
    district: school?.district ?? "—",
    country: school?.country ?? "Rwanda",
    location: String(row.location ?? "—"),
    participants: Number(row.participants ?? 0),
    date: startsAt.toISOString().split("T")[0],
    time: startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    availability: row.isPublished ? "published" : toStatus(String(row.status)),
    status: toStatus(String(row.status)),
    attendanceConfirmed: Boolean(row.attendanceConfirmed),
  };
}

export function mapResource(row: Record<string, unknown>): Resource {
  const module = row.module as { name?: string } | undefined;
  return {
    id: String(row.id),
    fileName: String(row.fileName),
    fileUrl: row.fileUrl ? String(row.fileUrl) : undefined,
    fileSize: String(row.fileSize),
    description: String(row.description),
    module: module?.name ?? "—",
    category: String(row.category ?? "OTHER"),
    availability: toStatus(String(row.status)),
    lastUpdate: String(row.updatedAt ?? row.createdAt),
  };
}

export function mapReport(row: Record<string, unknown>): Report {
  const start = new Date(String(row.rangeStart));
  const end = new Date(String(row.rangeEnd));
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    dateRange: `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`,
    generatedOn: String(row.generatedAt),
    format: String(row.format) as Report["format"],
  };
}

export function mapNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    type: (row.type as AppNotification["type"]) ?? "info",
    title: String(row.title),
    message: String(row.message),
    read: Boolean(row.read),
  };
}
