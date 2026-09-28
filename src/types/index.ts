export type Trend = "up" | "down";

export interface StatMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: Trend;
  caption: string;
  icon: string;
}

export type VerificationStatus =
  | "active"
  | "verified"
  | "approved"
  | "pending"
  | "inactive"
  | "rejected"
  | "suspended"
  | "graduated"
  | "returned"
  | "ongoing"
  | "upcoming"
  | "archived"
  | "published"
  | "cancelled"
  | "issued";

export type UserRoleCode =
  | "NATIONAL_ADMIN"
  | "COORDINATOR"
  | "FACILITATOR"
  | "STUDENT";

export type MemberRole =
  | "Student"
  | "Coordinator"
  | "Facilitator"
  | "Alumna"
  | "Graduate";

export interface Member {
  id: string;
  name: string;
  memberId: string;
  avatar: string;
  role: MemberRole;
  affiliation: string;
  district: string;
  lastActivityDate: string;
  joinedDate: string;
  graduationYear: string;
  status: VerificationStatus;
}

export interface School {
  id: string;
  name: string;
  logo: string;
  country?: string;
  district: string;
  activities: number;
  lastActivityDate: string;
  coordinatorName: string;
  coordinatorPhone: string;
  coordinatorEmail?: string;
  status: VerificationStatus;
}

export interface Activity {
  id: string;
  schoolName: string;
  schoolLogo: string;
  activityName: string;
  description: string;
  category?: string;
  coordinatorName?: string;
  date: string;
  attachments: number;
  status: VerificationStatus;
}

export interface CertificationRequest {
  id: string;
  schoolName: string;
  schoolLogo: string;
  certificateCount: number;
  activityName?: string;
  memberNames?: string[];
  requestDate: string;
  attachments: number;
  status: VerificationStatus;
}

export interface PlpEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  host: string;
  category: string;
  school: string;
  district: string;
  country?: string;
  location?: string;
  participants: number;
  date: string;
  time: string;
  submittedOn?: string;
  availability: VerificationStatus;
  status: VerificationStatus;
  attendanceConfirmed?: boolean;
  attachments?: string;
}

export interface Resource {
  id: string;
  fileName: string;
  fileUrl?: string;
  fileSize: string;
  description: string;
  module: string;
  category?: string;
  availability: VerificationStatus;
  lastUpdate: string;
}

export interface CurriculumModule {
  id: string;
  title: string;
  lastUpdated: string;
}

export interface Report {
  id: string;
  name: string;
  category: string;
  dateRange: string;
  generatedOn: string;
  format: "PDF" | "XLS" | "CSV";
}

export interface AppNotification {
  id: string;
  type: "success" | "info" | "warning";
  title: string;
  message: string;
  read?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: VerificationStatus;
  publishedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  location?: string;
  status: VerificationStatus;
}

export interface Certificate {
  id: string;
  number: string;
  qrCode: string;
  activityName: string;
  issueDate: string;
  status: VerificationStatus;
  member?: { name: string; memberCode: string };
  school?: { name: string };
}

export interface StudentProfile {
  name: string;
  memberId: string;
  school: string;
  joinDate: string;
  graduationStatus: string;
  gender?: string;
  className?: string;
  activitiesParticipated: Array<{ id: string; name: string; category?: string; occurredAt: string }>;
  certificatesEarned: Certificate[];
}

export interface EventUpdate {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  fileName: string;
  fileSize: string;
  image: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  roleCode?: UserRoleCode;
  schoolId?: string | null;
}
