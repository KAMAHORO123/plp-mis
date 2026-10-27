import { HelpChat } from './faq-chat';
import { translateUi, useSiteLanguage, LanguageDocument, LanguageSwitcher } from './i18n/language';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { SiteLink as Link } from './site-link';
import { HomePage, AboutPage, ProgrammesPage, StoriesPage, AlbumPage, PublicHubPage, CanadaPage } from './home';
import { AnnouncementBanner } from './announcement';
import { LandingFooter } from './landing-art';
import './globals.css';
import './hub.css';
import './landing.css';
const nav = [['/', 'Home'], ['/about', 'About PLP'], ['/programmes', 'Our programmes'], ['/stories', 'Our impact'], ['/album', 'PLP album'], ['/plp-canada', 'PLP Canada'], ['/plp-hub', 'PLP Hub']];
function Layout() {
    useSiteLanguage();
    const [open, setOpen] = useState(false), [compact, setCompact] = useState(false);
    const location = useLocation();
    useEffect(() => { const scroll = () => setCompact(c => c ? scrollY > 60 : scrollY > 180); scroll(); addEventListener('scroll', scroll, { passive: true }); return () => removeEventListener('scroll', scroll); }, []);
    useEffect(() => { setOpen(false); requestAnimationFrame(() => { const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; if (target)
        target.scrollIntoView();
    else
        window.scrollTo(0, 0); }); }, [location]);
    return <div className="hub-app plp-public-site"><div className={`plp-sticky-navigation${compact ? ' is-compact' : ''}`}><AnnouncementBanner /><header className="hub-header"><Link to="/" className="hub-brand"><img className="plp-full-nav-logo" src="/logo.svg" alt={translateUi("Peace and Love Proclaimers")}/></Link><nav className="hub-top-nav" aria-label={translateUi("Main navigation")}>{translateUi(nav.map(([to, label]) => <Link key={to} to={to} aria-current={location.pathname === to ? 'page' : undefined}>{translateUi(label)}</Link>))}</nav><div className="hub-header-actions"><LanguageSwitcher/><Link className="hub-signin" to="/auth/login">{translateUi("Sign in")}</Link><Link className="hub-button" to="/auth/signup">{translateUi("Join PLP")}</Link><button className="hub-menu" aria-label={translateUi(open ? 'Close navigation' : 'Open navigation')} aria-expanded={open} aria-controls="public-menu" onClick={() => setOpen(!open)}>{translateUi(open ? <X /> : <Menu />)}</button></div></header>{translateUi(open && <nav id="public-menu" className="hub-mobile-nav" aria-label={translateUi("Mobile navigation")} onKeyDown={e => { if (e.key === 'Escape') {
        setOpen(false);
        document.querySelector<HTMLButtonElement>('.hub-menu')?.focus();
    } }}>{translateUi([...nav, ['/auth/login', 'Sign in'], ['/auth/signup', 'Join PLP']].map(([to, label]) => <Link key={to} to={to}>{translateUi(label)}</Link>))}</nav>)}</div><main><Outlet />{translateUi(location.pathname === '/plp-hub' && !import.meta.env.VITE_HUB_URL && <section id="availability" className="plp-community-section"><h2>{translateUi("The online Hub is being prepared.")}</h2><p>{translateUi("Explore PLP\u2019s programmes while we prepare member access.")}</p></section>)}</main><LandingFooter /><HelpChat/></div>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><LanguageDocument/><BrowserRouter><Routes><Route element={<Layout />}>{translateUi([['/', HomePage], ['/about', AboutPage], ['/programmes', ProgrammesPage], ['/stories', StoriesPage], ['/album', AlbumPage], ['/plp-canada', CanadaPage], ['/plp-hub', PublicHubPage]].map(([path, Page]) => { const Component = Page as typeof HomePage; return <Route key={path as string} path={path as string} element={<Component />}/>; }))}<Route path="*" element={<NotFoundPage />}/></Route></Routes></BrowserRouter></React.StrictMode>);
function NotFoundPage() { useSiteLanguage(); return <section className="plp-community-section"><h1>{translateUi("Page not found")}</h1><Link to="/">{translateUi("Return home")}</Link></section>; }
