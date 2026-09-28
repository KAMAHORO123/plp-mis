import { emptyOperations, type Operations, type HubFile } from "./operations-data";
import { demoAccounts, seedSchoolRecords, type SchoolRecords } from "./school-data";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  courses,
  opportunities,
  roles,
  type Course,
  type HubRole,
  type Opportunity,
} from "./data";
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: HubRole;
  bio: string;
  skills: string[];
  leadership: string[];
  clubIds: string[];
  joined: string;
  membership: "Pending" | "Approved" | "Rejected" | "Suspended";
  reviewNote?: string;
  credentialHash?: string;
  managedClubIds: string[];
  schoolId?: string;
  schoolName?: string;
  requestedRole?: string;
  memberCategory?: string;
  community?: string;
}
export interface Enrollment {
  memberId: string;
  courseId: string;
  lessons: number[];
  assignment: string;
  passed: boolean;
  completedAt?: string;
}
export interface HubCertificate {
  id: string;
  memberId: string;
  memberName: string;
  courseId: string;
  title: string;
  date: string;
}
export interface Credit {
  id: string;
  memberId: string;
  source: string;
  label: string;
  amount: number;
  date: string;
}
export interface Proof {
  id: string;
  memberId: string;
  programId: string;
  /** Legacy local records may retain this; ALX now uses certificate uploads only. */
  progress?: number;
  file?: string;
  fileName?: string;
  status: "Learning" | "Pending review" | "Recognized" | "Returned";
}
export interface Session {
  id: string;
  memberId: string;
  mentorId: string;
  date: string;
  goal: string;
  status: "Requested" | "Completed" | "Cancelled";
  reflection?: string;
}
export interface Post {
  id: string;
  memberId: string;
  name: string;
  title: string;
  body: string;
  replies: { name: string; body: string }[];
}
export interface ClubActivity {
  id: string;
  clubId: string;
  title: string;
  date: string;
  type: "Meeting" | "Volunteering" | "Challenge" | "Recruitment";
  hours: number;
  attendees: string[];
  report: string;
  status: "Draft" | "Submitted" | "Reviewed";
  authorId: string;
}
export interface Project {
  id: string;
  memberId: string;
  title: string;
  description: string;
  hours: number;
  date: string;
}
export interface Invitation {
  id: string;
  code: string;
  email: string;
  clubId: string;
  createdBy: string;
  usedBy?: string;
  revoked?: boolean;
}
export interface HubState {
  schoolRecords: SchoolRecords;
  operations: Operations;
  version: 1;
  currentId: string;
  profiles: Profile[];
  invitations: Invitation[];
  membershipRequests: {
    memberId: string;
    motivation: string;
    entry: string;
    submittedAt: string;
  }[];
  courses: Course[];
  enrollments: Enrollment[];
  certificates: HubCertificate[];
  credits: Credit[];
  opportunities: Opportunity[];
  applications: {
    memberId: string;
    opportunityId: string;
    note: string;
    documents?: {kind:string; file:HubFile}[];
    date: string;
  }[];
  saved: { memberId: string; opportunityId: string }[];
  proofs: Proof[];
  sessions: Session[];
  posts: Post[];
  activities: ClubActivity[];
  projects: Project[];
  redemptions: { memberId: string; rewardId: string; date: string }[];
  outcomes: {
    id: string;
    memberId: string;
    type: string;
    detail: string;
    date: string;
  }[];
}
export const STORAGE_KEY = "plp-hub-v1";
export const today = () => new Date().toISOString().slice(0, 10);
export const uid = () => crypto.randomUUID();
function seed(): HubState {
  return {
    schoolRecords: seedSchoolRecords(),
    operations: emptyOperations(),
    version: 1,
    currentId: "demo-0",
    invitations: [],
    membershipRequests: [],
    profiles: roles.filter(role => role !== "School coordinator").map((role, i) => ({
      id: `demo-${i}`,
      name: [
        "Alex Member",
        "Sam University",
        "Jordan Community",
        "Taylor Club Leader",
        "Morgan Trainer",
        "Casey Administrator",
      ][i],
      email: `demo-${i}@example.test`,
      membership: "Approved",
      managedClubIds: i === 3 ? ["club-school"] : [],
      role,
      bio: "",
      skills: [],
      leadership: i === 3 ? ["Club leader"] : [],
      clubIds: i === 3 ? ["club-school"] : [],
      joined: today(),
    })),
    courses: courses.map((c) => ({ ...c, ownerId: "preview-trainer" })),
    opportunities,
    enrollments: [],
    certificates: [],
    credits: [],
    applications: [],
    saved: [],
    proofs: [],
    sessions: [],
    posts: [],
    projects: [],
    redemptions: [],
    outcomes: [],
    activities: [
      {
        id: "welcome-circle",
        clubId: "club-school",
        title: "Welcome & leadership circle",
        date: "2026-10-10",
        type: "Meeting",
        hours: 1,
        attendees: [],
        report: "",
        status: "Draft",
        authorId: "demo-3",
      },
    ],
  };
}
function withDemoAccounts(state: HubState): HubState {
  state.operations ??= emptyOperations();
  for(const a of state.activities) {
    const id=`legacy-${a.id}`;
    if(!state.operations.activities.some(x=>x.id===id)) state.operations.activities.push({id,hostId:a.clubId==='club-school'?'school-kigali':a.clubId,title:a.title,date:a.date,description:a.report||'Club activity',type:a.type,hours:a.hours,photos:[],authorId:a.authorId,attendees:a.attendees,report:a.report||undefined,reportedAt:a.report?a.date:undefined,reviewedAt:a.status==='Reviewed'?a.date:undefined});
  }

  const addTrainer = !state.profiles.some(p => p.id === "preview-trainer");
  if (addTrainer) state.courses.forEach(c => { if (c.ownerId === "demo-4") c.ownerId = "preview-trainer"; });
  for (const account of demoAccounts) {
    if (!state.profiles.some(p => p.id === account.id)) state.profiles.push({ ...account, bio: "Demo account", skills: [], leadership: [], clubIds: [], managedClubIds: [], joined: today(), membership: "Approved", credentialHash: "pbkdf2:plp-frontend-demo:5898a7037a3cbd6e4f1a3d5412b0264a47bb2ca1c38a5220b559855b785f7e9c" });
  }
  state.profiles.forEach(p => { if(p.role === 'Club leader') { p.role='School coordinator'; if(['demo-3','preview-leader'].includes(p.id))p.schoolId??='school-kigali'; } });
  return state;
}
function read(): HubState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const fresh = seed();
    if (saved?.version === 1) {
      saved.schoolRecords ??= seedSchoolRecords();
      saved.operations ??= emptyOperations();
      saved.invitations ??= [];
      saved.membershipRequests ??= [];
      if (Array.isArray(saved.profiles))
        saved.profiles = saved.profiles.map((p: Profile) => ({
          ...p,
          membership:
            p.membership === "Pending" || !p.membership ? "Approved" : p.membership,
          managedClubIds:
            p.managedClubIds ?? (p.id === "demo-3" ? ["club-school"] : []),
        }));
      if (Array.isArray(saved.courses))
        saved.courses = saved.courses.map((c: Course) => ({
          ...c,
          ownerId: c.ownerId ?? "demo-4",
        }));
    }
    if (
      saved?.version === 1 &&
      Object.keys(fresh).every(
        (key) =>
          key === "version" || key === "currentId" || key === "schoolRecords" || key === "operations" || Array.isArray(saved[key]),
      ) &&
      saved.profiles.some((p: Profile) => p.id === saved.currentId)
    )
      return withDemoAccounts(saved);
  } catch {
    /* A fresh demo remains usable if storage is malformed. */
  }
  return withDemoAccounts(seed());
}
export const SESSION_KEY = "plp-hub-session-v1";
export interface HubSession {
  profileId: string;
  kind: "applicant" | "member";
}
function readSession(): HubSession | null {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    return session &&
      typeof session.profileId === "string" &&
      ["applicant", "member"].includes(session.kind)
      ? session
      : null;
  } catch {
    return null;
  }
}
export async function credentialDigest(code: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code.trim()),
  );
  return Array.from(new Uint8Array(bytes), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
// Local preview only; production credentials must be verified by a server.
export async function createPasswordHash(password: string, salt: string = crypto.randomUUID()) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 210000, hash: "SHA-256" }, key, 256);
  const hash = Array.from(new Uint8Array(bits), x => x.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${salt}:${hash}`;
}
export async function verifyPassword(password: string, stored?: string) {
  if (!stored) return false;
  if (stored.startsWith("pbkdf2:")) return await createPasswordHash(password, stored.split(":")[1]) === stored;
  return await credentialDigest(password) === stored;
}
export function award(
  s: HubState,
  memberId: string,
  source: string,
  label: string,
  amount: number,
) {
  if (!s.credits.some((c) => c.memberId === memberId && c.source === source))
    s.credits.push({
      id: uid(),
      memberId,
      source,
      label,
      amount,
      date: today(),
    });
}
export function balance(s: HubState, memberId: string) {
  return s.credits
    .filter((c) => c.memberId === memberId)
    .reduce((sum, c) => sum + c.amount, 0);
}
export function completeCourse(
  s: HubState,
  memberId: string,
  courseId: string,
) {
  const e = s.enrollments.find(
    (x) => x.memberId === memberId && x.courseId === courseId,
  );
  const c = s.courses.find((x) => x.id === courseId);
  const p = s.profiles.find((x) => x.id === memberId);
  if (
    !e ||
    !c ||
    !p ||
    e.completedAt ||
    !e.passed ||
    e.assignment.trim().length < 30 ||
    !c.lessons.every((_, i) => e.lessons.includes(i))
  )
    return;
  e.completedAt = today();
  s.certificates.push({
    id: `PLP-DEMO-${uid()}`,
    memberId,
    memberName: p.name,
    courseId,
    title: c.title,
    date: today(),
  });
  award(s, memberId, `course:${courseId}`, `Completed ${c.title}`, 50);
  p.skills = [...new Set([...p.skills, ...c.skills])];
}
const HubContext = createContext<{
  state: HubState;
  profile: Profile;
  session: HubSession | null;
  isMember: boolean;
  openSession: (profileId: string, kind: HubSession["kind"]) => boolean;
  signOut: () => void;
  update: (fn: (draft: HubState) => void) => boolean;
} | null>(null);
export function HubProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HubState>(read);
  const [session, setSession] = useState<HubSession | null>(readSession);
  const member = state.profiles.find((p) => p.id === session?.profileId);
  const isMember =
    !!member && !!session && member.membership === "Approved";
  function openSession(profileId: string, kind: HubSession["kind"]) {
    try {
      const next = { profileId, kind };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      return true;
    } catch {
      toast.error(
        "Unable to start a local session. Enable browser storage and try again.",
      );
      return false;
    }
  }
  function signOut() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("plp-hub-new-code");
    setSession(null);
  }
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setState(read());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function update(fn: (draft: HubState) => void) {
    try {
      const current = read();
      const draft = structuredClone(current);
      fn(draft);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setState(draft);
      return true;
    } catch {
      toast.error(
        "Unable to save. Browser storage may be full or disabled. Download your records before clearing storage.",
      );
      return false;
    }
  }
  return (
    <HubContext.Provider
      value={{
        state,
        // Private pages are rendered only by MemberGuard. Public pages never display this fallback.
        profile: member ?? state.profiles[0],
        session,
        isMember,
        openSession,
        signOut,
        update,
      }}
    >
      {children}
    </HubContext.Provider>
  );
}
export function useHub() {
  const value = useContext(HubContext);
  if (!value) throw new Error("HubProvider required");
  return value;
}
