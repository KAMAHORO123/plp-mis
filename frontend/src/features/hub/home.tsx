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
function PortfolioLink() { return <a className="plp-editorial-link" href="/resources/plp-portfolio.pdf" download><Download size={17}/> Read the organization portfolio</a>; }
function Reach() { return <section className="plp-reach" aria-label="PLP’s reach"><p>PLP’s reach</p><dl>{[["40,000+","young people impacted"],["141","high schools reached"],["2","university communities"],["10,000+","members since inception"]].map(([n,label])=><div key={label}><dt>{label}</dt><dd>{n}</dd></div>)}</dl></section>; }
function ProgrammeFeatures({full = false}: {full?: boolean}) { return <div className={`plp-programme-wall ${full ? "plp-wall-full" : ""}`} id="our-work">{programmes.map((p,i)=><article id={p.id} className={`plp-programme-poster poster-${i}`} key={p.id}>
  <Link to={`/programmes#${p.id}`} className="plp-poster-link" aria-label={`Explore ${p.label.toLowerCase()}`}>
    <img src={`/images/plp/${p.image}.webp`} alt={p.alt} width="522" height="452" loading="lazy"/>
    <span className="plp-poster-number">0{i+1} / PLP</span><div className="plp-poster-caption"><p>{p.label}</p><h2>{p.items[0][0]}</h2><span>{p.items.length > 1 ? p.items.slice(1).map(x=>x[0]).join(" · ") : p.title}</span><ArrowUpRight size={26}/></div>
  </Link>
  {full && <div className="plp-poster-details"><p>{p.intro}</p>{p.items.map(([title,text])=><details key={title}><summary>{title}<span aria-hidden="true">+</span></summary><p>{text}</p></details>)}<small>{p.caption}</small></div>}
</article>)}</div>; }
function Pathway() { return <section className="plp-pathway-editorial" id="pathways"><div className="plp-pathway-intro"><p className="plp-section-label">OUR FLAGSHIP MODEL</p><h2>PLP Pathways</h2><p>From discovery to practical experience, then leadership in action. The three stages connect PLP’s work across schools, universities, and communities.</p><div className="plp-pathway-symbol" aria-hidden="true"><span><BookOpen size={24}/>Discover</span><i>↗</i><span><Compass size={24}/>Do</span><i>↗</i><span><Sparkles size={24}/>Demonstrate</span></div></div><ol>{[
  ["Discover & Develop","Clubs and homegroups are the starting point. Leadership, mentorship, and practical skills help members find their direction. The PLP Hub supports this stage as a digital learning platform."],
  ["Do: PLP Connect","Apply what you learn through internships, volunteering, apprenticeships, professional mentorship, and business opportunities."],
  ["Demonstrate","Bring your leadership and talents into community life through PLP’s peace, arts, wellness, and service initiatives."]
].map(([title,text],i)=><li key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{text}</p>{i===0&&<Link className="plp-editorial-link" to="/courses">Explore Hub learning <ArrowUpRight size={16}/></Link>}</div></li>)}</ol></section>; }
function Partnership() { return <section className="plp-partnership" id="partner"><p className="plp-section-label">WORK WITH PLP</p><h2>Put your experience<br/>to work with young people.</h2><div><p>Partner on a programme, contribute a curriculum, host an internship, or co-create a community initiative. PLP’s network connects partners with youth-led work in schools and communities.</p><a className="plp-editorial-link" href="mailto:info@peaceloveproclaimers.org?subject=Partner%20with%20PLP">Talk to PLP about a partnership <ArrowUpRight size={18}/></a><PortfolioLink/></div></section>; }
const leadership = [
  ["Israel Nuru","Executive Director","Leads PLP and works alongside the Board of Directors."],
  ["Aime Mutemura","Deputy Executive Director · Programs & Impact","Discover & Develop and Demonstrate: clubs, homegroups, and PLP’s signature initiatives."],
  ["Divin Ibambasi","Deputy Executive Director · Strategic Planning & Development","PLP Connect: jobs, internships, mentorship, and membership."],
];
const directors = [
  ["Gaju Alidah","Executive Secretary","The executive office and administration."],
  ["Ntwari Abdallah","Creative Director","Organizational branding and creative direction."],
  ["N. Jean De Dieu","Director of IT & Digital Systems","PLP’s digital systems, including the PLP Hub."],
  ["Giramata Sandra","Director of Finance","Budgeting, accounting, and financial reporting."],
  ["Rita Sandrine","Director of Partnerships","Strategy, research, and resource mobilization."],
];
const teams: [string, string, [string, string][]][] = [
  ["IT & Digital Systems","PLP Hub and digital tools",[["IT managers","Kamahoro Linda Kellia · Livia · Kelly Gisubizo"]]],
  ["Discover & Develop","PLP Hub",[["PLP Clubs","Mutabazi · Amelia"],["Homegroups","Patrick · Phocas"],["Youth Learning Hub","Arnold M. · Beline"]]],
  ["Demonstrate","Signature initiatives",[["Boardroom","Shema Dan · Amanda Lelsie"],["Walk to Remember & Ku Gicaniro","ABI · Princess R."],["Anda Art Festival","Danny Kaberuka · Eviddy"],["MegaCare","Dalynah · Micha"],["Sober Nights & Entertainment","Colin K. · Biggy · Maxine"]]],
  ["Do","PLP Connect",[["Jobs & Internships","Parfine · Eunice"],["Mentorship","Natacha K."],["Membership & Engagement","Hirwa Djasiri · Ikaze Team"]]],
  ["Executive office","With the Executive Secretary",[["Administration","Divine Kayonga"]]],
  ["Creative","Organizational branding",[["Copyright","J-Yane · Caessy Ngarambe"],["Account manager","Ornella Nene"]]],
  ["Partnerships","Strategy and resources",[["Strategy & Research","Shema Dan"],["Resource Mobilization & Strategic Outreach","Caessy Ngarambe"]]],
];
const initials = (name: string) => name.replace(/^[A-Z]\.\s*/, "").split(/\s+/).filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join("");
function Person({person: [name, role], lead = false}: {person: string[]; lead?: boolean}) { return <li className={lead ? "plp-team-lead" : undefined}><span className="plp-team-monogram" aria-hidden="true">{initials(name)}</span><div><h3>{name}</h3><p className="plp-team-role">{role}</p></div></li>; }
function Team() { return <section className="plp-team" id="team" aria-labelledby="team-title">
  <div className="plp-team-intro"><p className="plp-section-label">THE PEOPLE BEHIND PLP</p><h2 id="team-title">Meet our team</h2><p>Working together for young people, with our club leaders, mentors, and volunteers.</p></div>
  <div className="plp-team-groups"><p className="plp-team-group-label">Leadership</p><ul className="plp-team-leadership">{leadership.map(p=><Person key={p[0]} person={p} lead/>)}</ul><p className="plp-team-group-label">Directors</p><ul className="plp-team-directors">{directors.map(p=><Person key={p[0]} person={p}/>)}</ul><p className="plp-team-group-label">Programmes and teams</p><div className="plp-team-units">{teams.map(([area,,units])=><section key={area}><h3>{area === "Do" ? "PLP Connect" : area}</h3><dl>{units.map(([unit,people])=><div key={unit}><dt>{unit}</dt><dd>{people}</dd></div>)}</dl></section>)}</div><p className="plp-source-note">PLP is governed by a Board of Directors and supported by an Advisory Council.</p></div>
</section>; }
export function HomePage() { return <>
  <section className="plp-landing-hero plp-restored-hero">
    <p className="plp-hero-kicker">PEACE AND LOVE PROCLAIMERS · SINCE 2007</p>
    <h1>Young people. Shared purpose.<br/><span>A peaceful future.</span></h1>
    <p>Peace, leadership, culture, wellness, and service.<br className="plp-desktop-break"/> A youth-led community rooted in Rwanda, reaching beyond borders.</p>
    <div className="hub-actions"><Link to="/programmes" className="hub-button">Explore our work <ArrowRight size={18}/></Link><Link to="/about" className="plp-quiet-link">The story of PLP <ArrowUpRight size={18}/></Link></div>
    <div className="plp-photo-stage">
      <figure className="plp-side-photo plp-side-left"><img src="/images/plp/icyeza-home-hd.png" alt="Two PLP ICYEZA members holding a Peace and Love Proclaimers photo frame" width="1135" height="1386" {...{fetchpriority: "high"}}/><figcaption>Peace, love & belonging.</figcaption></figure>
      <figure className="plp-main-photo"><span className="plp-photo-word" aria-hidden="true">together.</span><img src="/images/plp/plp-youth.webp" alt="PLP members together in their MegaCare shirts" width="1500" height="1001" {...{fetchpriority: "high"}}/><figcaption>Peace and Love Proclaimers · Youth for Change</figcaption></figure>
      <figure className="plp-side-photo plp-side-right"><img src="/images/plp/plp-remembrance.webp" alt="A community gathered in an arena for remembrance" width="523" height="452"/><figcaption>Remembering together.</figcaption></figure>
    </div><div className="plp-hero-baseline"><span>Rwanda · Canada · One community</span><a href="#our-work">Discover PLP <ArrowRight size={16}/></a></div>
  </section>
  <Reach/>
  <section className="plp-org-intro"><p className="plp-section-label">WHAT BRINGS US TOGETHER</p><h2>Peace is at the heart.<br/>Young people lead the work.</h2><p>Remembering our history. Creating space for expression. Supporting one another. Building skills and putting them to use. These are connected parts of PLP’s work.</p></section>
  <ProgrammeFeatures/>
  <Pathway/>
  <PhotoPlayground/>
  {import.meta.env.DEV && <TestimonialsSection/>}
  <FunCorner/>
  <Partnership/>
</>; }
export function ProgrammesPage() { return <><header className="plp-page-intro"><p className="plp-section-label">OUR WORK</p><h1>Peace, leadership,<br/>and life in community.</h1><p>Explore the programmes that bring PLP’s mission into practice, from remembrance and cultural expression to wellness and service.</p><nav className="plp-programme-index" aria-label="Programme areas">{programmes.map(p=><a href={`#${p.id}`} key={p.id}>{p.label}<ArrowUpRight size={14}/></a>)}<a href="#pathways">PLP Pathways<ArrowUpRight size={14}/></a></nav></header><ProgrammeFeatures full/><Pathway/><Partnership/></>; }
export function AboutPage() { return <>
  <header className="plp-page-intro"><p className="plp-section-label">ABOUT PEACE AND LOVE PROCLAIMERS</p><h1>Youth for Change.<br/>Since 2007.</h1><p>PLP is a youth-led organization creating future leaders through unity, peace, and youth development. Young people take responsibility for strengthening their communities and building a more unified world.</p></header>
  <figure className="plp-org-wide-photo"><img src="/images/plp/plp-community.webp" alt="A group of PLP members pictured together" width="1242" height="822"/><figcaption>The PLP community</figcaption></figure>
  <section className="plp-about-statements"><div><p className="plp-section-label">OUR VISION</p><h2>A united and peaceful world, led by skilled and empowered youth.</h2></div><div><p className="plp-section-label">OUR MISSION</p><p>To develop a generation of young people equipped with leadership, cultural identity, and practical skills, enabling them to build peaceful, resilient, and thriving communities.</p><h3>Why this work matters</h3><p>Our work addresses connected challenges: unemployment and limited practical skills, post-genocide trauma and loss of historical identity, mental health stigma and substance abuse, poverty and school dropout, and gaps in career readiness.</p></div></section>
  <Reach/>
  <section className="plp-about-statements"><div><p className="plp-section-label">WHERE WE COME TOGETHER</p><h2>In schools.<br/>In communities.<br/>Across borders.</h2></div><div><p>Clubs and homegroups bring PLP into high schools, universities, and local communities. Rwanda is PLP’s base and benchmark country.</p><p>A Canada chapter launched on July 26, 2025, extending the organization’s community beyond Rwanda.</p><Link className="plp-editorial-link" to="/auth/signup">Join PLP <ArrowUpRight size={18}/></Link></div></section>
  <Team/>
  <Partnership/>
</>; }
export function StoriesPage() { return <>
  <header className="plp-page-intro"><p className="plp-section-label">OUR IMPACT</p><h1>A record of<br/>youth-led action.</h1><p>Milestones in youth leadership, community service, and peacebuilding.</p></header><Reach/>
  <section className="plp-impact-lead"><figure><img src="/images/plp/plp-remembrance.webp" alt="Participants gathered in an arena for a remembrance event" width="523" height="452"/><figcaption>Community participation</figcaption></figure><div><p className="plp-section-label">2009 → A GLOBAL INITIATIVE</p><h2>Walk to Remember</h2><p>Initiated by PLP in 2009, Walk to Remember became a national commemoration initiative in Rwanda. It has been organized in more than 25 countries.</p><Link className="plp-editorial-link" to="/programmes#peace-memory">Read about peace & memory <ArrowUpRight size={18}/></Link></div></section>
  <section className="plp-impact-record"><article><span>01 / RECOGNITION</span><h2>Youth-led impact, recognized.</h2><p>PLP received recognition from Rwanda’s First Lady for its impact on more than 40,000 young people.</p></article><article><span>02 / OPPORTUNITY</span><h2>100+ volunteer placements.</h2><p>Through its partnership with AMI Africa, PLP has placed more than 100 volunteers across AMI projects, building professional experience and pathways to employment.</p></article><article><span>03 / COMMUNITY</span><h2>A new chapter in Canada.</h2><p>Launched on July 26, 2025, the Canada chapter extends PLP’s network beyond its base in Rwanda.</p></article></section>
  <section className="plp-targets"><div><p className="plp-section-label">LOOKING AHEAD</p><h2>What PLP is working towards.</h2><p>Our goals for expanding opportunity and strengthening communities.</p></div><ul><li>Reach 200 high schools and 5 universities.</li><li>Engage 4,000 active members, with 60% women.</li><li>Support 100 internship or apprenticeship placements.</li><li>Track improved unity and peace knowledge for 5,000+ youth, alongside social and emotional learning measures.</li></ul></section>
  <div className="plp-source-download"><PortfolioLink/></div><Partnership/>
</>; }

export function AlbumPage() { return <AlbumSection/>; }
export function PublicHubPage() { return <>
 <header className="plp-page-intro plp-hub-intro"><div className="plp-hub-intro-copy"><p className="plp-section-label">THE PLP HUB</p><h1>A place to learn.<br/>A community to grow with.</h1><p>Build your skills, discover opportunities, and keep your PLP journey in one place.</p><div className="hub-actions"><Link className="hub-button" to="/hub">Enter the Hub <ArrowUpRight size={18}/></Link><Link className="plp-editorial-link" to="/auth/signup">Become a member <ArrowRight size={18}/></Link></div></div><div className="plp-hub-visual" aria-label="Learn, connect, and grow with PLP"><div className="plp-hub-orbit" aria-hidden="true"/><div className="plp-hub-core"><img src="/logo.svg" alt="" width="70" height="70"/><strong>Your next<br/>chapter.</strong><span>STARTS WITH YOU</span></div><div className="plp-hub-float hub-float-learn"><BookOpen/><span>Stay curious.<strong>Learn something new.</strong></span></div><div className="plp-hub-float hub-float-connect"><Users/><span>Find your people.<strong>Grow together.</strong></span></div><div className="plp-hub-float hub-float-grow"><Award/><span>Make it count.<strong>Celebrate progress.</strong></span></div><span className="plp-hub-visual-note">LEARN · CONNECT · BECOME</span></div></header>
 <section className="plp-community-section plp-hub-overview" aria-label="Explore the PLP Hub">{[
  ['01','Learn at your pace','Explore leadership, digital skills, entrepreneurship, employability, and peacebuilding.','/courses','Explore learning'],
  ['02','Find your next opportunity','Discover opportunities and connect with the support to take your next step.','/opportunities','View opportunities'],
  ['03','Stay connected','See what’s happening across PLP clubs and communities.','/clubs','Explore activities'],
  ['04','See your progress','Keep track of your learning, achievements, and certificates in your member workspace.','/passport','Open my profile'],
 ].map(([number,title,description,to,label])=><article key={number}><div className="plp-hub-card-top"><span className="plp-section-label">{number} / YOUR JOURNEY</span>{number==='01'?<BookOpen/>:number==='02'?<Compass/>:number==='03'?<Users/>:<Award/>}</div><h2>{title}</h2><p>{description}</p><Link className="plp-editorial-link" to={to}>{label}<ArrowUpRight size={16}/></Link></article>)}</section>
 </>; }

export function CanadaPage() { return <><header className="plp-page-intro plp-canada-page-intro"><p className="plp-section-label">PEACE AND LOVE PROCLAIMERS</p><h1>PLP Canada.</h1><p>Connected by heritage. Brought together by purpose.</p></header><CanadaSection/></>; }
