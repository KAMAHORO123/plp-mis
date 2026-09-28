import { RoleDashboard } from '@/features/hub/role-dashboard';
import { SchoolMembersPage, CertificateCentrePage, CertificateCheckPage } from "@/features/hub/workspaces";
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "@/app/root-layout";
import { ProtectedRoute } from "@/app/protected-route";
import { AuthLayout } from "@/layouts/auth-layout";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { PageLoader } from "@/components/shared/page-loader";

import { ForgotPasswordPage } from "@/features/authentication/pages/forgot-password-page";
import { VerifyEmailPage } from "@/features/authentication/pages/verify-email-page";
import { NewPasswordPage } from "@/features/authentication/pages/new-password-page";
import {
  HubLayout,
  PublicSiteLayout,
  MemberWorkspaceLayout,
} from "@/features/hub/layout";
import { HomePage, AboutPage, StoriesPage, ProgrammesPage } from "@/features/hub/home";
import { AcademyPage, CoursePage, AlxPage } from "@/features/hub/academy";
import {
  PassportPage,
  CertificatesPage,
  VerifyPage,
  CreditsPage,
} from "@/features/hub/passport";
import {
  OpportunitiesPage,
  MentorshipPage,
  CommunityPage,
} from "@/features/hub/connect";
import { ClubsPage } from "@/features/hub/clubs";
import { StudioPage, AnalyticsPage } from "@/features/hub/admin";

import {
  JoinPage,
  SignInPage,
  ApplicationStatusPage,
  DevelopmentAccessPage,
  CoursePreviewPage,
  MemberGuard,
} from "@/features/hub/access";
import { MembershipsPage } from "@/features/hub/memberships";

const OverviewPage = lazy(() =>
  import("@/features/dashboard/pages/overview-page").then((m) => ({
    default: m.OverviewPage,
  })),
);
const SchoolsPage = lazy(() =>
  import("@/features/schools/pages/schools-page").then((m) => ({
    default: m.SchoolsPage,
  })),
);
const MembersPage = lazy(() =>
  import("@/features/members/pages/members-page").then((m) => ({
    default: m.MembersPage,
  })),
);
const ProgramPage = lazy(() =>
  import("@/features/program/pages/program-page").then((m) => ({
    default: m.ProgramPage,
  })),
);
const CertificationPage = lazy(() =>
  import("@/features/certification/pages/certification-page").then((m) => ({
    default: m.CertificationPage,
  })),
);
const EventsPage = lazy(() =>
  import("@/features/events/pages/events-page").then((m) => ({
    default: m.EventsPage,
  })),
);
const ReportsPage = lazy(() =>
  import("@/features/reports/pages/reports-page").then((m) => ({
    default: m.ReportsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("@/features/notifications/pages/notifications-page").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const AnnouncementsPage = lazy(() =>
  import("@/features/announcements/pages/announcements-page").then((m) => ({
    default: m.AnnouncementsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/settings-page").then((m) => ({
    default: m.SettingsPage,
  })),
);
const SupportPage = lazy(() =>
  import("@/features/support/pages/support-page").then((m) => ({
    default: m.SupportPage,
  })),
);

const CoordinatorOverviewPage = lazy(() =>
  import("@/features/coordinator/pages/coordinator-overview-page").then(
    (m) => ({ default: m.CoordinatorOverviewPage }),
  ),
);
const CoordinatorMembersPage = lazy(() =>
  import("@/features/coordinator/pages/coordinator-members-page").then((m) => ({
    default: m.CoordinatorMembersPage,
  })),
);
const CoordinatorActivitiesPage = lazy(() =>
  import("@/features/coordinator/pages/coordinator-activities-page").then(
    (m) => ({ default: m.CoordinatorActivitiesPage }),
  ),
);
const CoordinatorMeetingsPage = lazy(() =>
  import("@/features/coordinator/pages/coordinator-meetings-page").then(
    (m) => ({ default: m.CoordinatorMeetingsPage }),
  ),
);
const CoordinatorEventsPage = lazy(() =>
  import("@/features/coordinator/pages/coordinator-events-page").then((m) => ({
    default: m.CoordinatorEventsPage,
  })),
);
const CoordinatorCertificatesPage = lazy(() =>
  import("@/features/coordinator/pages/coordinator-certificates-page").then(
    (m) => ({ default: m.CoordinatorCertificatesPage }),
  ),
);
const CoordinatorDocumentsPage = lazy(() =>
  import("@/features/coordinator/pages/coordinator-documents-page").then(
    (m) => ({ default: m.CoordinatorDocumentsPage }),
  ),
);
const CoordinatorProfilePage = lazy(() =>
  import("@/features/coordinator/pages/coordinator-profile-page").then((m) => ({
    default: m.CoordinatorProfilePage,
  })),
);

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{node}</Suspense>
);

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
              { path: "programmes", element: <ProgrammesPage /> },
              { path: "stories", element: <StoriesPage /> },
              { path: "courses", element: <CoursePreviewPage /> },
              { path: "certificate-check/:requestId/:memberId", element: <CertificateCheckPage /> },
              { path: "join", element: <JoinPage /> },
              { path: "sign-in", element: <SignInPage /> },
              {
                path: "application-status",
                element: <ApplicationStatusPage />,
              },
              ...(import.meta.env.DEV
                ? [{ path: "dev/access", element: <DevelopmentAccessPage /> }]
                : []),
            ],
          },
          {
            element: <MemberGuard />,
            children: [
              {
                element: <MemberWorkspaceLayout />,
                children: [
                  { path: "hub", element: <RoleDashboard /> },
                  { path: "academy", element: <AcademyPage /> },
                  { path: "academy/:id", element: <CoursePage /> },
                  { path: "alx", element: <AlxPage /> },
                  { path: "opportunities", element: <OpportunitiesPage /> },
                  { path: "mentorship", element: <MentorshipPage /> },
                  { path: "community", element: <CommunityPage /> },
                  { path: "clubs", element: <ClubsPage /> },
                  { path: "passport", element: <PassportPage /> },
                  {
                    path: "profile",
                    element: <Navigate to="/passport" replace />,
                  },
                  { path: "certificates", element: <CertificatesPage /> },
                  { path: "certificate-centre", element: <CertificateCentrePage /> },
                  { path: "learning-certificates", element: <Navigate to="/certificates" replace /> },
                  { element: <MemberGuard allowed={["School coordinator", "Administrator"]} />, children: [{path:"school-members",element:<SchoolMembersPage/>}] },
                  { path: "verify/:id", element: <VerifyPage /> },
                  { path: "credits", element: <CreditsPage /> },
                  {
                    element: (
                      <MemberGuard allowed={["Trainer", "Administrator"]} />
                    ),
                    children: [{ path: "studio", element: <StudioPage /> }],
                  },
                  {
                    element: <MemberGuard allowed={["Administrator"]} />,
                    children: [
                      { path: "hub-analytics", element: <AnalyticsPage /> },
                    ],
                  },
                  {
                    element: (
                      <MemberGuard allowed={["Administrator", "Club leader"]} />
                    ),
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
      { path: "public", element: <Navigate to="/" replace /> },
      { path: "student/:qrCode", element: <Navigate to="/sign-in" replace /> },
      {
        path: "auth",
        element: <AuthLayout />,
        children: [
          { index: true, element: <Navigate to="login" replace /> },
          { path: "login", element: <Navigate to="/sign-in" replace /> },
          { path: "signup", element: <Navigate to="/join" replace /> },
          { path: "forgot-password", element: <ForgotPasswordPage /> },
          { path: "verify-email", element: <VerifyEmailPage /> },
          { path: "new-password", element: <NewPasswordPage /> },
        ],
      },
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
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
