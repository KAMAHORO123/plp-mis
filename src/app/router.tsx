import { translateUi, useSiteLanguage } from '../i18n/language';
import { TrainerWorkspace } from "@/features/hub/trainer-workspace";
import { MeetingsPage, MeetingManager } from "@/features/hub/meetings";
import { EmailVerificationPage } from "@/features/hub/verification-page";
import { useHub } from '@/features/hub/store';
import { StaffProfilePage } from '@/features/hub/staff-profile';
import { LearningMaterialsPage, ActivitiesPage, OperationsAnalyticsPage, SchoolDirectoryPage, SchoolLeaderDashboard } from '@/features/hub/school-operations';
import { MembershipCertificatesPage } from '@/features/hub/membership-certificates';
import { RoleDashboard } from '@/features/hub/role-dashboard';
import { SchoolMembersPage, CertificateCheckPage } from "@/features/hub/workspaces";
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { RootLayout } from "@/app/root-layout";
import { ProtectedRoute } from "@/app/protected-route";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { PageLoader } from "@/components/shared/page-loader";
import { HubLayout, PublicSiteLayout, MemberWorkspaceLayout, } from "@/features/hub/layout";
import { HomePage, AboutPage, StoriesPage, ProgrammesPage, AlbumPage, PublicHubPage, CanadaPage } from "@/features/hub/home";
import { AcademyPage, CoursePage, AlxPage } from "@/features/hub/academy";
import { PassportPage, CertificatesPage, VerifyPage, CreditsPage, } from "@/features/hub/passport";
import { OpportunitiesPage } from "@/features/hub/opportunities";
import { MentorshipPage, MentorDashboard } from "@/features/hub/mentorship";
import { StudioPage } from "@/features/hub/admin";
import { JoinPage, StaffPendingPage, SignInPage, ForgotPasswordPage, ApplicationStatusPage, CoursePreviewPage, MemberGuard, } from "@/features/hub/access";
import { MembershipsPage } from "@/features/hub/memberships";
const OverviewPage = lazy(() => import("@/features/dashboard/pages/overview-page").then((m) => ({
    default: m.OverviewPage,
})));
const SchoolsPage = lazy(() => import("@/features/schools/pages/schools-page").then((m) => ({
    default: m.SchoolsPage,
})));
const MembersPage = lazy(() => import("@/features/members/pages/members-page").then((m) => ({
    default: m.MembersPage,
})));
const ProgramPage = lazy(() => import("@/features/program/pages/program-page").then((m) => ({
    default: m.ProgramPage,
})));
const CertificationPage = lazy(() => import("@/features/certification/pages/certification-page").then((m) => ({
    default: m.CertificationPage,
})));
const EventsPage = lazy(() => import("@/features/events/pages/events-page").then((m) => ({
    default: m.EventsPage,
})));
const ReportsPage = lazy(() => import("@/features/reports/pages/reports-page").then((m) => ({
    default: m.ReportsPage,
})));
const NotificationsPage = lazy(() => import("@/features/notifications/pages/notifications-page").then((m) => ({
    default: m.NotificationsPage,
})));
const AnnouncementsPage = lazy(() => import("@/features/announcements/pages/announcements-page").then((m) => ({
    default: m.AnnouncementsPage,
})));
const SettingsPage = lazy(() => import("@/features/settings/pages/settings-page").then((m) => ({
    default: m.SettingsPage,
})));
const SupportPage = lazy(() => import("@/features/support/pages/support-page").then((m) => ({
    default: m.SupportPage,
})));
const CoordinatorOverviewPage = lazy(() => import("@/features/coordinator/pages/coordinator-overview-page").then((m) => ({ default: m.CoordinatorOverviewPage })));
const CoordinatorMembersPage = lazy(() => import("@/features/coordinator/pages/coordinator-members-page").then((m) => ({
    default: m.CoordinatorMembersPage,
})));
const CoordinatorActivitiesPage = lazy(() => import("@/features/coordinator/pages/coordinator-activities-page").then((m) => ({ default: m.CoordinatorActivitiesPage })));
const CoordinatorMeetingsPage = lazy(() => import("@/features/coordinator/pages/coordinator-meetings-page").then((m) => ({ default: m.CoordinatorMeetingsPage })));
const CoordinatorEventsPage = lazy(() => import("@/features/coordinator/pages/coordinator-events-page").then((m) => ({
    default: m.CoordinatorEventsPage,
})));
const CoordinatorCertificatesPage = lazy(() => import("@/features/coordinator/pages/coordinator-certificates-page").then((m) => ({ default: m.CoordinatorCertificatesPage })));
const CoordinatorDocumentsPage = lazy(() => import("@/features/coordinator/pages/coordinator-documents-page").then((m) => ({ default: m.CoordinatorDocumentsPage })));
const CoordinatorProfilePage = lazy(() => import("@/features/coordinator/pages/coordinator-profile-page").then((m) => ({
    default: m.CoordinatorProfilePage,
})));
const withSuspense = (node: React.ReactNode) => (<Suspense fallback={<PageLoader />}>{translateUi(node)}</Suspense>);
function AcademyRoute() { useSiteLanguage(); const { profile } = useHub(); return profile.role === 'Club leader' ? <Navigate to="/learning-materials" replace/> : <AcademyPage />; }
/** Redirects an old address to its new one, keeping ?query and #fragment (returnTo, reset tokens). */
function MovedTo({ path }: {
    path: string;
}) { useSiteLanguage(); const { search, hash } = useLocation(); return <Navigate to={{ pathname: path, search, hash }} replace/>; }
function ProfileRoute() { useSiteLanguage(); const { profile } = useHub(); return ['Administrator', 'Trainer', 'Club leader', 'Mentor'].includes(profile.role) ? <StaffProfilePage /> : <PassportPage />; }
function DashboardRoute() { useSiteLanguage(); const { profile } = useHub(); return profile.role === 'Trainer' ? <TrainerWorkspace overview/> : profile.role === 'Club leader' ? <SchoolLeaderDashboard /> : profile.role === 'Mentor' ? <MentorDashboard /> : <RoleDashboard />; }
function SchoolRegisterRoute() { useSiteLanguage(); const { profile } = useHub(); return profile.role === 'Administrator' ? <SchoolDirectoryPage /> : <SchoolMembersPage />; }
export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                element: <HubLayout />,
                children: [
                    {
                        element: <PublicSiteLayout />,
                        children: [
                            { index: true, element: <HomePage /> },
                            { path: "about", element: <AboutPage /> },
                            { path: "meetings", element: <MeetingsPage /> },
                            { path: "meetings/:id", element: <MeetingsPage /> },
                            { path: "programmes", element: <ProgrammesPage /> },
                            { path: "stories", element: <StoriesPage /> },
                            { path: "album", element: <AlbumPage /> },
                            { path: "plp-canada", element: <CanadaPage /> },
                            { path: "plp-hub", element: <PublicHubPage /> },
                            { path: "courses", element: <CoursePreviewPage /> },
                            { path: "verify/:id", element: <VerifyPage /> },
                            { path: "certificate-check/:requestId/:memberId", element: <CertificateCheckPage /> },
                            // Account pages live under /auth; the older addresses redirect, so bookmarks and emailed links keep working.
                            { path: "auth", element: <Navigate to="/auth/login" replace/> },
                            { path: "auth/login", element: <SignInPage /> },
                            { path: "auth/signup", element: <JoinPage /> },
                            { path: "auth/forgot-password", element: <ForgotPasswordPage /> },
                            { path: "auth/reset", element: <ForgotPasswordPage /> },
                            { path: "auth/verify-email", element: <EmailVerificationPage /> },
                            { path: "auth/pending", element: <StaffPendingPage /> },
                            { path: "sign-in", element: <MovedTo path="/auth/login"/> },
                            { path: "join", element: <MovedTo path="/auth/signup"/> },
                            { path: "forgot-password", element: <MovedTo path="/auth/forgot-password"/> },
                            { path: "reset", element: <MovedTo path="/auth/reset"/> },
                            { path: "verify-email", element: <MovedTo path="/auth/verify-email"/> },
                            { path: "staff-pending", element: <MovedTo path="/auth/pending"/> },
                            {
                                path: "application-status",
                                element: <ApplicationStatusPage />,
                            },
                        ],
                    },
                    {
                        element: <MemberGuard />,
                        children: [
                            {
                                element: <MemberWorkspaceLayout />,
                                children: [
                                    { path: "hub", element: <DashboardRoute /> },
                                    { path: "academy", element: <AcademyRoute /> },
                                    { path: "academy/:id", element: <CoursePage /> },
                                    { path: "alx", element: <AlxPage /> },
                                    { path: "opportunities", element: <OpportunitiesPage /> },
                                    { path: "mentorship", element: <MentorshipPage /> },
                                    { element: <MemberGuard allowed={["Mentor"]}/>, children: [{ path: "mentor-sessions", element: <MentorDashboard /> }] },
                                    { path: "community", element: <Navigate to="/clubs" replace/> },
                                    { path: "clubs", element: <ActivitiesPage /> },
                                    { path: "passport", element: <ProfileRoute /> },
                                    {
                                        path: "profile",
                                        element: <Navigate to="/passport" replace/>,
                                    },
                                    { path: "certificates", element: <CertificatesPage /> },
                                    { path: "certificate-centre", element: <MembershipCertificatesPage /> },
                                    { path: "learning-certificates", element: <Navigate to="/certificates" replace/> },
                                    { element: <MemberGuard allowed={["Club leader", "Administrator"]}/>, children: [{ path: "school-members", element: <SchoolRegisterRoute /> }, { path: "learning-materials", element: <LearningMaterialsPage /> }] },
                                    { path: "credits", element: <CreditsPage /> },
                                    {
                                        element: (<MemberGuard allowed={["Trainer", "Administrator"]}/>),
                                        children: [{ path: "studio", element: <StudioPage /> }],
                                    },
                                    {
                                        element: <MemberGuard allowed={["Administrator"]}/>,
                                        children: [
                                            { path: "meetings/manage", element: <MeetingManager /> },
                                            { path: "hub-analytics", element: <OperationsAnalyticsPage /> },
                                            { path: "issued-certificates", element: <Navigate to="/hub" replace/> },
                                        ],
                                    },
                                    {
                                        element: (<MemberGuard allowed={["Administrator"]}/>),
                                        children: [
                                            { path: "memberships", element: <MembershipsPage /> },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            { path: "public", element: <Navigate to="/" replace/> },
            { path: "student/:qrCode", element: <Navigate to="/auth/login" replace/> },
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        element: <DashboardLayout />,
                        children: [
                            { path: "dashboard", element: withSuspense(<OverviewPage />) },
                            { path: "schools", element: withSuspense(<SchoolsPage />) },
                            { path: "members", element: withSuspense(<MembersPage />) },
                            { path: "program", element: withSuspense(<ProgramPage />) },
                            {
                                path: "certification",
                                element: withSuspense(<CertificationPage />),
                            },
                            { path: "events", element: withSuspense(<EventsPage />) },
                            {
                                path: "announcements",
                                element: withSuspense(<AnnouncementsPage />),
                            },
                            { path: "reports", element: withSuspense(<ReportsPage />) },
                            {
                                path: "notifications",
                                element: withSuspense(<NotificationsPage />),
                            },
                            { path: "settings", element: withSuspense(<SettingsPage />) },
                            { path: "support", element: withSuspense(<SupportPage />) },
                            {
                                path: "coordinator",
                                element: withSuspense(<CoordinatorOverviewPage />),
                            },
                            {
                                path: "coordinator/members",
                                element: withSuspense(<CoordinatorMembersPage />),
                            },
                            {
                                path: "coordinator/activities",
                                element: withSuspense(<CoordinatorActivitiesPage />),
                            },
                            {
                                path: "coordinator/meetings",
                                element: withSuspense(<CoordinatorMeetingsPage />),
                            },
                            {
                                path: "coordinator/events",
                                element: withSuspense(<CoordinatorEventsPage />),
                            },
                            {
                                path: "coordinator/certificates",
                                element: withSuspense(<CoordinatorCertificatesPage />),
                            },
                            {
                                path: "coordinator/documents",
                                element: withSuspense(<CoordinatorDocumentsPage />),
                            },
                            {
                                path: "coordinator/profile",
                                element: withSuspense(<CoordinatorProfilePage />),
                            },
                        ],
                    },
                ],
            },
            { path: "*", element: <Navigate to="/" replace/> },
        ],
    },
]);
