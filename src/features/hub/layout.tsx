import { HelpChat } from "./workspaces";
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Users,
  Award,
  Coins,
  LayoutDashboard,
  Fingerprint,
  Menu,
  X,
  GraduationCap,
  ChartNoAxesCombined,
  MessagesSquare,
  PenTool,
  Globe,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { AuthLayout } from "@/layouts/auth-layout";
import { HubProvider, useHub, balance } from "./store";
import "./hub.css";
import "./landing.css";
import { LandingFooter } from "./landing-art";
export const hubNav = [
  { to: "/hub", label: "My journey", icon: LayoutDashboard },
  { to: "/academy", label: "Learning academy", icon: BookOpen },
  { to: "/alx", label: "ALX learning zone", icon: GraduationCap },
  { to: "/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { to: "/mentorship", label: "Mentorship", icon: Users },
  { to: "/community", label: "Community", icon: MessagesSquare },
  { to: "/clubs", label: "Clubs & homegroups", icon: Globe },
  { to: "/passport", label: "Youth passport", icon: Fingerprint },
  { to: "/certificates", label: "My certificates", icon: Award },
  { to: "/credits", label: "PLP credits", icon: Coins },
];
const publicNav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About PLP" },
  { to: "/programmes", label: "Our programmes" },
  { to: "/stories", label: "Our impact" },
];
function Layout({ privateWorkspace = false }: { privateWorkspace?: boolean }) {
  const { profile, session, isMember, signOut, state } = useHub();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
    const frame = requestAnimationFrame(() => {
      const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (target) target.scrollIntoView({ block: "start" });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);
  const extra =
    profile.role === "Trainer"
      ? [{ to: "/studio", label: "Trainer studio", icon: PenTool }]
      : profile.role === "Administrator"
        ? [
            {
              to: "/memberships",
              label: "Member management",
              icon: ShieldCheck,
            },
            { to: "/studio", label: "Content studio", icon: PenTool },
            {
              to: "/hub-analytics",
              label: "Impact analytics",
              icon: ChartNoAxesCombined,
            },
          ]
        : profile.role === "Club leader"
          ? [
              {
                to: "/memberships",
                label: "Club invitations",
                icon: ShieldCheck,
              },
            ]
          : [];
  const signout = () => {
    signOut();
    navigate("/sign-in", { replace: true });
  };
  const accessLink = isMember
    ? "/hub"
    : session
      ? "/application-status"
      : "/sign-in";
  const pendingCount = state.profiles.filter(
    (p) => p.membership === "Pending",
  ).length;
  if (privateWorkspace) {
    const admin=profile.role==='Administrator', trainer=profile.role==='Trainer', coordinator=profile.role==='School coordinator', leader=profile.role==='Club leader';
    const links = [
      {to:'/hub',label:'Dashboard',icon:LayoutDashboard},
      ...(admin ? [
        {to:'/memberships',label:'Members & staff',icon:ShieldCheck},
        {to:'/studio',label:'Content studio',icon:PenTool},
        {to:'/clubs',label:'Clubs & reports',icon:Globe},
        {to:'/hub-analytics',label:'Impact analytics',icon:ChartNoAxesCombined},
        {to:'/school-members',label:'School registers',icon:Users},
        {to:'/certificate-centre',label:'School certificate requests',icon:Award},
        {to:'/community',label:'Community',icon:MessagesSquare},
      ] : trainer ? [{to:'/studio',label:'Trainer studio',icon:PenTool}] : coordinator ? [
        {to:'/school-members',label:'School members',icon:Users},
        {to:'/certificate-centre',label:'School certificate requests',icon:Award},
        {to:'/academy',label:'Learning academy',icon:BookOpen},
      ] : [
        ...(leader?[{to:'/clubs',label:'Club management',icon:Globe},{to:'/memberships',label:'Club invitations',icon:ShieldCheck}]:[]),
        {to:'/academy',label:'Learning academy',icon:BookOpen},
        {to:'/alx',label:'ALX learning zone',icon:GraduationCap},
        {to:'/opportunities',label:'Opportunities',icon:BriefcaseBusiness},
        {to:'/mentorship',label:'Mentorship',icon:Users},
        ...(!leader?[{to:'/clubs',label:'Clubs & challenges',icon:Globe}]:[]),
        {to:'/community',label:'Community',icon:MessagesSquare},
        {to:'/certificates',label:'My achievements',icon:Award},
        {to:'/credits',label:'PLP credits',icon:Coins},
      ]),
      {to:'/passport',label:admin||trainer||coordinator?'My profile':'Youth passport',icon:Fingerprint},
    ];
    const current = links.find(
      (item) =>
        location.pathname === item.to ||
        location.pathname.startsWith(item.to + "/"),
    );
    const sidebar = (mobile = false) => (
      <>
        <Link to="/hub" className="hub-brand block px-5 py-5">
          <Logo subtitle={profile.role === "School coordinator" ? "School workspace" : profile.role === "Administrator" ? "Administration" : profile.role === "Trainer" ? "Trainer workspace" : "Member workspace"} />
        </Link>
        <nav
          aria-label={mobile ? "Mobile navigation" : "Hub navigation"}
          className="flex-1 space-y-1 overflow-y-auto px-3"
        >
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-sidebar-active text-sidebar-active-foreground" : "text-sidebar-foreground hover:bg-sidebar-active"}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.to === "/memberships" &&
                profile.role === "Administrator" &&
                pendingCount > 0 && (
                  <span className="hub-nav-count">{pendingCount}</span>
                )}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 border-t border-border p-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Globe size={16} />
            PLP website
          </Link>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{profile.name}</strong>
              <span className="block truncate text-xs text-muted-foreground">
                {profile.email}
              </span>
            </div>
            <button
              aria-label="Sign out"
              onClick={signout}
              className="rounded-md p-2 hover:bg-secondary"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </>
    );
    return (
      <div className="hub-app hub-mis flex h-screen overflow-hidden">
        <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
          {sidebar()}
        </aside>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-black/40"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            />
            <aside className="relative flex h-full w-64 flex-col bg-sidebar shadow-xl">
              {sidebar(true)}
            </aside>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="rounded-md p-1.5 text-muted-foreground lg:hidden"
                aria-label="Open navigation"
                aria-expanded={open}
                onClick={() => setOpen(true)}
              >
                <Menu size={20} />
              </button>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Hub /
              </span>
              <span className="truncate text-sm font-medium">
                {current?.label ?? "Member workspace"}
              </span>
            </div>
            <button
              aria-label="Sign out"
              onClick={signout}
              className="ml-auto rounded-md p-2 hover:bg-secondary lg:hidden"
            >
              <LogOut size={18} />
            </button>
            <Link
              to="/passport"
              aria-label="Your profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-border"
            >
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </Link>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="hub-content mx-auto w-full max-w-[1200px]">
              <Outlet key={`${session?.profileId}-${location.pathname}`} />
              <p className="mt-8 text-xs text-muted-foreground">
                Local preview · Member access is simulated
              </p>
            </div>
          </main>
          <HelpChat />
        </div>
      </div>
    );
  }
  if (
    ["/sign-in", "/join", "/application-status", "/dev/access"].includes(
      location.pathname,
    )
  ) {
    return (
      <div className="hub-app hub-mis hub-auth">
        <AuthLayout
          actions={
            session ? (
              <button className="text-sm text-primary" onClick={signout}>
                Sign out
              </button>
            ) : (
              <Link className="text-sm text-primary" to="/">
                PLP website
              </Link>
            )
          }
        />
      </div>
    );
  }
  return (
    <div className="hub-app plp-public-site">
      <header className="hub-header" onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); event.currentTarget.querySelector<HTMLButtonElement>(".hub-menu")?.focus(); } }}>
        <Link to={privateWorkspace ? "/hub" : "/"} className="hub-brand">
          <img className="plp-full-nav-logo" src="/logo.svg" alt="Peace and Love Proclaimers — Youth For Change" width="174" height="98" />
        </Link>
        {!privateWorkspace ? (
          <nav aria-label="Main navigation" className="hub-top-nav">
            {publicNav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        ) : (
          <p className="hub-workspace-label">
            <ShieldCheck size={16} /> Your member workspace
          </p>
        )}
        <div className="hub-header-actions">
          {privateWorkspace ? (
            <>
              <Link to="/" className="hub-website-link">
                PLP website <ArrowUpRight size={15} />
              </Link>
              <Link to="/passport" className="hub-account">
                <strong>{profile.name}</strong>
                <small>{profile.role}</small>
              </Link>
              <button
                className="hub-icon-button"
                aria-label="Sign out"
                onClick={signout}
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <>
              <Link to={accessLink} className="hub-signin">
                {isMember
                  ? "My Hub"
                  : session
                    ? "Account status"
                    : "Sign in"}
                <ArrowUpRight size={15} />
              </Link>
              {!session ? (
                <Link className="hub-button" to="/join">
                  Join PLP
                </Link>
              ) : (
                <button className="hub-text-button" onClick={signout}>
                  Sign out
                </button>
              )}
            </>
          )}
          <button
            className="hub-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="plp-public-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {privateWorkspace && (
        <div className="hub-demo">
          <span>
            <span className="hub-dot" /> Local preview · Member access is
            simulated; no production authentication
          </span>
        </div>
      )}
      {open && (
        <nav id="plp-public-navigation" className="hub-mobile-nav" aria-label="Mobile navigation" onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".plp-public-site .hub-menu")?.focus(); } }}>
          {(privateWorkspace ? [...hubNav, ...extra] : publicNav).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} onClick={() => setOpen(false)}>
              {n.label}
            </NavLink>
          ))}
          {!privateWorkspace && (
            <Link to={accessLink}>
              {isMember ? "My Hub" : "Member sign-in"}
            </Link>
          )}
        </nav>
      )}
      <div className={privateWorkspace ? "hub-workspace" : ""}>
        {privateWorkspace && (
          <aside className="hub-sidebar">
            <p className="hub-nav-label">DISCOVER & DEVELOP</p>
            <nav aria-label="Hub navigation">
              {[...hubNav, ...extra].map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <n.icon size={18} />
                  {n.label}
                  {n.to === "/memberships" &&
                    profile.role === "Administrator" &&
                    pendingCount > 0 && (
                      <span className="hub-nav-count">{pendingCount}</span>
                    )}
                </NavLink>
              ))}
            </nav>
            <div className="hub-credit-mini">
              <Coins size={22} />
              <strong>{balance(state, profile.id)} credits</strong>
              <p>Small steps. Lasting impact.</p>
              <Link to="/credits">Explore your rewards →</Link>
            </div>
          </aside>
        )}
        <main className={privateWorkspace ? "hub-content" : "hub-public"}>
          <Outlet
            key={`${session?.profileId ?? "visitor"}-${location.pathname}`}
          />
        </main>
      </div>
      {privateWorkspace ? (
        <footer className="hub-member-footer">
          <span>PLP Hub · Youth for Change</span>
          <a href="mailto:info@peaceloveproclaimers.org">Contact PLP</a>
        </footer>
      ) : (
        <LandingFooter />
      )}
    </div>
  );
}
export function PublicSiteLayout() {
  return <Layout />;
}
export function MemberWorkspaceLayout() {
  return <Layout privateWorkspace />;
}
export function HubLayout() {
  return (
    <HubProvider>
      <Outlet />
    </HubProvider>
  );
}
