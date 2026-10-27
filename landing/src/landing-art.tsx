import { translateUi, useSiteLanguage } from './i18n/language';
import { socialLinks } from "./site-content";
import { useState } from "react";
import { SiteLink as Link } from "./site-link";
import { ArrowUpRight, ArrowUp, Pause, Play, Mail } from "lucide-react";
export function Spark({ className = "" }: {
    className?: string;
}) {
    useSiteLanguage();
    return <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 4 58 34 82 17 66 42 96 50 66 58 82 83 58 66 50 96 42 66 18 83 34 58 4 50 34 42 18 17 42 34Z" fill="currentColor"/></svg>;
}
export function HandDrawnArrow() {
    useSiteLanguage();
    return <svg className="plp-drawn-arrow" viewBox="0 0 180 110" fill="none" aria-hidden="true"><path d="M8 13C60 4 33 77 88 70c43-6 47-46 17-41-27 5-14 65 64 64m-20-19 23 20-29 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
const moments = [
    { image: "plp-workshop", text: "Big ideas start here.", alt: "A PLP facilitator leading an Academy workshop" },
    { image: "plp-walk", text: "Every step, together.", alt: "A crowd walking together at a PLP community event" },
    { image: "plp-academy", text: "Find your voice.", alt: "A PLP Academy facilitator speaking with participants" },
    { image: "plp-dialogue", text: "Make room for conversation.", alt: "Participants gathered at a PLP dialogue" },
    { image: "plp-remembrance", text: "Remember. Unite. Renew.", alt: "A PLP remembrance gathering" },
];
export function PhotoPlayground() {
    useSiteLanguage();
    const [paused, setPaused] = useState(false);
    return <section className="plp-playground" aria-labelledby="plp-moments-title">
    <div className="plp-playground-heading"><div><p className="hub-eyebrow">{translateUi("FROM THE PLP COMMUNITY")}</p><h2 id="plp-moments-title">{translateUi("PLP, in ")}<span>{translateUi("pictures.")}<svg viewBox="0 0 230 20" aria-hidden="true"><path d="M3 11Q95-4 225 9M17 17Q105 4 209 15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></span></h2></div><div><p>{translateUi("Workshops, remembrance, and community gatherings.")}</p><button className="plp-motion-control" onClick={() => setPaused(!paused)} aria-pressed={paused}>{translateUi(paused ? <Play size={15}/> : <Pause size={15}/>)} {translateUi(paused ? "Play photo reel" : "Pause photo reel")}</button></div><Spark className="plp-gallery-spark"/></div>
    <div className={`plp-reel ${paused ? "is-paused" : ""}`}><div className="plp-reel-track">{translateUi([0, 1].map(copy => <div className="plp-reel-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>{translateUi(moments.map((m, i) => <figure key={m.image} className={`plp-moment plp-moment-${i}`}><img src={`/images/plp/${m.image}.webp`} alt={translateUi(copy ? "" : m.alt)} width="522" height="452" loading="lazy"/><figcaption><span>{translateUi("0")}{translateUi(i + 1)}</span>{translateUi(m.text)}<ArrowUpRight size={17}/></figcaption></figure>))}</div>))}</div></div>
    <div className="plp-playground-bottom"><span>{translateUi("Moments from our community")}</span><Link to="/album">{translateUi("Explore the PLP album ")}<ArrowUpRight size={18}/></Link></div>
  </section>;
}
export function LandingFooter() {
    useSiteLanguage();
    return <footer className="plp-art-footer">
    <svg className="plp-footer-tiles" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true"><g fill="currentColor"><path opacity=".25" d="M0 80h160v30H0zM320 80h160v30H320zM960 80h160v30H960zM1280 80h160v30h-160z"/><path opacity=".5" d="M160 80h160v30H160zM480 80h160v30H480zM800 80h160v30H800zM1120 80h160v30h-160z"/><path opacity=".35" d="M80 50h160v30H80zM400 50h160v30H400zM880 50h160v30H880zM1200 50h160v30h-160z"/><path opacity=".18" d="M240 50h160v30H240zM1040 50h160v30h-160zM160 20h160v30H160zM1120 20h160v30h-160z"/></g></svg>
    <div className="plp-footer-inner"><div className="plp-footer-invitation"><span>{translateUi("YOUR NEXT CHAPTER?")}</span><Link to="/auth/signup">{translateUi("Be part of")}<br /><em>{translateUi("PLP\u2019s next chapter.")}</em><ArrowUpRight /></Link><Spark className="plp-footer-spark"/></div>
      <div className="plp-footer-columns"><div className="plp-footer-brand"><Link to="/" className="plp-footer-logo" aria-label={translateUi("PLP home")}><img src="/favicon.svg" alt={translateUi("")} width="76" height="66"/><span><strong>{translateUi("PLP")}</strong><small>{translateUi("Peace and Love")}<br />{translateUi("Proclaimers")}</small></span></Link><p>{translateUi("Rooted in Rwanda.")}<br />{translateUi("Youth for Change, everywhere.")}</p></div><nav aria-label={translateUi("Footer explore")}><h2>{translateUi("Find your place")}</h2><Link to="/about">{translateUi("Our story")}</Link><Link to="/programmes">{translateUi("Our programmes")}</Link><Link to="/stories">{translateUi("Our impact")}</Link><Link to="/album">{translateUi("PLP album")}</Link><Link to="/#fun-corner">{translateUi("Fun corner")}</Link><Link to="/plp-canada">{translateUi("PLP Canada")}</Link><Link to="/auth/signup">{translateUi("Join the community")}</Link></nav><nav aria-label={translateUi("Footer resources")}><h2>{translateUi("Take a closer look")}</h2><a href="/resources/plp-portfolio.pdf" download>{translateUi("Organization portfolio ")}<ArrowUpRight size={13}/></a><a href="/resources/plp-impact-brief.pdf" download>{translateUi("Impact brief")}</a><Link to="/plp-hub">{translateUi("PLP Hub")}</Link><Link to="/auth/login">{translateUi("Member sign-in")}</Link></nav><div><h2>{translateUi("Say hello")}</h2><a className="plp-footer-email" href="mailto:info@peaceloveproclaimers.org"><Mail size={16}/>{translateUi("info@peaceloveproclaimers.org")}</a><a href="tel:+250788236141">{translateUi("+250 788 236 141")}</a><p>{translateUi("Kigali, Rwanda \u00B7 Canada chapter")}</p><nav className="plp-social-links" aria-label={translateUi("PLP social media")}>{translateUi(socialLinks.map(s => <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer">{translateUi(s.name)}<ArrowUpRight size={13}/></a>))}</nav></div></div>
      <div className="plp-footer-bottom"><span>{translateUi("\u00A9 ")}{translateUi(new Date().getFullYear())}{translateUi(" Peace and Love Proclaimers")}</span><span>{translateUi("Small steps. Shared futures.")}</span><button onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>{translateUi("Back to top ")}<ArrowUp size={16}/></button></div>
    </div>
  </footer>;
}
