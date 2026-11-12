import { translateUi, useSiteLanguage } from './i18n/language';
import { teamPhotos, teamGallery } from './team-photos';
import { SiteLink as Link } from "./site-link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Download, BookOpen, Compass, Users, Award } from "lucide-react";
import { TestimonialsSection, FunCorner, AlbumSection, CanadaSection } from "./community-sections";
import { PhotoPlayground } from "./landing-art";
const programmes = [
    { id: "peace-memory", label: "Peace & memory", title: "Remembering together. Taking responsibility.", image: "plp-walk-to-remember", alt: "Thousands of young people dressed in black walking together in Kigali during the Walk to Remember", caption: "Peace & memory", intro: "Memory is part of how we build peace. PLP brings young people, survivors, and communities together to remember the 1994 Genocide against the Tutsi and confront the divisions that lead to violence.", items: [
            ["Walk to Remember", "Initiated by PLP in 2009, this youth-led campaign brings remembrance walks, survivor testimonies, poetry, and art into a shared act of commemoration. The initiative has reached more than 25 countries."],
            ["Ku Gicaniro Dialogue", "Honest conversations about history, responsibility, and unity give young people a space to learn about genocide prevention and challenge divisionism and hate."]
        ] },
    { id: "leadership", label: "Leadership & opportunity", title: "Learning that continues in the community.", image: "plp-academy", alt: "A facilitator leading a PLP Academy session", caption: "PLP Academy · Leadership development", intro: "PLP links leadership development with practical experience. Young people learn alongside mentors, work on community challenges, and build the experience to take their next step.", items: [
            ["The Boardroom / PLP Academy", "The Boardroom, formerly PLP Academy, supports youth leadership development. Its Academy model combines a residential development bootcamp with service-based immersion, mentorship, and training in research, peacebuilding, and digital and financial literacy."],
            ["PLP Connect", "Members connect to internships, apprenticeships, employment, scholarships, fellowships, volunteering, professional mentorship, and business support. More than 100 volunteers have been placed across AMI Africa projects."]
        ] },
    { id: "arts", label: "Culture & creativity", title: "Our stories. In our own voices.", image: "plp-arts", alt: "Participants painting together at a PLP arts activity", caption: "Creative participation", intro: "Cultural identity belongs in youth development. Through creative expression, young people explore tradition, share their experiences, and make space for new talent.", items: [
            ["Anda Arts Initiative", "A cultural talent competition celebrating dance, music, poetry, and storytelling. Anda Arts connects pride in tradition with creative expression and opportunities in the arts."]
        ] },
    { id: "wellness", label: "Wellness & belonging", title: "Room to talk. Reasons to celebrate.", image: "plp-sober-nights", alt: "Young people celebrating at an event shown in the PLP wellness programme", caption: "Kickin’ it Sober & Sober Nights", intro: "PLP’s wellness programmes bring emotional resilience and healthy choices into everyday community life, through conversation, sport, music, and shared experiences.", items: [
            ["Sober Campaign", "A campaign bringing young people together around healthy choices, emotional resilience, and substance-free celebration through peer conversations, creative expression, and shared experiences."],
            ["Kickin’ it Sober & Sober Nights", "Sports, dance nights, and peer-led talks promote healthy lifestyles and challenge substance abuse while making room for celebration."]
        ] },
    { id: "service", label: "Community service", title: "Care is something we do.", image: "plp-megacare", alt: "PLP MegaCare representatives at a community support presentation", caption: "MegaCare · Youth-led philanthropy", intro: "Members contribute their time and resources to support vulnerable communities. Service gives young people a direct role in the wellbeing of the people around them.", items: [
            ["MegaCare", "PLP’s youth-led philanthropy movement turns compassion into practical support and builds a culture of shared responsibility and community development."]
        ] },
];
function PortfolioLink() { useSiteLanguage(); return <a className="plp-editorial-link" href="/resources/plp-portfolio.pdf" download><Download size={17}/>{translateUi(" Read the organization portfolio")}</a>; }
function Reach() { useSiteLanguage(); return <section className="plp-reach" aria-label={translateUi("PLP\u2019s reach")}><p>{translateUi("PLP\u2019s reach")}</p><dl>{translateUi([["40,000+", "young people impacted"], ["141", "high schools reached"], ["2", "university communities"], ["10,000+", "members since inception"]].map(([n, label]) => <div key={label}><dt>{translateUi(label)}</dt><dd>{translateUi(n)}</dd></div>))}</dl></section>; }
function ProgrammeFeatures({ full = false }: {
    full?: boolean;
}) {
    useSiteLanguage();
    return <div className={`plp-programme-wall ${full ? "plp-wall-full" : ""}`} id="our-work">{translateUi(programmes.map((p, i) => <article id={p.id} className={`plp-programme-poster poster-${i}`} key={p.id}>
  <Link to={`/programmes#${p.id}`} className="plp-poster-link" aria-label={translateUi("Explore {p0}", { p0: translateUi(p.label.toLowerCase()) })}>
    <img src={`/images/plp/${p.image}.webp`} alt={translateUi(p.alt)} width="522" height="452" loading="lazy"/>
    <span className="plp-poster-number">{translateUi("0")}{translateUi(i + 1)}{translateUi(" / PLP")}</span><div className="plp-poster-caption"><p>{translateUi(p.label)}</p><h2>{translateUi(p.items[0][0])}</h2><span>{translateUi(p.items.length > 1 ? p.items.slice(1).map(x => x[0]).join(" · ") : p.title)}</span><ArrowUpRight size={26}/></div>
  </Link>
  {translateUi(full && <div className="plp-poster-details"><p>{translateUi(p.intro)}</p>{translateUi(p.items.map(([title, text]) => <details key={title}><summary>{translateUi(title)}<span aria-hidden="true">{translateUi("+")}</span></summary><p>{translateUi(text)}</p></details>))}<small>{translateUi(p.caption)}</small></div>)}
        </article>))}</div>;
}
function Pathway() {
    useSiteLanguage();
    return <section className="plp-pathway-editorial" id="pathways"><div className="plp-pathway-intro"><p className="plp-section-label">{translateUi("OUR FLAGSHIP MODEL")}</p><h2>{translateUi("PLP Pathways")}</h2><p>{translateUi("From discovering and developing your strengths to putting them into action. The two stages connect PLP\u2019s work across schools, universities, and communities.")}</p><div className="plp-pathway-symbol" aria-hidden="true"><span><BookOpen size={24}/>{translateUi("Discover & Develop")}</span><i>{translateUi("\u2197")}</i><span><Compass size={24}/>{translateUi("Do & Demonstrate")}</span></div></div><ol>{translateUi([
            ["Discover & Develop", "Clubs and homegroups are the starting point. Leadership, mentorship, and practical skills help members find their direction. The PLP Hub supports this stage as a digital learning platform.", "/courses", "Explore Hub learning "],
            ["Do & Demonstrate", "Through PLP Connect, put what you have learned into action. PLP connects you with communities and opens up opportunities: internships, volunteering, apprenticeships, professional mentorship, business, and leadership in PLP\u2019s peace, arts, wellness, and service initiatives.", "/opportunities", "Explore opportunities "]
        ].map(([title, text, to, label], i) => <li key={title}><span>{translateUi("0")}{translateUi(i + 1)}</span><div><h3>{translateUi(title)}</h3><p>{translateUi(text)}</p><Link className="plp-editorial-link" to={to}>{translateUi(label)}<ArrowUpRight size={16}/></Link></div></li>))}</ol></section>;
}
function Partnership() { useSiteLanguage(); return <section className="plp-partnership" id="partner"><p className="plp-section-label">{translateUi("WORK WITH PLP")}</p><h2>{translateUi("Put your experience")}<br />{translateUi("to work with young people.")}</h2><div><p>{translateUi("Partner on a programme, contribute a curriculum, host an internship, or co-create a community initiative. PLP\u2019s network connects partners with youth-led work in schools and communities.")}</p><a className="plp-editorial-link" href="mailto:info@peaceloveproclaimers.org?subject=Partner%20with%20PLP">{translateUi("Talk to PLP about a partnership ")}<ArrowUpRight size={18}/></a><PortfolioLink /></div></section>; }
/**
 * Everyone's photo in a banner that moves slowly from left to right. It pauses on hover or keyboard focus and with the
 * Pause button (WCAG 2.2.2); with reduced motion it stays still and can be scrolled sideways. The list is drawn twice
 * so the loop is seamless; the copy is hidden from screen readers.
 */
function TeamBanner({ paused }: { paused: boolean }) {
    useSiteLanguage();
    const cards = () => teamGallery.map(p => <li key={p.name}><img src={`/images/plp/team/${teamPhotos[p.name]}-card.webp`} alt="" width={320} height={400} loading="lazy" decoding="async"/><div><strong>{translateUi(p.name)}</strong><small>{translateUi(p.role)}</small></div></li>);
    return <div className={`plp-team-marquee${paused ? " is-paused" : ""}`} role="region" aria-label={translateUi("Photos of the PLP team")} tabIndex={0}>
    <div className="plp-team-track"><ul>{cards()}</ul><ul aria-hidden="true">{cards()}</ul></div>
  </div>;
}
function Team() {
    useSiteLanguage();
    const [paused, setPaused] = useState(false);
    return <section className="plp-team" id="team" aria-labelledby="team-title">
  <div className="plp-team-head"><div className="plp-team-intro"><p className="plp-section-label">{translateUi("THE PEOPLE BEHIND PLP")}</p><h2 id="team-title">{translateUi("Meet our team")}</h2><p>{translateUi("Working together for young people, with our club leaders, mentors, and volunteers.")}</p></div>
   <button type="button" className="plp-team-pause" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={16}/> : <Pause size={16}/>}{translateUi(paused ? "Play photos" : "Pause photos")}</button></div>
  <TeamBanner paused={paused}/>
    </section>;
}
/** Full-width hero slider: each photo carries its own headline and link; the first slide is the page title. */
// Every slide has the same two-line heading: a name in gold, then what it is about in light blue.
const HERO_SLIDES = [
    { src: "/images/plp/albums/camp-8.jpg", position: "center 35%", name: "PLP Hub", title: "Learn and lead.", text: "Courses, mentoring and real opportunities for young people, all in one place.", to: "/plp-hub", cta: "Discover the PLP Hub" },
    { src: "/images/plp/plp-walk-to-remember.webp", position: "center 60%", name: "Walk to Remember", title: "Walk as one.", text: "Every year, thousands walk with us to remember and to stand as one for unity.", to: "/about", cta: "Our story" },
    { src: "/images/plp/plp-arts.webp", position: "center 40%", name: "Arts & culture", title: "Create freely.", text: "Art, music and expression that bring young people together.", to: "/programmes", cta: "Our programmes" },
    { src: "/images/plp/albums/academy-8.jpg", position: "center 30%", name: "PLP Academy", title: "Grow together.", text: "A youth-led community rooted in Rwanda, reaching beyond borders.", to: "/programmes", cta: "Explore our work" },
    { src: "/images/plp/plp-dialogue.webp", position: "center 55%", name: "Dialogue", title: "Speak up.", text: "Dialogue that turns young voices into action.", to: "/stories", cta: "Our impact" },
];
function HeroSlider() {
    useSiteLanguage();
    const [index, setIndex] = useState(0), [paused, setPaused] = useState(false), [touchX, setTouchX] = useState<number | null>(null);
    const go = (step: number) => setIndex(i => (i + step + HERO_SLIDES.length) % HERO_SLIDES.length);
    useEffect(() => {
        // Slides always advance on their own; the pause button stops them (reduced motion only drops the zoom).
        if (paused)
            return;
        const timer = window.setTimeout(() => go(1), 6000);
        return () => clearTimeout(timer);
    }, [index, paused]);
    return <section className={`plp-showcase${paused ? " is-paused" : ""}`} aria-roledescription="carousel" aria-label={translateUi("Peace and Love Proclaimers")} onTouchStart={e => setTouchX(e.touches[0].clientX)} onTouchEnd={e => { if (touchX !== null && Math.abs(e.changedTouches[0].clientX - touchX) > 40) go(e.changedTouches[0].clientX < touchX ? 1 : -1); setTouchX(null); }}>
      {HERO_SLIDES.map((s, i) => {
        const Heading = i === 0 ? "h1" : "h2", active = i === index;
        return <div key={s.src} className={`plp-showcase-slide${active ? " is-active" : ""}`} aria-roledescription="slide" aria-label={translateUi("{p0} of {p1}", { p0: i + 1, p1: HERO_SLIDES.length })} aria-hidden={active ? undefined : true}>
          <img src={s.src} alt="" style={{ objectPosition: s.position }} loading={i === 0 ? "eager" : "lazy"} {...(i === 0 ? { fetchpriority: "high" } : {})}/>
          <div className="plp-showcase-copy">
            <p className="plp-showcase-kicker">{translateUi("PEACE AND LOVE PROCLAIMERS · SINCE 2007")}</p>
            <Heading><span className="plp-hero-name">{translateUi(s.name)}</span><br /><span>{translateUi(s.title)}</span></Heading>
            <p>{translateUi(s.text)}</p>
            <Link to={s.to} className="hub-button" tabIndex={active ? undefined : -1}>{translateUi(s.cta)}<ArrowRight size={18}/></Link>
          </div>
        </div>;
      })}
      <div className="plp-showcase-controls">
        <span className="plp-showcase-count" aria-hidden="true"><strong>{String(index + 1).padStart(2, "0")}</strong> / {String(HERO_SLIDES.length).padStart(2, "0")}</span>
        <span className="plp-showcase-bars">{HERO_SLIDES.map((s, i) => <button key={s.src} type="button" className={i === index ? "is-active" : i < index ? "is-done" : undefined} aria-label={translateUi("Show slide {p0}", { p0: i + 1 })} aria-current={i === index ? "true" : undefined} onClick={() => setIndex(i)}><i key={i === index ? `on-${index}` : "off"}/></button>)}</span>
        <button type="button" className="plp-showcase-arrow" aria-label={translateUi(paused ? "Play slideshow" : "Pause slideshow")} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={16}/> : <Pause size={16}/>}</button>
        <button type="button" className="plp-showcase-arrow" aria-label={translateUi("Previous slide")} onClick={() => go(-1)}><ArrowLeft size={18}/></button>
        <button type="button" className="plp-showcase-arrow" aria-label={translateUi("Next slide")} onClick={() => go(1)}><ArrowRight size={18}/></button>
      </div>
    </section>;
}
export function HomePage() {
    useSiteLanguage();
    return <>
  <HeroSlider />
  <Reach />
  <section className="plp-org-intro"><p className="plp-section-label">{translateUi("WHAT BRINGS US TOGETHER")}</p><h2>{translateUi("Peace is at the heart.")}<br />{translateUi("Young people lead the work.")}</h2></section>
  <ProgrammeFeatures />
  <Pathway />
  <PhotoPlayground />
  <TestimonialsSection />
  <FunCorner />
  <Partnership />
    </>;
}
export function ProgrammesPage() { useSiteLanguage(); return <><header className="plp-page-intro"><p className="plp-section-label">{translateUi("OUR WORK")}</p><h1>{translateUi("Peace, leadership,")}<br />{translateUi("and life in community.")}</h1><p>{translateUi("Explore the programmes that bring PLP\u2019s mission into practice, from remembrance and cultural expression to wellness and service.")}</p><nav className="plp-programme-index" aria-label={translateUi("Programme areas")}>{translateUi(programmes.map(p => <a href={`#${p.id}`} key={p.id}>{translateUi(p.label)}<ArrowUpRight size={14}/></a>))}<a href="#pathways">{translateUi("PLP Pathways")}<ArrowUpRight size={14}/></a></nav></header><ProgrammeFeatures full/><Pathway /><Partnership /></>; }
export function AboutPage() {
    useSiteLanguage();
    return <>
  <header className="plp-page-intro"><p className="plp-section-label">{translateUi("ABOUT PEACE AND LOVE PROCLAIMERS")}</p><h1>{translateUi("Youth for Change.")}<br />{translateUi("Since 2007.")}</h1><p>{translateUi("PLP is a youth-led organization creating future leaders through unity, peace, and youth development. Young people take responsibility for strengthening their communities and building a more unified world.")}</p></header>
  <figure className="plp-org-wide-photo"><img src="/images/plp/plp-community.webp" alt={translateUi("A group of PLP members pictured together")} width="1242" height="822"/><figcaption>{translateUi("The PLP community")}</figcaption></figure>
  <section className="plp-about-statements"><div><p className="plp-section-label">{translateUi("OUR VISION")}</p><h2>{translateUi("A united and peaceful world, led by skilled and empowered youth.")}</h2></div><div><p className="plp-section-label">{translateUi("OUR MISSION")}</p><p>{translateUi("To develop a generation of young people equipped with leadership, cultural identity, and practical skills, enabling them to build peaceful, resilient, and thriving communities.")}</p><h3>{translateUi("Why this work matters")}</h3><p>{translateUi("Our work addresses connected challenges: unemployment and limited practical skills, post-genocide trauma and loss of historical identity, mental health stigma and substance abuse, poverty and school dropout, and gaps in career readiness.")}</p></div></section>
  <Reach />
  <section className="plp-about-statements"><div><p className="plp-section-label">{translateUi("WHERE WE COME TOGETHER")}</p><h2>{translateUi("In schools.")}<br />{translateUi("In communities.")}<br />{translateUi("Across borders.")}</h2></div><div><p>{translateUi("Clubs and homegroups bring PLP into high schools, universities, and local communities. Rwanda is PLP\u2019s base and benchmark country.")}</p><p>{translateUi("A Canada chapter launched on July 26, 2025, extending the organization\u2019s community beyond Rwanda.")}</p><Link className="plp-editorial-link" to="/auth/signup">{translateUi("Join PLP ")}<ArrowUpRight size={18}/></Link></div></section>
  <Team />
  <Partnership />
    </>;
}
export function StoriesPage() {
    useSiteLanguage();
    return <>
  <header className="plp-page-intro"><p className="plp-section-label">{translateUi("OUR IMPACT")}</p><h1>{translateUi("A record of")}<br />{translateUi("youth-led action.")}</h1><p>{translateUi("Milestones in youth leadership, community service, and peacebuilding.")}</p></header><Reach />
  <section className="plp-impact-lead"><figure><img src="/images/plp/plp-remembrance.webp" alt={translateUi("Participants gathered in an arena for a remembrance event")} width="523" height="452"/><figcaption>{translateUi("Community participation")}</figcaption></figure><div><p className="plp-section-label">{translateUi("2009 \u2192 A GLOBAL INITIATIVE")}</p><h2>{translateUi("Walk to Remember")}</h2><p>{translateUi("Initiated by PLP in 2009, Walk to Remember became a national commemoration initiative in Rwanda. It has been organized in more than 25 countries.")}</p><Link className="plp-editorial-link" to="/programmes#peace-memory">{translateUi("Read about peace & memory ")}<ArrowUpRight size={18}/></Link></div></section>
  <section className="plp-impact-record"><article><span>{translateUi("01 / RECOGNITION")}</span><h2>{translateUi("Youth-led impact, recognized.")}</h2><p>{translateUi("PLP received recognition from Rwanda\u2019s First Lady for its impact on more than 40,000 young people.")}</p></article><article><span>{translateUi("02 / OPPORTUNITY")}</span><h2>{translateUi("100+ volunteer placements.")}</h2><p>{translateUi("Through its partnership with AMI Africa, PLP has placed more than 100 volunteers across AMI projects, building professional experience and pathways to employment.")}</p></article><article><span>{translateUi("03 / COMMUNITY")}</span><h2>{translateUi("A new chapter in Canada.")}</h2><p>{translateUi("Launched on July 26, 2025, the Canada chapter extends PLP\u2019s network beyond its base in Rwanda.")}</p></article></section>
  <section className="plp-targets"><div><p className="plp-section-label">{translateUi("LOOKING AHEAD")}</p><h2>{translateUi("What PLP is working towards.")}</h2><p>{translateUi("Our goals for expanding opportunity and strengthening communities.")}</p></div><ul><li>{translateUi("Reach 200 high schools and 5 universities.")}</li><li>{translateUi("Engage 4,000 active members, with 60% women.")}</li><li>{translateUi("Support 100 internship or apprenticeship placements.")}</li><li>{translateUi("Track improved unity and peace knowledge for 5,000+ youth, alongside social and emotional learning measures.")}</li></ul></section>
  <div className="plp-source-download"><PortfolioLink /></div><Partnership />
    </>;
}
export function AlbumPage() { useSiteLanguage(); return <AlbumSection />; }
export function PublicHubPage() {
    useSiteLanguage();
    return <>
 <header className="plp-page-intro plp-hub-intro"><div className="plp-hub-intro-copy"><p className="plp-section-label">{translateUi("THE PLP HUB")}</p><h1>{translateUi("A place to learn.")}<br />{translateUi("A community to grow with.")}</h1><p>{translateUi("Build your skills, discover opportunities, and keep your PLP journey in one place.")}</p><div className="hub-actions"><Link className="hub-button" to="/hub">{translateUi("Enter the Hub ")}<ArrowUpRight size={18}/></Link><Link className="plp-editorial-link" to="/auth/signup">{translateUi("Become a member ")}<ArrowRight size={18}/></Link></div></div><div className="plp-hub-visual" aria-label={translateUi("Learn, connect, and grow with PLP")}><div className="plp-hub-orbit" aria-hidden="true"/><div className="plp-hub-core"><img className="plp-logo-light" src="/logo.svg" alt={translateUi("")} width="70" height="70"/><img className="plp-logo-dark" src="/logo-dark.svg" alt="" aria-hidden="true" width="70" height="70"/><strong>{translateUi("Your next")}<br />{translateUi("chapter.")}</strong><span>{translateUi("STARTS WITH YOU")}</span></div><div className="plp-hub-float hub-float-learn"><BookOpen /><span>{translateUi("Stay curious.")}<strong>{translateUi("Learn something new.")}</strong></span></div><div className="plp-hub-float hub-float-connect"><Users /><span>{translateUi("Find your people.")}<strong>{translateUi("Grow together.")}</strong></span></div><div className="plp-hub-float hub-float-grow"><Award /><span>{translateUi("Make it count.")}<strong>{translateUi("Celebrate progress.")}</strong></span></div><span className="plp-hub-visual-note">{translateUi("LEARN \u00B7 CONNECT \u00B7 BECOME")}</span></div></header>
 <section className="plp-community-section plp-hub-overview" aria-label={translateUi("Explore the PLP Hub")}>{translateUi([
            ['01', 'Learn at your pace', 'Explore leadership, digital skills, entrepreneurship, employability, and peacebuilding.', '/courses', 'Explore learning'],
            ['02', 'Find your next opportunity', 'Discover opportunities and connect with the support to take your next step.', '/opportunities', 'View opportunities'],
            ['03', 'Stay connected', 'See what’s happening across PLP clubs and communities.', '/clubs', 'Explore activities'],
            ['04', 'See your progress', 'Keep track of your learning, achievements, and certificates in your member workspace.', '/passport', 'Open my profile'],
        ].map(([number, title, description, to, label]) => <article key={number}><div className="plp-hub-card-top"><span className="plp-section-label">{translateUi(number)}{translateUi(" / YOUR JOURNEY")}</span>{translateUi(number === '01' ? <BookOpen /> : number === '02' ? <Compass /> : number === '03' ? <Users /> : <Award />)}</div><h2>{translateUi(title)}</h2><p>{translateUi(description)}</p><Link className="plp-editorial-link" to={to}>{translateUi(label)}<ArrowUpRight size={16}/></Link></article>))}</section>
 </>;
}
export function CanadaPage() { useSiteLanguage(); return <><header className="plp-page-intro plp-canada-page-intro"><p className="plp-section-label">{translateUi("PEACE AND LOVE PROCLAIMERS")}</p><h1>{translateUi("PLP Canada.")}</h1><p>{translateUi("Connected by heritage. Brought together by purpose.")}</p></header><CanadaSection /></>; }
