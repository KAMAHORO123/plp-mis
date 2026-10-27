import { translateUi, useSiteLanguage } from '../../i18n/language';
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Download, BookOpen, Compass, Users, Award, Sparkles } from "lucide-react";
import { TestimonialsSection, FunCorner, AlbumSection, CanadaSection } from "./community-sections";
import { PhotoPlayground } from "./landing-art";
const programmes = [
    { id: "peace-memory", label: "Peace & memory", title: "Remembering together. Taking responsibility.", image: "plp-walk", alt: "Participants walking together at Walk to Remember", caption: "Peace & memory", intro: "Memory is part of how we build peace. PLP brings young people, survivors, and communities together to remember the 1994 Genocide against the Tutsi and confront the divisions that lead to violence.", items: [
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
    return <section className="plp-pathway-editorial" id="pathways"><div className="plp-pathway-intro"><p className="plp-section-label">{translateUi("OUR FLAGSHIP MODEL")}</p><h2>{translateUi("PLP Pathways")}</h2><p>{translateUi("From discovery to practical experience, then leadership in action. The three stages connect PLP\u2019s work across schools, universities, and communities.")}</p><div className="plp-pathway-symbol" aria-hidden="true"><span><BookOpen size={24}/>{translateUi("Discover")}</span><i>{translateUi("\u2197")}</i><span><Compass size={24}/>{translateUi("Do")}</span><i>{translateUi("\u2197")}</i><span><Sparkles size={24}/>{translateUi("Demonstrate")}</span></div></div><ol>{translateUi([
            ["Discover & Develop", "Clubs and homegroups are the starting point. Leadership, mentorship, and practical skills help members find their direction. The PLP Hub supports this stage as a digital learning platform."],
            ["Do: PLP Connect", "Apply what you learn through internships, volunteering, apprenticeships, professional mentorship, and business opportunities."],
            ["Demonstrate", "Bring your leadership and talents into community life through PLP’s peace, arts, wellness, and service initiatives."]
        ].map(([title, text], i) => <li key={title}><span>{translateUi("0")}{translateUi(i + 1)}</span><div><h3>{translateUi(title)}</h3><p>{translateUi(text)}</p>{translateUi(i === 0 && <Link className="plp-editorial-link" to="/courses">{translateUi("Explore Hub learning ")}<ArrowUpRight size={16}/></Link>)}</div></li>))}</ol></section>;
}
function Partnership() { useSiteLanguage(); return <section className="plp-partnership" id="partner"><p className="plp-section-label">{translateUi("WORK WITH PLP")}</p><h2>{translateUi("Put your experience")}<br />{translateUi("to work with young people.")}</h2><div><p>{translateUi("Partner on a programme, contribute a curriculum, host an internship, or co-create a community initiative. PLP\u2019s network connects partners with youth-led work in schools and communities.")}</p><a className="plp-editorial-link" href="mailto:info@peaceloveproclaimers.org?subject=Partner%20with%20PLP">{translateUi("Talk to PLP about a partnership ")}<ArrowUpRight size={18}/></a><PortfolioLink /></div></section>; }
const leadership = [
    ["Israel Nuru", "Executive Director", "Leads PLP and works alongside the Board of Directors."],
    ["Aime Mutemura", "Deputy Executive Director · Programs & Impact", "Discover & Develop and Demonstrate: clubs, homegroups, and PLP’s signature initiatives."],
    ["Divin Ibambasi", "Deputy Executive Director · Strategic Planning & Development", "PLP Connect: jobs, internships, mentorship, and membership."],
];
const directors = [
    ["Gaju Alidah", "Executive Secretary", "The executive office and administration."],
    ["Ntwari Abdallah", "Creative Director", "Organizational branding and creative direction."],
    ["N. Jean De Dieu", "Director of IT & Digital Systems", "PLP’s digital systems, including the PLP Hub."],
    ["Giramata Sandra", "Director of Finance", "Budgeting, accounting, and financial reporting."],
    ["Rita Sandrine", "Director of Partnerships", "Strategy, research, and resource mobilization."],
];
const teams: [
    string,
    string,
    [
        string,
        string
    ][]
][] = [
    ["IT & Digital Systems", "PLP Hub and digital tools", [["IT managers", "Kamahoro Linda Kellia · Livia · Kelly Gisubizo"]]],
    ["Discover & Develop", "PLP Hub", [["PLP Clubs", "Mutabazi · Amelia"], ["Homegroups", "Patrick · Phocas"], ["Youth Learning Hub", "Arnold M. · Beline"]]],
    ["Demonstrate", "Signature initiatives", [["Boardroom", "Shema Dan · Amanda Lelsie"], ["Walk to Remember & Ku Gicaniro", "ABI · Princess R."], ["Anda Art Festival", "Danny Kaberuka · Eviddy"], ["MegaCare", "Dalynah · Micha"], ["Sober Nights & Entertainment", "Colin K. · Biggy · Maxine"]]],
    ["Do", "PLP Connect", [["Jobs & Internships", "Parfine · Eunice"], ["Mentorship", "Natacha K."], ["Membership & Engagement", "Hirwa Djasiri · Ikaze Team"]]],
    ["Executive office", "With the Executive Secretary", [["Administration", "Divine Kayonga"]]],
    ["Creative", "Organizational branding", [["Copyright", "J-Yane · Caessy Ngarambe"], ["Account manager", "Ornella Nene"]]],
    ["Partnerships", "Strategy and resources", [["Strategy & Research", "Shema Dan"], ["Resource Mobilization & Strategic Outreach", "Caessy Ngarambe"]]],
];
const initials = (name: string) => name.replace(/^[A-Z]\.\s*/, "").split(/\s+/).filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join("");
function Person({ person: [name, role], lead = false }: {
    person: string[];
    lead?: boolean;
}) { useSiteLanguage(); return <li className={lead ? "plp-team-lead" : undefined}><span className="plp-team-monogram" aria-hidden="true">{translateUi(initials(name))}</span><div><h3>{translateUi(name)}</h3><p className="plp-team-role">{translateUi(role)}</p></div></li>; }
function Team() {
    useSiteLanguage();
    return <section className="plp-team" id="team" aria-labelledby="team-title">
  <div className="plp-team-intro"><p className="plp-section-label">{translateUi("THE PEOPLE BEHIND PLP")}</p><h2 id="team-title">{translateUi("Meet our team")}</h2><p>{translateUi("Working together for young people, with our club leaders, mentors, and volunteers.")}</p></div>
  <div className="plp-team-groups"><p className="plp-team-group-label">{translateUi("Leadership")}</p><ul className="plp-team-leadership">{translateUi(leadership.map(p => <Person key={p[0]} person={p} lead/>))}</ul><p className="plp-team-group-label">{translateUi("Directors")}</p><ul className="plp-team-directors">{translateUi(directors.map(p => <Person key={p[0]} person={p}/>))}</ul><p className="plp-team-group-label">{translateUi("Programmes and teams")}</p><div className="plp-team-units">{translateUi(teams.map(([area, , units]) => <section key={area}><h3>{translateUi(area === "Do" ? "PLP Connect" : area)}</h3><dl>{translateUi(units.map(([unit, people]) => <div key={unit}><dt>{translateUi(unit)}</dt><dd>{people.split(" · ").map(name => <span key={name}>{translateUi(name)}</span>)}</dd></div>))}</dl></section>))}</div><p className="plp-source-note">{translateUi("PLP is governed by a Board of Directors and supported by an Advisory Council.")}</p></div>
    </section>;
}
export function HomePage() {
    useSiteLanguage();
    return <>
  <section className="plp-landing-hero plp-restored-hero">
    <p className="plp-hero-kicker">{translateUi("PEACE AND LOVE PROCLAIMERS \u00B7 SINCE 2007")}</p>
    <h1>{translateUi("Young people. Shared purpose.")}<br /><span>{translateUi("A peaceful future.")}</span></h1>
    <p>{translateUi("Peace, leadership, culture, wellness, and service.")}<br className="plp-desktop-break"/>{translateUi(" A youth-led community rooted in Rwanda, reaching beyond borders.")}</p>
    <div className="hub-actions"><Link to="/programmes" className="hub-button">{translateUi("Explore our work ")}<ArrowRight size={18}/></Link><Link to="/about" className="plp-quiet-link">{translateUi("The story of PLP ")}<ArrowUpRight size={18}/></Link></div>
    <div className="plp-photo-stage">
      <figure className="plp-side-photo plp-side-left"><img src="/images/plp/icyeza-home-hd.png" alt={translateUi("Two PLP ICYEZA members holding a Peace and Love Proclaimers photo frame")} width="1135" height="1386" {...{fetchpriority: "high"}}/><figcaption>{translateUi("Peace, love & belonging.")}</figcaption></figure>
      <figure className="plp-main-photo"><span className="plp-photo-word" aria-hidden="true">{translateUi("together.")}</span><img src="/images/plp/plp-youth.webp" alt={translateUi("PLP members together in their MegaCare shirts")} width="1500" height="1001" {...{fetchpriority: "high"}}/><figcaption>{translateUi("Peace and Love Proclaimers \u00B7 Youth for Change")}</figcaption></figure>
      <figure className="plp-side-photo plp-side-right"><img src="/images/plp/plp-remembrance.webp" alt={translateUi("A community gathered in an arena for remembrance")} width="523" height="452"/><figcaption>{translateUi("Remembering together.")}</figcaption></figure>
    </div><div className="plp-hero-baseline"><span>{translateUi("Rwanda \u00B7 Canada \u00B7 One community")}</span><a href="#our-work">{translateUi("Discover PLP ")}<ArrowRight size={16}/></a></div>
  </section>
  <Reach />
  <section className="plp-org-intro"><p className="plp-section-label">{translateUi("WHAT BRINGS US TOGETHER")}</p><h2>{translateUi("Peace is at the heart.")}<br />{translateUi("Young people lead the work.")}</h2><p>{translateUi("Remembering our history. Creating space for expression. Supporting one another. Building skills and putting them to use. These are connected parts of PLP\u2019s work.")}</p></section>
  <ProgrammeFeatures />
  <Pathway />
  <PhotoPlayground />
  {translateUi(import.meta.env.DEV && <TestimonialsSection />)}
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
 <header className="plp-page-intro plp-hub-intro"><div className="plp-hub-intro-copy"><p className="plp-section-label">{translateUi("THE PLP HUB")}</p><h1>{translateUi("A place to learn.")}<br />{translateUi("A community to grow with.")}</h1><p>{translateUi("Build your skills, discover opportunities, and keep your PLP journey in one place.")}</p><div className="hub-actions"><Link className="hub-button" to="/hub">{translateUi("Enter the Hub ")}<ArrowUpRight size={18}/></Link><Link className="plp-editorial-link" to="/auth/signup">{translateUi("Become a member ")}<ArrowRight size={18}/></Link></div></div><div className="plp-hub-visual" aria-label={translateUi("Learn, connect, and grow with PLP")}><div className="plp-hub-orbit" aria-hidden="true"/><div className="plp-hub-core"><img src="/logo.svg" alt={translateUi("")} width="70" height="70"/><strong>{translateUi("Your next")}<br />{translateUi("chapter.")}</strong><span>{translateUi("STARTS WITH YOU")}</span></div><div className="plp-hub-float hub-float-learn"><BookOpen /><span>{translateUi("Stay curious.")}<strong>{translateUi("Learn something new.")}</strong></span></div><div className="plp-hub-float hub-float-connect"><Users /><span>{translateUi("Find your people.")}<strong>{translateUi("Grow together.")}</strong></span></div><div className="plp-hub-float hub-float-grow"><Award /><span>{translateUi("Make it count.")}<strong>{translateUi("Celebrate progress.")}</strong></span></div><span className="plp-hub-visual-note">{translateUi("LEARN \u00B7 CONNECT \u00B7 BECOME")}</span></div></header>
 <section className="plp-community-section plp-hub-overview" aria-label={translateUi("Explore the PLP Hub")}>{translateUi([
            ['01', 'Learn at your pace', 'Explore leadership, digital skills, entrepreneurship, employability, and peacebuilding.', '/courses', 'Explore learning'],
            ['02', 'Find your next opportunity', 'Discover opportunities and connect with the support to take your next step.', '/opportunities', 'View opportunities'],
            ['03', 'Stay connected', 'See what’s happening across PLP clubs and communities.', '/clubs', 'Explore activities'],
            ['04', 'See your progress', 'Keep track of your learning, achievements, and certificates in your member workspace.', '/passport', 'Open my profile'],
        ].map(([number, title, description, to, label]) => <article key={number}><div className="plp-hub-card-top"><span className="plp-section-label">{translateUi(number)}{translateUi(" / YOUR JOURNEY")}</span>{translateUi(number === '01' ? <BookOpen /> : number === '02' ? <Compass /> : number === '03' ? <Users /> : <Award />)}</div><h2>{translateUi(title)}</h2><p>{translateUi(description)}</p><Link className="plp-editorial-link" to={to}>{translateUi(label)}<ArrowUpRight size={16}/></Link></article>))}</section>
 </>;
}
export function CanadaPage() { useSiteLanguage(); return <><header className="plp-page-intro plp-canada-page-intro"><p className="plp-section-label">{translateUi("PEACE AND LOVE PROCLAIMERS")}</p><h1>{translateUi("PLP Canada.")}</h1><p>{translateUi("Connected by heritage. Brought together by purpose.")}</p></header><CanadaSection /></>; }
