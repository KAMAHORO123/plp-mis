import { translateUi, useSiteLanguage, LanguageSwitcher } from '../../i18n/language';
import { AnnouncementBanner } from "./announcement";
import { HelpChat } from "./workspaces";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, } from "react-router-dom";
import { ArrowUpRight, ArrowLeft, BookOpen, BriefcaseBusiness, Users, Award, Coins, LayoutDashboard, Fingerprint, Menu, X, GraduationCap, ChartNoAxesCombined, PenTool, Globe, LogOut, ShieldCheck, Sparkles, } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { SignOutDialog } from "@/components/shared/sign-out-dialog";
import { AuthLayout } from "@/layouts/auth-layout";
import { HubProvider, useHub, balance } from "./store";
import { useLiveConnection } from "./live";
import { NotificationBell } from "./notification-bell";
import { CookieNotice } from "./cookie-notice";
import "./hub.css";
import "./landing.css";
import "./dashboard-theme.css";
import { LandingFooter } from "./landing-art";
export const hubNav = [
    { to: "/hub", label: "My journey", icon: LayoutDashboard },
    { to: "/academy", label: "Learning academy", icon: BookOpen },
    { to: "/alx", label: "ALX learning zone", icon: GraduationCap },
    { to: "/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
    { to: "/mentorship", label: "Mentorship", icon: Users },
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
    { to: "/album", label: "PLP album" },
    { to: "/plp-canada", label: "PLP Canada" },
    { to: "/plp-hub", label: "PLP Hub" },
];
function Layout({ privateWorkspace = false }: {
    privateWorkspace?: boolean;
}) {
    useSiteLanguage();
    const { profile, session, isMember, signOut, state } = useHub();
    // One live connection per signed-in tab keeps every page current without reloading.
    useLiveConnection(!!session);
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [compactNav, setCompactNav] = useState(false);
    useEffect(() => {
        if (privateWorkspace)
            return;
        const onScroll = () => setCompactNav(current => current ? window.scrollY > 60 : window.scrollY > 180);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [privateWorkspace]);
    useEffect(() => {
        setOpen(false);
        const frame = requestAnimationFrame(() => {
            const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
            if (target)
                target.scrollIntoView({ block: "start" });
            else
                window.scrollTo(0, 0);
        });
        return () => cancelAnimationFrame(frame);
    }, [location.pathname, location.hash]);
    const extra = profile.role === "Trainer"
        ? [{ to: "/studio", label: "Trainer studio", icon: PenTool }]
        : profile.role === "Administrator"
            ? [
                {
                    to: "/memberships",
                    label: "Member management",
                    icon: ShieldCheck,
                },
                { to: "/studio", label: "Content studio", icon: PenTool },
                { to: "/meetings/manage", label: "Meetings & attendance", icon: ShieldCheck },
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
    const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
    const [brokenAvatar, setBrokenAvatar] = useState(false);
    useEffect(() => setBrokenAvatar(false), [profile.avatarUrl]);
    const signout = () => {
        setShowSignoutConfirm(true);
    };
    const handleConfirmSignout = () => {
        setShowSignoutConfirm(false);
        signOut();
        navigate("/auth/login", { replace: true });
    };
    const accessLink = isMember
        ? "/hub"
        : session
            ? "/application-status"
            : "/auth/login";
    const pendingCount = state.profiles.filter((p) => p.membership === "Pending").length;
    if (privateWorkspace) {
        const admin = profile.role === 'Administrator', trainer = profile.role === 'Trainer', mentor = profile.role === 'Mentor', coordinator = profile.role === 'Club leader', leader = profile.role === 'Club leader';
        const links = [
            { to: '/hub', label: 'Dashboard', icon: LayoutDashboard },
            ...(admin ? [
                { to: '/memberships', label: 'Members & staff', icon: ShieldCheck },
                { to: '/studio', label: 'Content studio', icon: PenTool },
                { to: '/studio?tab=Website%20banner', label: 'Website banner', icon: PenTool },
                { to: '/studio?tab=Fun%20corner', label: 'Fun corner', icon: Sparkles },
                { to: '/meetings/manage', label: 'Meetings & attendance', icon: Globe },
                { to: '/clubs', label: 'Activities & requests', icon: Globe },
                { to: '/learning-materials', label: 'Learning materials', icon: BookOpen },
                { to: '/hub-analytics', label: 'Impact analytics', icon: ChartNoAxesCombined },
                { to: '/school-members', label: 'School registers', icon: Users },
                { to: '/certificate-centre', label: 'School certificates', icon: Award },
            ] : trainer ? [{ to: '/studio', label: 'Trainer studio', icon: PenTool }, { to: '/academy', label: 'Learning academy', icon: BookOpen }] : mentor ? [
                { to: '/academy', label: 'Learning academy', icon: BookOpen },
                { to: '/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
            ] : coordinator ? [
                { to: '/school-members', label: 'School members', icon: Users },
                { to: '/certificate-centre', label: 'Membership certificates', icon: Award },
                { to: '/learning-materials', label: 'Learning materials', icon: BookOpen },
                { to: '/clubs', label: 'Activities & reports', icon: Globe },
            ] : [
                ...(leader ? [{ to: '/clubs', label: 'Club management', icon: Globe }, { to: '/memberships', label: 'Club invitations', icon: ShieldCheck }] : []),
                { to: '/academy', label: 'Learning academy', icon: BookOpen },
                { to: '/alx', label: 'ALX learning zone', icon: GraduationCap },
                { to: '/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
                { to: '/mentorship', label: 'Mentorship', icon: Users },
                ...(!leader ? [{ to: '/clubs', label: 'Activities', icon: Globe }] : []),
                { to: '/certificates', label: 'My achievements', icon: Award },
                { to: '/credits', label: 'PLP credits', icon: Coins },
            ]),
            { to: '/passport', label: admin || trainer || mentor || coordinator ? 'My profile' : 'Youth passport', icon: Fingerprint },
        ];
        // Several links can share a path (e.g. studio tabs); the one whose query matches wins.
        const pathOf = (to: string) => to.split("?")[0];
        const onPath = links.filter((item) => location.pathname === pathOf(item.to) ||
            location.pathname.startsWith(pathOf(item.to) + "/"));
        const current = onPath.find((item) => item.to.includes("?") && location.search === item.to.slice(item.to.indexOf("?"))) ??
            onPath.find((item) => !item.to.includes("?"));
        const sidebar = (mobile = false) => (<>
        <Link to="/hub" className="hub-brand block px-5 py-5">
          <Logo subtitle={profile.role === "Club leader" ? "School workspace" : profile.role === "Administrator" ? "Administration" : profile.role === "Trainer" ? "Trainer workspace" : profile.role === "Mentor" ? "Mentor workspace" : "Member workspace"}/>
        </Link>
        <nav aria-label={translateUi(mobile ? "Mobile navigation" : "Hub navigation")} className="flex-1 space-y-1 overflow-y-auto px-3">
          {translateUi(links.map((item) => (<Link key={item.to} to={item.to} aria-current={current === item ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${current === item ? "bg-sidebar-active text-sidebar-active-foreground" : "text-sidebar-foreground hover:bg-sidebar-active"}`}>
              <item.icon size={18}/>
              <span>{translateUi(item.label)}</span>
              {translateUi(item.to === "/memberships" &&
                    profile.role === "Administrator" &&
                    pendingCount > 0 && (<span className="hub-nav-count">{translateUi(pendingCount)}</span>))}
            </Link>)))}
        </nav>
        <div className="space-y-3 border-t border-border p-4">
          <Link to="/" className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary" aria-label={translateUi("Back to website")} title={translateUi("Back to website")}>
            <ArrowLeft size={20} aria-hidden="true"/>
          </Link>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{translateUi(profile.name)}</strong>
              <span className="block truncate text-xs text-muted-foreground">
                {translateUi(profile.email)}
              </span>
            </div>
            <button aria-label={translateUi("Sign out")} onClick={signout} className="rounded-md p-2 hover:bg-secondary">
              <LogOut size={18}/>
            </button>
          </div>
        </div>
      </>);
        return (<div className="hub-app hub-mis plp-dashboard flex h-screen overflow-hidden">
        <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
          {translateUi(sidebar())}
        </aside>
        {translateUi(open && (<div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-black/40" aria-label={translateUi("Close navigation")} onClick={() => setOpen(false)}/>
            <aside className="relative flex h-full w-64 flex-col bg-sidebar shadow-xl">
              {translateUi(sidebar(true))}
            </aside>
          </div>))}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button className="rounded-md p-1.5 text-muted-foreground lg:hidden" aria-label={translateUi("Open navigation")} aria-expanded={open} onClick={() => setOpen(true)}>
                <Menu size={20}/>
              </button>
              <span className="hidden text-sm text-muted-foreground sm:inline">{translateUi(" Hub / ")}</span>
              <span className="truncate text-sm font-medium">
                {translateUi(current?.label ?? "Member workspace")}
              </span>
            </div>
            <button aria-label={translateUi("Sign out")} onClick={signout} className="ml-auto rounded-md p-2 hover:bg-secondary lg:hidden">
              <LogOut size={18}/>
            </button>
            <div className="flex shrink-0 items-center gap-2">
              <LanguageSwitcher/><NotificationBell />
              <Link to="/passport" aria-label={translateUi("Your profile")} className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-border">
                {translateUi(profile.avatarUrl && !brokenAvatar ? <img src={profile.avatarUrl} alt={translateUi("")} className="h-full w-full object-cover" onError={() => setBrokenAvatar(true)}/> : profile.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join(""))}
              </Link>
            </div>
          </header>
          <main className="relative min-h-0 flex-1 overflow-y-auto">
            <div className="hub-content mx-auto w-full max-w-[1200px]">
              <Outlet key={`${session?.profileId}-${location.pathname}`}/>
            </div>
          </main>
        </div>
        <SignOutDialog open={showSignoutConfirm} onOpenChange={setShowSignoutConfirm} onConfirm={handleConfirmSignout} userName={profile.name} userEmail={profile.email}/>
      </div>);
    }
    if (["/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/verify-email", "/application-status", "/dev/access"].includes(location.pathname)) {
        return (<div className="hub-app hub-mis hub-auth">
        <AuthLayout actions={session ? (<button className="text-sm text-primary" onClick={signout}>{translateUi(" Sign out ")}</button>) : (<Link className="inline-flex h-10 w-10 items-center justify-center rounded-md text-primary hover:bg-secondary" to="/" aria-label={translateUi("Back to website")} title={translateUi("Back to website")}>
                <ArrowLeft size={20} aria-hidden="true"/>
              </Link>)}/>
        <SignOutDialog open={showSignoutConfirm} onOpenChange={setShowSignoutConfirm} onConfirm={handleConfirmSignout} userName={profile.name} userEmail={profile.email}/>
      </div>);
    }
    return (<div className="hub-app plp-public-site">
      <div className={`plp-sticky-navigation${compactNav ? " is-compact" : ""}`}>
      <AnnouncementBanner />
      <header className="hub-header" onKeyDown={(event) => { if (event.key === "Escape") {
        setOpen(false);
        event.currentTarget.querySelector<HTMLButtonElement>(".hub-menu")?.focus();
    } }}>
        <Link to={privateWorkspace ? "/hub" : "/"} className="hub-brand">
          <img className="plp-full-nav-logo" src="/logo.svg" alt={translateUi("Peace and Love Proclaimers \u2014 Youth For Change")} width="174" height="98"/>
        </Link>
        {translateUi(!privateWorkspace ? (<nav aria-label={translateUi("Main navigation")} className="hub-top-nav">
            {translateUi(publicNav.map((n) => (<NavLink key={n.to} to={n.to} end={n.to === "/"}>
                {translateUi(n.label)}
              </NavLink>)))}
          </nav>) : (<p className="hub-workspace-label">
            <ShieldCheck size={16}/>{translateUi(" Your member workspace ")}</p>))}
        <div className="hub-header-actions"><LanguageSwitcher/>
          {translateUi(privateWorkspace ? (<>
              <Link to="/" className="hub-website-link" aria-label={translateUi("Back to website")} title={translateUi("Back to website")}>
                <ArrowLeft size={20} aria-hidden="true"/>
              </Link>
              <Link to="/passport" className="hub-account">
                <strong>{translateUi(profile.name)}</strong>
                <small>{translateUi(profile.role)}</small>
              </Link>
              <button className="hub-icon-button" aria-label={translateUi("Sign out")} onClick={signout}>
                <LogOut size={19}/>
              </button>
            </>) : (<>
              <Link to={accessLink} className="hub-signin">
                {translateUi(isMember
                ? "My Hub"
                : session
                    ? "Account status"
                    : "Sign in")}
                <ArrowUpRight size={15}/>
              </Link>
              {translateUi(!session ? (<Link className="hub-button" to="/auth/signup">{translateUi(" Join PLP ")}</Link>) : (<button className="hub-text-button" onClick={signout}>{translateUi(" Sign out ")}</button>))}
            </>))}
          <button className="hub-menu" aria-label={translateUi(open ? "Close navigation" : "Open navigation")} aria-expanded={open} aria-controls="plp-public-navigation" onClick={() => setOpen(!open)}>
            {translateUi(open ? <X /> : <Menu />)}
          </button>
        </div>
      </header>
      {translateUi(open && (<nav id="plp-public-navigation" className="hub-mobile-nav" aria-label={translateUi("Mobile navigation")} onKeyDown={(event) => { if (event.key === "Escape") {
            setOpen(false);
            document.querySelector<HTMLButtonElement>(".plp-public-site .hub-menu")?.focus();
        } }}>
          {translateUi((privateWorkspace ? [...hubNav, ...extra] : publicNav).map((n) => (<NavLink key={n.to} to={n.to} end={n.to === "/"} onClick={() => setOpen(false)}>
              {translateUi(n.label)}
            </NavLink>)))}
          {translateUi(!privateWorkspace && (<Link to={accessLink}>
              {translateUi(isMember ? "My Hub" : "Member sign-in")}
            </Link>))}
        </nav>))}
      </div>
      <div className={privateWorkspace ? "hub-workspace" : ""}>
        {translateUi(privateWorkspace && (<aside className="hub-sidebar">
            <p className="hub-nav-label">{translateUi("DISCOVER & DEVELOP")}</p>
            <nav aria-label={translateUi("Hub navigation")}>
              {translateUi([...hubNav, ...extra].map((n) => (<NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>
                  <n.icon size={18}/>
                  {translateUi(n.label)}
                  {translateUi(n.to === "/memberships" &&
                    profile.role === "Administrator" &&
                    pendingCount > 0 && (<span className="hub-nav-count">{translateUi(pendingCount)}</span>))}
                </NavLink>)))}
            </nav>
            <div className="hub-credit-mini">
              <Coins size={22}/>
              <strong>{translateUi(balance(state, profile.id))}{translateUi(" credits")}</strong>
              <p>{translateUi("Small steps. Lasting impact.")}</p>
              <Link to="/credits">{translateUi("Explore your rewards \u2192")}</Link>
            </div>
          </aside>))}
        <main className={privateWorkspace ? "hub-content" : "hub-public"}>
          <Outlet key={`${session?.profileId ?? "visitor"}-${location.pathname}`}/>
        </main>
      </div>
      {translateUi(privateWorkspace ? (<footer className="hub-member-footer">
          <span>{translateUi("PLP Hub \u00B7 Youth for Change")}</span>
          <a href="mailto:info@peaceloveproclaimers.org">{translateUi("Contact PLP")}</a>
        </footer>) : (<><LandingFooter /><HelpChat /></>))}
      <SignOutDialog open={showSignoutConfirm} onOpenChange={setShowSignoutConfirm} onConfirm={handleConfirmSignout} userName={profile.name} userEmail={profile.email}/>
    </div>);
}
export function PublicSiteLayout() {
    useSiteLanguage();
    return <Layout />;
}
export function MemberWorkspaceLayout() {
    useSiteLanguage();
    return <Layout privateWorkspace/>;
}
export function HubLayout() {
    useSiteLanguage();
    return (<HubProvider>
      <Outlet />
      <CookieNotice />
    </HubProvider>);
}
