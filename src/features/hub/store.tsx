import { translateUi, useSiteLanguage } from '../../i18n/language';
import { platformApi } from "./platform-api";
import { certificateReference } from "./certificate-id";
import { isSeededAccount, removeSeededAccounts } from "./account-cleanup";
import type { Announcement } from "./site-content";
import { emptyOperations, type Operations, type HubFile, type CommunityActivity } from "./operations-data";
import { seedSchoolRecords, demoSchools, type SchoolRecords, type School } from "./school-data";
import { createContext, useContext, useEffect, useState, type ReactNode, } from "react";
import { toast } from "sonner";
import { courses, mentors, opportunities, type Course, type HubRole, type Mentor, type Opportunity, } from "./data";
import { assessmentsFor, grade, wordCount, MIN_ASSIGNMENT_WORDS, type ActiveAttempt, type AssessmentAttempt } from "./assessments";
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
    /** Uploaded profile picture served by the platform, if any. */
    avatarUrl?: string;
}
export interface Enrollment {
    memberId: string;
    courseId: string;
    lessons: number[];
    assignment: string;
    passed: boolean;
    completedAt?: string;
    assignmentAt?: string;
    viewed?: number[];
    attempts?: AssessmentAttempt[];
    active?: ActiveAttempt;
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
    version?: number;
}
export interface Session {
    id: string;
    memberId: string;
    mentorId: string;
    date: string;
    goal: string;
    status: "Requested" | "Confirmed" | "Declined" | "Completed" | "Cancelled";
    topic?: string;
    reflection?: string;
    meetingLink?: string;
    sessionType?: "Online" | "In person" | "Visit";
    location?: string;
    mentorNotes?: string;
    declineReason?: string;
    requestedAt?: string;
    updatedAt?: string;
}
export interface MentorshipEmail {
    id: string;
    sessionId: string;
    kind: "requested" | "updated" | "cancelled" | "confirmed" | "declined" | "rescheduled" | "completed";
    to: string;
    toName: string;
    subject: string;
    sentAt: string;
    status: "Queued" | "Not delivered";
    error?: string;
}
export interface Post {
    id: string;
    memberId: string;
    name: string;
    title: string;
    body: string;
    replies: {
        name: string;
        body: string;
    }[];
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
    /** Approved accounts assigned to schools, used for activity attendance (from the platform). */
    schoolAccounts?: {
        id: string;
        name: string;
        email: string;
        school_id: string | null;
    }[];
    verifiedCreditBalance?: Record<string, number>;
    emailCleanupVersion?: number;
    announcement?: Announcement;
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
        documents?: {
            kind: string;
            file: HubFile;
        }[];
        /** True when the member applied on the organiser's website and recorded it here. */
        external?: boolean;
        date: string;
    }[];
    saved: {
        memberId: string;
        opportunityId: string;
    }[];
    proofs: Proof[];
    sessions: Session[];
    mentors: Mentor[];
    mentorEmails: MentorshipEmail[];
    posts: Post[];
    activities: ClubActivity[];
    projects: Project[];
    redemptions: {
        memberId: string;
        rewardId: string;
        date: string;
    }[];
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
        emailCleanupVersion: 1,
        schoolRecords: seedSchoolRecords(),
        operations: emptyOperations(),
        version: 1,
        currentId: "",
        invitations: [],
        membershipRequests: [],
        profiles: [
            {
                id: "dfe9f64c-c24d-4e5f-8e0a-64fa8d7f90d5",
                name: "Israel Nuru",
                email: "info@peaceloveproclaimers.org",
                role: "Administrator",
                membership: "Approved",
                bio: "Executive Director · Peace and Love Proclaimers",
                skills: ["Leadership", "Peacebuilding", "Youth Empowerment", "Strategic Planning"],
                leadership: ["Executive Director"],
                clubIds: ["club-school", "club-university", "club-homegroup", "club-canada"],
                managedClubIds: ["club-school", "club-university", "club-homegroup", "club-canada"],
                joined: "2007-01-01",
            },
        ],
        courses: courses.map((c) => ({ ...c })),
        opportunities,
        enrollments: [],
        certificates: [],
        credits: [],
        applications: [],
        saved: [],
        proofs: [],
        outcomes: [],
        activities: [],
        sessions: [],
        mentors: mentors.map((m) => ({ ...m })),
        mentorEmails: [],
        posts: [],
        projects: [],
        redemptions: [],
    };
}
function migrateState(state: HubState): HubState {
    removeSeededAccounts(state);
    // Earlier previews re-inserted sample session requests whenever the list was empty.
    delete (state as HubState & {
        mentorNotifications?: unknown;
    }).mentorNotifications;
    state.sessions = state.sessions.filter(r => !r.id.startsWith("sess-sample-"));
    if (!state.profiles.some(p => p.id === "dfe9f64c-c24d-4e5f-8e0a-64fa8d7f90d5")) {
        state.profiles.push({
            id: "dfe9f64c-c24d-4e5f-8e0a-64fa8d7f90d5",
            name: "Israel Nuru",
            email: "info@peaceloveproclaimers.org",
            role: "Administrator",
            membership: "Approved",
            bio: "Executive Director · Peace and Love Proclaimers",
            skills: ["Leadership", "Peacebuilding", "Youth Empowerment", "Strategic Planning"],
            leadership: ["Executive Director"],
            clubIds: ["club-school", "club-university", "club-homegroup", "club-canada"],
            managedClubIds: ["club-school", "club-university", "club-homegroup", "club-canada"],
            joined: "2007-01-01",
        });
    }
    state.certificates.forEach(c => { c.id = certificateReference(c.id); });
    state.operations ??= emptyOperations();
    for (const a of state.activities) {
        const id = `legacy-${a.id}`;
        if (!state.operations.activities.some(x => x.id === id))
            state.operations.activities.push({ id, hostId: a.clubId === 'club-school' ? 'school-kigali' : a.clubId, title: a.title, date: a.date, description: a.report || 'Club activity', type: a.type, hours: a.hours, photos: [], authorId: a.authorId, attendees: a.attendees, report: a.report || undefined, reportedAt: a.report ? a.date : undefined, reviewedAt: a.status === 'Reviewed' ? a.date : undefined });
    }
    state.profiles.forEach(p => { if (String(p.role) === 'School coordinator')
        p.role = 'Club leader'; if (p.requestedRole === 'School coordinator')
        p.requestedRole = 'Club leader'; });
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
            saved.sessions ??= [];
            saved.mentors ??= mentors.map((m) => ({ ...m }));
            saved.mentorEmails ??= [];
            saved.membershipRequests ??= [];
            if (Array.isArray(saved.profiles))
                saved.profiles = saved.profiles.map((p: Profile) => ({
                    ...p,
                    membership: p.membership ?? "Pending",
                    managedClubIds: p.managedClubIds ?? [],
                }));
            if (Array.isArray(saved.courses))
                saved.courses = saved.courses.map((c: Course) => ({
                    ...c,
                    ownerId: c.ownerId,
                }));
        }
        if (saved?.version === 1 &&
            Object.keys(fresh).every((key) => key === "emailCleanupVersion" || key === "version" || key === "currentId" || key === "schoolRecords" || key === "operations" || Array.isArray(saved[key]))) {
            const cleaned = migrateState(saved);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
            }
            catch { /* Keep cleanup active even if storage is unavailable. */ }
            return cleaned;
        }
    }
    catch {
        /* Start with an empty account list if storage is malformed. */
    }
    return seed();
}
export const SESSION_KEY = "plp-hub-session-v1";
export interface HubSession {
    profileId: string;
    kind: "applicant" | "member";
}
function readSession(): HubSession | null {
    try {
        const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
        if (session && (isSeededAccount(session.profileId) || !read().profiles.some(p => p.id === session.profileId))) {
            sessionStorage.removeItem(SESSION_KEY);
            return null;
        }
        return session &&
            typeof session.profileId === "string" &&
            ["applicant", "member"].includes(session.kind)
            ? session
            : null;
    }
    catch {
        return null;
    }
}
export async function credentialDigest(code: string) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code.trim()));
    return Array.from(new Uint8Array(bytes), (x) => x.toString(16).padStart(2, "0")).join("");
}
// Local preview only; production credentials must be verified by a server.
export async function createPasswordHash(password: string, salt: string = crypto.randomUUID()) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 210000, hash: "SHA-256" }, key, 256);
    const hash = Array.from(new Uint8Array(bits), x => x.toString(16).padStart(2, "0")).join("");
    return `pbkdf2:${salt}:${hash}`;
}
export async function verifyPassword(password: string, stored?: string) {
    if (!stored)
        return false;
    if (stored.startsWith("pbkdf2:"))
        return await createPasswordHash(password, stored.split(":")[1]) === stored;
    return await credentialDigest(password) === stored;
}
export function award(s: HubState, memberId: string, source: string, label: string, amount: number) {
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
    if (s.verifiedCreditBalance)
        return s.verifiedCreditBalance[memberId] ?? 0;
    return s.credits
        .filter((c) => c.memberId === memberId)
        .reduce((sum, c) => sum + c.amount, 0);
}
export function completeCourse(s: HubState, memberId: string, courseId: string) {
    const e = s.enrollments.find((x) => x.memberId === memberId && x.courseId === courseId);
    const c = s.courses.find((x) => x.id === courseId);
    const p = s.profiles.find((x) => x.id === memberId);
    if (!e ||
        !c ||
        !p ||
        e.completedAt ||
        !e.passed ||
        wordCount(e.assignment) < MIN_ASSIGNMENT_WORDS ||
        !c.lessons.every((_, i) => e.lessons.includes(i)))
        return;
    e.completedAt = today();
    s.certificates.push({
        id: `PLP-${new Date().getFullYear()}-${uid()}`,
        memberId,
        memberName: p.name,
        courseId,
        title: c.title,
        date: today(),
    });
    award(s, memberId, `course:${courseId}`, `Completed ${c.title}`, 50);
    p.skills = [...new Set([...p.skills, ...c.skills])];
}
/** Grades the learner's open attempt. Modules and courses complete only through passed assessments. */
export function finishAttempt(s: HubState, memberId: string, courseId: string, reason: AssessmentAttempt["reason"]) {
    const e = s.enrollments.find((x) => x.memberId === memberId && x.courseId === courseId);
    const c = s.courses.find((x) => x.id === courseId);
    const assessment = c && e?.active && assessmentsFor(c).find((a) => a.id === e.active!.assessmentId);
    if (!e || !c || !assessment)
        return undefined;
    const attempt = grade(assessment, e.active!, reason, uid());
    e.attempts = [...(e.attempts ?? []), attempt];
    delete e.active;
    if (attempt.passed && assessment.moduleIndex !== undefined && !e.lessons.includes(assessment.moduleIndex))
        e.lessons.push(assessment.moduleIndex);
    if (attempt.passed && assessment.kind === "exam")
        e.passed = true;
    completeCourse(s, memberId, courseId);
    return attempt;
}
const HubContext = createContext<{
    state: HubState;
    profile: Profile;
    session: HubSession | null;
    isMember: boolean;
    creditsLoading: boolean;
    creditsError: string;
    openSession: (profileId: string, kind: HubSession["kind"]) => boolean;
    signOut: () => void;
    update: (fn: (draft: HubState) => void) => boolean;
} | null>(null);
export function HubProvider({ children }: {
    children: ReactNode;
}) {
    useSiteLanguage();
    const [state, setState] = useState<HubState>(read);
    const [session, setSession] = useState<HubSession | null>(readSession);
    const [verifiedCredits, setVerifiedCredits] = useState<Credit[]>([]);
    const [verifiedBalance, setVerifiedBalance] = useState(0);
    const [creditsLoading, setCreditsLoading] = useState(false);
    const [creditsError, setCreditsError] = useState("");
    useEffect(() => {
        let active = true;
        const refresh = async () => {
            setVerifiedCredits([]);
            setVerifiedBalance(0);
            setCreditsError("");
            if (!session) {
                setCreditsLoading(false);
                return;
            }
            setCreditsLoading(true);
            try {
                const [rows, total] = await Promise.all([
                    platformApi<{
                        id: string;
                        source: string;
                        label: string;
                        amount: number;
                        awarded_at: string;
                    }[]>("/credits"),
                    platformApi<{
                        balance: number;
                    }>("/credits/balance"),
                ]);
                if (active) {
                    setVerifiedCredits(rows.map(row => ({ ...row, memberId: session.profileId, date: row.awarded_at.slice(0, 10) })));
                    setVerifiedBalance(total.balance);
                }
            }
            catch (e) {
                if (active)
                    setCreditsError((e as Error).message);
            }
            finally {
                if (active)
                    setCreditsLoading(false);
            }
        };
        void refresh();
        window.addEventListener("plp:credits-updated", refresh);
        window.addEventListener("plp:live-change", refresh);
        window.addEventListener("focus", refresh);
        return () => { active = false; window.removeEventListener("plp:credits-updated", refresh); window.removeEventListener("plp:live-change", refresh); window.removeEventListener("focus", refresh); };
    }, [session?.profileId]);
    useEffect(() => {
        if (!session)
            return;
        let active = true;
        const refresh = async () => {
            try {
                type Row = {
                    id: string;
                    member_id: string;
                    mentor_id: string;
                    date: string;
                    topic: string;
                    goal: string;
                    status: Session["status"];
                    meeting_link: string;
                    session_type: Session["sessionType"];
                    location: string;
                    mentor_notes: string;
                    decline_reason: string;
                    requested_at: string;
                    updated_at: string;
                    member_name: string;
                    member_email: string;
                    mentor_name: string;
                    mentor_email: string;
                };
                const [directory, rows, account] = await Promise.all([platformApi<{
                        id: string;
                        name: string;
                        email: string;
                        title: string;
                        area: string;
                        bio: string;
                        avatar: string;
                        accepting: boolean;
                    }[]>("/mentors"), platformApi<Row[]>("/mentorship/sessions"), platformApi<{
                        id: string;
                        role: string;
                    }>("/me")]);
                if (!active)
                    return;
                update(s => {
                    // Mentor profiles are written by the mentors themselves on the platform.
                    s.mentors = directory.map(m => ({ id: m.id, name: m.name, email: m.email, role: "Mentor", title: m.title || "PLP mentor", area: m.area || "Leadership Development", bio: m.bio || "", avatar: m.avatar, accepting: m.accepting, initials: m.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() }));
                    s.sessions = rows.map(r => ({ id: r.id, memberId: r.member_id === account.id ? session.profileId : r.member_id, mentorId: r.mentor_id, date: r.date, topic: r.topic, goal: r.goal, status: r.status, meetingLink: r.meeting_link, sessionType: r.session_type, location: r.location, mentorNotes: r.mentor_notes, declineReason: r.decline_reason, requestedAt: r.requested_at, updatedAt: r.updated_at, reflection: s.sessions.find(x => x.id === r.id)?.reflection }));
                    for (const row of rows)
                        if (row.member_id !== account.id && !s.profiles.some(p => p.id === row.member_id))
                            s.profiles.push({ id: row.member_id, name: row.member_name, email: row.member_email, role: "Community member", membership: "Approved", bio: "", skills: [], leadership: [], clubIds: [], managedClubIds: [], joined: "" });
                    const current = s.profiles.find(p => p.id === session.profileId);
                    if (current)
                        current.role = account.role === 'admin' ? 'Administrator' : account.role === 'trainer' ? 'Trainer' : account.role === 'mentor' ? 'Mentor' : account.role === 'leader' ? 'Club leader' : 'Community member';
                });
            }
            catch { /* Existing requests remain visible if the connection is temporarily unavailable. */ }
        };
        void refresh();
        window.addEventListener("plp:mentorship-updated", refresh);
        window.addEventListener("focus", refresh);
        return () => { active = false; window.removeEventListener("plp:mentorship-updated", refresh); window.removeEventListener("focus", refresh); };
    }, [session?.profileId]);
    // School registers, certificate requests, materials, activities and evidence live on the platform.
    // They are mirrored into the existing state shapes so every page reads shared, cross-device data.
    useEffect(() => {
        if (!session)
            return;
        let active = true;
        type Rec<T> = {
            id: string;
            owner_id: string;
            school_id: string | null;
            version: number;
            created_at: string;
            updated_at: string;
            data: T;
        };
        type Data = {
            title: string;
            description?: string;
            email?: string;
            category?: string;
            school_ids?: string[];
            attachments?: string[];
            date?: string;
            activity_type?: CommunityActivity["type"];
            hours?: number;
            start_time?: string;
            location?: string;
            report?: string;
            status?: string;
            reference_id?: string;
            feedback?: string;
        };
        type Req = {
            id: string;
            school_id: string;
            members: {
                id: string;
                name: string;
                email?: string;
                role?: string;
            }[];
            title?: string;
            programme?: string;
            citation?: string;
            period_from?: string | null;
            period_to?: string | null;
            status: string;
            note: string;
            requested_at: string;
            corrected_at: string | null;
            issued_at: string | null;
            reviewed_by_name: string | null;
            requested_by: string;
        };
        const get = <T,>(path: string) => platformApi<T>(path).catch(() => null);
        const refresh = async () => {
            const me = await get<{
                id: string;
                role: string;
                school_id: string | null;
            }>("/me");
            if (!me || !active)
                return;
            const staff = me.role === "admin" || (me.role === "leader" && !!me.school_id);
            const [schools, members, requests, materials, completions, events, accounts, proofs, applications] = await Promise.all([
                get<School[]>("/schools"), staff ? get<Rec<Data>[]>("/records/members") : null, staff ? get<Req[]>("/certificate-requests") : null,
                get<Rec<Data>[]>("/records/materials"), staff ? get<{
                    material_id: string;
                    school_id: string;
                    completed_by: string;
                    completed_at: string;
                }[]>("/material-completions") : null,
                get<Rec<Data>[]>("/records/events"), staff ? get<{
                    id: string;
                    name: string;
                    email: string;
                    school_id: string | null;
                }[]>("/school-members") : null,
                get<Rec<Data>[]>("/records/proofs"), get<Rec<Data>[]>("/records/applications"),
            ]);
            const manageable = (events ?? []).filter(e => me.role === "admin" || (me.role === "leader" && e.school_id === me.school_id));
            const attendance = new Map(await Promise.all(manageable.map(async (e) => [e.id, (await get<{
                    member_id?: string;
                    register_member_id?: string;
                }[]>(`/events/${e.id}/attendance`)) ?? []] as const)));
            if (!active)
                return;
            if (schools)
                demoSchools.splice(0, demoSchools.length, ...schools.map(x => ({ id: x.id, name: x.name, district: x.district })));
            const file = (id: string, name = "Attachment"): HubFile => ({ name, type: "", data: `/api/files/${id}`, size: 0 });
            update(s => {
                const current = s.profiles.find(p => p.id === session.profileId);
                if (current)
                    current.schoolId = me.school_id ?? undefined;
                if (members)
                    s.schoolRecords.members = members.map(m => ({ id: m.id, version: m.version, schoolId: m.school_id ?? "", name: m.data.title, email: m.data.email ?? "", category: m.data.category || "High school" }));
                if (requests)
                    s.schoolRecords.requests = requests.map(r => ({ id: r.id, schoolId: r.school_id, createdBy: r.requested_by, title: r.title ?? "Certificate of Membership", programme: r.programme ?? "Service as a PLP member", citation: r.citation ?? "", periodFrom: r.period_from ?? undefined, periodTo: r.period_to ?? undefined, completed: r.requested_at.slice(0, 10), evidence: "", members: r.members.map(m => ({ id: m.id, name: m.name, email: m.email ?? "", role: m.role || undefined })), status: r.status === "issued" ? "Issued" : r.status === "returned" ? "Returned" : "Submitted", note: r.note, submitted: r.requested_at.slice(0, 10), requestedAt: r.requested_at, correctedAt: r.corrected_at ?? undefined, issued: r.issued_at?.slice(0, 10), approvedBy: r.reviewed_by_name ?? undefined }));
                if (materials)
                    s.operations.materials = materials.map(m => ({ id: m.id, version: m.version, title: m.data.title, file: file(m.data.attachments?.[0] ?? "", m.data.description || m.data.title), schoolIds: m.data.school_ids ?? [], createdAt: m.created_at }));
                if (completions)
                    s.operations.completions = completions.map(c => ({ materialId: c.material_id, schoolId: c.school_id, by: c.completed_by, completedAt: c.completed_at }));
                if (events)
                    s.operations.activities = events.map(e => ({ id: e.id, version: e.version, attachments: e.data.attachments ?? [], hostId: e.school_id ?? e.data.category ?? "plp", title: e.data.title, date: e.data.date ?? e.created_at.slice(0, 10), description: e.data.description ?? "", type: e.data.activity_type ?? "Meeting", hours: e.data.hours, startTime: e.data.start_time, location: e.data.location, photos: (e.data.attachments ?? []).map((id, i) => file(id, `Photo ${i + 1}`)), authorId: e.owner_id, report: e.data.report || undefined, reportedAt: e.data.report ? e.updated_at : undefined, reviewedAt: e.data.status === "approved" ? e.updated_at : undefined, attendees: (attendance.get(e.id) ?? []).map(a => a.member_id ?? a.register_member_id!) }));
                if (accounts)
                    s.schoolAccounts = accounts;
                if (proofs)
                    s.proofs = proofs.map(p => ({ id: p.id, version: p.version, memberId: p.owner_id === me.id ? session.profileId : p.owner_id, programId: p.data.reference_id ?? p.data.category ?? "", file: p.data.attachments?.[0] ? `/api/files/${p.data.attachments[0]}` : undefined, fileName: p.data.description, status: p.data.status === "approved" ? "Recognized" : p.data.status === "returned" || p.data.status === "rejected" ? "Returned" : "Pending review" }));
                // Joining a community and participating in an activity are instant (no approval queue) unless an administrator declines them.
                if (applications)
                    s.operations.requests = applications.filter(a => /^(join|activity):/.test(a.data.category ?? "")).map(a => { const [kind, target] = (a.data.category ?? "").split(/:(.*)/); const event = kind === "activity" ? (events ?? []).find(e => e.id === target) : undefined; return { id: a.id, version: a.version, memberId: a.owner_id === me.id ? session.profileId : a.owner_id, memberName: a.data.title, hostId: kind === "join" ? target : (event?.school_id ?? event?.data.category ?? ""), activityId: kind === "activity" ? target : undefined, status: a.data.status === "rejected" ? "Declined" : "Approved", createdAt: a.created_at }; });
            });
            window.dispatchEvent(new Event("plp:school-data-synced"));
        };
        void refresh();
        window.addEventListener("plp:school-data-updated", refresh);
        return () => { active = false; window.removeEventListener("plp:school-data-updated", refresh); };
    }, [session?.profileId]);
    // The signed-in person's profile picture lives on the platform; refresh it when they change it.
    useEffect(() => {
        if (!session)
            return;
        let active = true;
        const refresh = () => platformApi<{
            id: string;
            avatar_file_id: string | null;
            name?: string;
            bio?: string;
            skills?: string[];
            leadership?: string[];
        }>("/me").then(me => { if (!active)
            return; const url = me.avatar_file_id ? `/api/avatars/${me.id}?v=${me.avatar_file_id}` : undefined; update(s => { const p = s.profiles.find(x => x.id === session.profileId); if (!p)
            return; if (p.avatarUrl !== url)
            p.avatarUrl = url;
            // The server copy of the passport wins; an empty server value keeps what this browser already had until the member saves once.
            if (me.name) p.name = me.name;
            if (me.bio) p.bio = me.bio;
            if (me.skills?.length) p.skills = me.skills;
            if (me.leadership?.length) p.leadership = me.leadership; }); }).catch(() => { });
        void refresh();
        window.addEventListener("plp:profile-updated", refresh);
        return () => { active = false; window.removeEventListener("plp:profile-updated", refresh); };
    }, [session?.profileId]);
    const member = state.profiles.find((p) => p.id === session?.profileId);
    const isMember = !!member && !!session && member.membership === "Approved";
    function openSession(profileId: string, kind: HubSession["kind"]) {
        try {
            const next = { profileId, kind };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
            setSession(next);
            return true;
        }
        catch {
            toast.error(translateUi("Unable to start a local session. Enable browser storage and try again."));
            return false;
        }
    }
    function signOut() {
        void platformApi("/auth/logout", "POST").catch(() => { });
        sessionStorage.removeItem("plp-meeting-return");
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem("plp-hub-new-code");
        setSession(null);
    }
    useEffect(() => {
        const sync = (event: StorageEvent) => {
            if (event.key === STORAGE_KEY || event.key === null)
                setState(read());
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
        }
        catch {
            toast.error(translateUi("Unable to save. Browser storage may be full or disabled. Download your records before clearing storage."));
            return false;
        }
    }
    return (<HubContext.Provider value={{
            state: { ...state, credits: verifiedCredits, verifiedCreditBalance: session ? { [session.profileId]: verifiedBalance } : {} },
            creditsLoading,
            creditsError,
            // Private pages are rendered only by MemberGuard. Public pages never display this fallback.
            profile: member ?? {
                id: "", name: "", email: "", role: "Community member", membership: "Pending",
                bio: "", skills: [], leadership: [], clubIds: [], managedClubIds: [], joined: "",
            },
            session,
            isMember,
            openSession,
            signOut,
            update,
        }}>
      {translateUi(children)}
    </HubContext.Provider>);
}
export function useHub() {
    const value = useContext(HubContext);
    if (!value)
        throw new Error("HubProvider required");
    return value;
}
