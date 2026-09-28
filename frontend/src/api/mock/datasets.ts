import type {
  Activity,
  AppNotification,
  CertificationRequest,
  CurriculumModule,
  EventUpdate,
  Member,
  PlpEvent,
  Report,
  Resource,
  School,
  VerificationStatus,
} from "@/types";

const AVATARS = [
  "https://i.pravatar.cc/120?img=12",
  "https://i.pravatar.cc/120?img=32",
  "https://i.pravatar.cc/120?img=45",
  "https://i.pravatar.cc/120?img=5",
  "https://i.pravatar.cc/120?img=15",
];

const DISTRICTS = [
  "Nyagatare",
  "Nyabihu",
  "Rwamagana",
  "Nyamasheke",
  "Nyaruguru",
  "Musanze",
  "Huye",
  "Gicumbi",
];

const SCHOOL_LOGO =
  "https://images.unsplash.com/photo-1562774053-701939374585?w=80&h=80&fit=crop";

const MEMBER_STATUSES: VerificationStatus[] = [
  "active",
  "pending",
  "active",
  "inactive",
  "graduated",
  "inactive",
  "active",
  "pending",
  "graduated",
];

const cycle = <T>(arr: T[], i: number) => arr[i % arr.length];

export const members: Member[] = Array.from({ length: 54 }, (_, i) => {
  const roles: Member["role"][] = [
    "Student",
    "Student",
    "Coordinator",
    "Facilitator",
    "Alumna",
    "Coordinator",
    "Facilitator",
    "Student",
    "Graduate",
  ];
  return {
    id: `mbr-${i + 1}`,
    name: "Lisa Steve",
    memberId: "334-456-566",
    avatar: cycle(AVATARS, i),
    role: cycle(roles, i),
    affiliation: i % 2 === 0 ? "RCA" : "National",
    district: cycle(DISTRICTS, i),
    lastActivityDate: "2025-06-02",
    joinedDate: "2025-06-02",
    graduationYear: "2025",
    status: cycle(MEMBER_STATUSES, i),
  };
});

const SCHOOL_STATUSES: VerificationStatus[] = [
  "active",
  "pending",
  "active",
  "suspended",
  "inactive",
  "pending",
  "pending",
  "active",
  "inactive",
];

export const schools: School[] = Array.from({ length: 48 }, (_, i) => ({
  id: `sch-${i + 1}`,
  name: "Rwanda Coding Academy",
  logo: SCHOOL_LOGO,
  district: cycle(DISTRICTS, i),
  activities: 34,
  lastActivityDate: "2025-06-02",
  coordinatorName: "John Doe",
  coordinatorPhone: "+250-796-402-840",
  status: cycle(SCHOOL_STATUSES, i),
}));

const ACTIVITY_STATUSES: VerificationStatus[] = [
  "verified",
  "pending",
  "verified",
  "rejected",
  "returned",
  "pending",
  "pending",
  "verified",
  "returned",
];

export const activities: Activity[] = Array.from({ length: 45 }, (_, i) => ({
  id: `act-${i + 1}`,
  schoolName: i % 4 === 1 ? "King David" : i % 4 === 2 ? "Huye TSS" : "Rwanda Coding Academy",
  schoolLogo: SCHOOL_LOGO,
  activityName: "Members Registration",
  description:
    "This activity was conducted to promote peaceful communication, conflict resolution, and student leadership.",
  date: "2025-06-02",
  attachments: i % 3 === 1 ? 0 : 12,
  status: cycle(ACTIVITY_STATUSES, i),
}));

const CERT_STATUSES: VerificationStatus[] = [
  "approved",
  "pending",
  "approved",
  "rejected",
  "pending",
  "pending",
  "approved",
  "approved",
  "approved",
];

export const certifications: CertificationRequest[] = Array.from(
  { length: 46 },
  (_, i) => ({
    id: `cert-${i + 1}`,
    schoolName: "Rwanda Coding Academy",
    schoolLogo: SCHOOL_LOGO,
    certificateCount: 230,
    requestDate: "2025-06-02",
    attachments: i % 3 === 1 ? 0 : 12,
    status: cycle(CERT_STATUSES, i),
  })
);

const EVENT_TITLES = [
  "National Peace Summit 2026",
  "Youth Leadership Forum",
  "Peace Awareness Week",
  "Regional Coordinator Training",
  "Community Service Day",
];

export const events: PlpEvent[] = Array.from({ length: 60 }, (_, i) => {
  const availabilities: VerificationStatus[] = ["ongoing", "upcoming"];
  const types = ["National Level", "School Level", "Zone Level"];
  return {
    id: `evt-${i + 1}`,
    title: cycle(EVENT_TITLES, i),
    description:
      "This activity was conducted to promote peaceful communication and student leadership.",
    type: cycle(types, i),
    host: i % 5 === 0 ? "PLP National" : "Rwanda Coding Academy",
    category: "Peace & Values Education",
    school: i % 5 === 1 ? "Unity High School" : "Rwanda Coding Academy",
    district: cycle(["National Level", "School Level", "Zone Level"], i),
    participants: 240,
    date: "2025-06-02",
    time: "2:00 am",
    submittedOn: "2025-06-02",
    availability: cycle(availabilities, i),
    status: cycle(["approved", "pending", "rejected", "approved"], i),
    attachments: "Doc & 12 Media",
  };
});

export const curriculumModules: CurriculumModule[] = [
  { id: "mod-1", title: "Peace Foundations", lastUpdated: "Jan 2026" },
  { id: "mod-2", title: "Leadership Development", lastUpdated: "Jan 2026" },
  { id: "mod-3", title: "Love and Unity", lastUpdated: "Jan 2026" },
];

const RESOURCE_STATUSES: VerificationStatus[] = [
  "active",
  "archived",
  "active",
  "archived",
  "active",
  "archived",
  "archived",
  "active",
  "active",
];

export const resources: Resource[] = Array.from({ length: 40 }, (_, i) => ({
  id: `res-${i + 1}`,
  fileName: "Training Manuals",
  fileSize: "216 KB",
  description:
    "This activity was conducted to promote peaceful communication, conflict resolution.",
  module: "Peace Foundations",
  availability: cycle(RESOURCE_STATUSES, i),
  lastUpdate: "2025-06-02",
}));

export const reports: Report[] = [
  {
    id: "rep-1",
    name: "National Activity Summary – Dec 2025",
    category: "Program",
    dateRange: "Dec 1–31, 2025",
    generatedOn: "Jan 2, 2026",
    format: "PDF",
  },
  {
    id: "rep-2",
    name: "School Compliance Report – Q4 2025",
    category: "Program",
    dateRange: "Dec 1–31, 2025",
    generatedOn: "Jan 2, 2026",
    format: "XLS",
  },
  {
    id: "rep-3",
    name: "Certification Issuance Report – 2025",
    category: "Program",
    dateRange: "Dec 1–31, 2025",
    generatedOn: "Jan 2, 2026",
    format: "XLS",
  },
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `rep-${i + 4}`,
    name: "District Impact Breakdown – Northern Province",
    category: "Program",
    dateRange: "Dec 1–31, 2025",
    generatedOn: "Jan 2, 2026",
    format: (i % 2 === 0 ? "PDF" : "XLS") as Report["format"],
  })),
];

export const notifications: AppNotification[] = [
  {
    id: "ntf-1",
    type: "success",
    title: "Successfully updated profile",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid pariatur, ipsum dolor.",
  },
  {
    id: "ntf-2",
    type: "info",
    title: "We've just released a new feature",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid pariatur, ipsum dolor.",
  },
  {
    id: "ntf-3",
    type: "success",
    title: "Successfully updated profile",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid pariatur, ipsum dolor.",
  },
  {
    id: "ntf-4",
    type: "success",
    title: "Successfully updated profile",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid pariatur, ipsum dolor.",
  },
];

export const eventUpdates: EventUpdate[] = Array.from({ length: 3 }, (_, i) => ({
  id: `upd-${i + 1}`,
  title: "PLP Mega Care - Mukamira, Nyabihu",
  description:
    "PLP Mega Care is a charity initiative by the Peace and Love Proclaimers (PLP)—a Rwandan youth-led organization—desi...",
  location: "Rwanda Coding Academy",
  date: "Sun, 14 June · 12:00 PM",
  fileName: "PLP Mega Care.zip",
  fileSize: "16 MB",
  image:
    "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=400&h=240&fit=crop",
}));
