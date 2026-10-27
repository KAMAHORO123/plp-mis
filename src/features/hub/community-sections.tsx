import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react';
import { albums } from './site-content';
import './community-sections.css';
const testimonials = [
    { name: 'Aline Uwase', initials: 'AU', topic: 'Finding my voice', quote: 'I used to stay quiet in group discussions. Having people listen to my ideas helped me feel more comfortable speaking up.' },
    { name: 'Eric Ndayisaba', initials: 'EN', topic: 'Growing together', quote: 'I thought being a leader meant having all the answers. I have learned to listen first and ask for help when I need it.' },
    { name: 'Diane Mukamana', initials: 'DM', topic: 'A place to belong', quote: 'I did not know anyone when I first joined. People made an effort to include me, and that made it easier to come back.' },
];
export function TestimonialsSection() {
    useSiteLanguage();
    const [index, setIndex] = useState(0);
    const item = testimonials[index];
    return <section className="plp-community-section plp-testimonials" id="testimonials" aria-labelledby="voices-title"><div><p className="plp-section-label">{translateUi("PEOPLE. POSSIBILITY. PLP.")}</p><h2 id="voices-title">{translateUi("Every voice.")}<br /><em>{translateUi("A new beginning.")}</em></h2><div className="plp-small-controls"><button aria-label={translateUi("Previous testimonial")} onClick={() => setIndex((index + 2) % 3)}><ArrowLeft size={18}/></button><span>{translateUi("0")}{translateUi(index + 1)}{translateUi(" / 03")}</span><button aria-label={translateUi("Next testimonial")} onClick={() => setIndex((index + 1) % 3)}><ArrowRight size={18}/></button></div></div><figure aria-live="polite"><span className="plp-big-quote" aria-hidden="true">{translateUi("\u201C")}</span><blockquote>{translateUi(item.quote)}</blockquote><figcaption><span className="plp-initials">{translateUi(item.initials)}</span><div><strong>{translateUi(item.name)}</strong><span>{translateUi(item.topic)}{translateUi(" \u00B7 Illustrative story")}</span></div></figcaption></figure></section>;
}
export const builtInTrivia = [
    {
        "category": "PEACE IN PRACTICE",
        "question": "Two club members disagree. What is a constructive first step?",
        "options": [
            "Choose a side immediately",
            "Listen to both people without interrupting",
            "Avoid every future conversation",
            "Ask the louder person to decide"
        ],
        "answer": 1,
        "detail": "Listening with empathy helps people understand different perspectives and creates space for respectful dialogue.",
        "source": "https://mgiep.unesco.org/article/the-courage-to-understand-how-empathy-creates-peace",
        "sourceName": "UNESCO"
    },
    {
        "category": "RWANDA’S HISTORY",
        "question": "On which date did Rwanda gain independence?",
        "options": [
            "1 July 1962",
            "7 April 1994",
            "1 July 1972",
            "21 September 1962"
        ],
        "answer": 0,
        "detail": "Rwanda became an independent state on 1 July 1962. Learning the chronology of its history helps us understand the country’s journey.",
        "source": "https://digitallibrary.un.org/record/860188/files/1122901-EM.pdf",
        "sourceName": "United Nations"
    },
    {
        "category": "REMEMBRANCE & LEARNING",
        "question": "In which year did the Genocide against the Tutsi in Rwanda take place?",
        "options": [
            "1962",
            "1984",
            "1994",
            "2004"
        ],
        "answer": 2,
        "detail": "The Genocide against the Tutsi took place in 1994. Hutu and others who opposed it were also killed. Learning this history honours victims and supports prevention.",
        "source": "https://press.un.org/en/2018/ga12000.doc.htm",
        "sourceName": "United Nations"
    },
    {
        "category": "REMEMBRANCE & LEARNING",
        "question": "Which date marks the International Day of Reflection on the 1994 Genocide against the Tutsi in Rwanda?",
        "options": [
            "1 January",
            "1 July",
            "21 September",
            "7 April"
        ],
        "answer": 3,
        "detail": "7 April is a day to remember victims, stand with survivors and reflect on preventing genocide.",
        "source": "https://www.un.org/en/preventgenocide/rwanda/",
        "sourceName": "United Nations"
    },
    {
        "category": "PREVENTION STARTS WITH US",
        "question": "Why should communities take identity-based hate speech seriously?",
        "options": [
            "It only matters after violence occurs",
            "It can fuel discrimination and contribute to atrocities",
            "It is always harmless if posted online",
            "It affects only the person who says it"
        ],
        "answer": 1,
        "detail": "Hate speech can encourage exclusion and dehumanisation. Recognising it and responding safely are part of preventing violence.",
        "source": "https://www.un.org/en/genocide-prevention/hate-speech/strategy-plan-action",
        "sourceName": "United Nations"
    },
    {
        "category": "BUILDING PEACE TOGETHER",
        "question": "Which club activity best supports mutual understanding?",
        "options": [
            "A contest to decide whose background is best",
            "A discussion where only leaders speak",
            "A dialogue where everyone can share respectfully",
            "Separating members by their background"
        ],
        "answer": 2,
        "detail": "Inclusive dialogue lets people learn from one another. Peacebuilding involves respect, participation and listening across differences.",
        "source": "https://mgiep.unesco.org/dice",
        "sourceName": "UNESCO"
    },
    {
        "category": "A CULTURE OF PEACE",
        "question": "When is the International Day of Peace observed?",
        "options": [
            "21 September",
            "1 July",
            "7 April",
            "10 December"
        ],
        "answer": 0,
        "detail": "21 September is the International Day of Peace, an opportunity to strengthen non-violence and peaceful cooperation.",
        "source": "https://www.un.org/en/observances/international-day-peace",
        "sourceName": "United Nations"
    },
    {
        "category": "LEARNING FOR THE FUTURE",
        "question": "How can learning about the 1994 Genocide against the Tutsi contribute to peace today?",
        "options": [
            "By assigning collective blame to a whole community",
            "By avoiding difficult history altogether",
            "By treating discrimination as inevitable",
            "By recognising warning signs and rejecting dehumanisation"
        ],
        "answer": 3,
        "detail": "Historical learning can help us recognise exclusion and hatred, honour those affected, and take responsibility for protecting dignity today.",
        "source": "https://rwanda.un.org/en/283081-remarks-un-resident-coordinator-ozonnia-ojielo-conference-%E2%80%9Cethnicity-and-genocide-policy",
        "sourceName": "United Nations in Rwanda"
    }
];
export const builtInQuotes = [
    {
        "text": "The central purpose of peace operations is the protection of civilians.",
        "author": "Paul Kagame",
        "context": "Remarks at the 2015 conference on the protection of civilians in Kigali",
        "source": "https://peacekeeping.un.org/en/news/people-peace-progress-the-power-of-partnerships-rwandas-perspective",
        "sourceName": "UN Peacekeeping"
    },
    {
        "text": "Forgiveness is all I have to give.",
        "author": "Immaculée Ilibagiza",
        "context": "Rwandan author and genocide survivor, reflecting on her personal choice to forgive",
        "source": "https://www.christophers.org/copy-of-news-note-604",
        "sourceName": "The Christophers"
    },
    {
        "text": "Let there be peace for all.",
        "author": "Nelson Mandela",
        "context": "Words recalled in South Africa’s address to the United Nations",
        "source": "https://www.un.org/en/ga/69/meetings/gadebate/pdf/ZA_en.pdf",
        "sourceName": "United Nations"
    },
    {
        "text": "We cannot tire or give up.",
        "author": "Wangari Maathai",
        "context": "Kenyan environmental advocate and 2004 Nobel Peace Prize laureate",
        "source": "https://obamawhitehouse.archives.gov/the-press-office/2011/09/26/statement-vice-president-biden-passing-professor-wangari-maathai",
        "sourceName": "White House archives"
    }
];
export type TriviaQuestion = (typeof builtInTrivia)[number];
export type CornerQuote = (typeof builtInQuotes)[number];
export interface FunCornerContent { trivia: TriviaQuestion[]; quotes: CornerQuote[] }
/** The fun corner the administrator published, or the built-in questions and quotes when nothing is saved. */
export function useFunCornerContent(): FunCornerContent {
    const [content, setContent] = useState<FunCornerContent>({ trivia: builtInTrivia, quotes: builtInQuotes });
    useEffect(() => {
        const controller = new AbortController();
        const load = () => fetch('/api/public/fun-corner', { signal: controller.signal, cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .then(value => { if (value && Array.isArray(value.trivia) && Array.isArray(value.quotes))
                setContent({ trivia: value.trivia.length ? value.trivia : builtInTrivia, quotes: value.quotes.length ? value.quotes : builtInQuotes }); })
            .catch(() => { });
        void load();
        window.addEventListener('plp:fun-corner-updated', load);
        return () => { controller.abort(); window.removeEventListener('plp:fun-corner-updated', load); };
    }, []);
    return content;
}
export function FunCorner() {
    useSiteLanguage();
    const { trivia, quotes: cornerQuotes } = useFunCornerContent();
    const [index, setIndex] = useState(0);
    const [answer, setAnswer] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);
    const questionRef = useRef<HTMLHeadingElement>(null);
    const q = trivia[Math.min(index, trivia.length - 1)];
    const quote = cornerQuotes[quoteIndex % cornerQuotes.length];
    const choose = (choice: number) => { if (answer !== null)
        return; setAnswer(choice); if (choice === q.answer)
        setScore(value => value + 1); };
    const next = () => { if (index === trivia.length - 1) {
        setFinished(true);
    }
    else {
        setIndex(index + 1);
        setAnswer(null);
    } requestAnimationFrame(() => questionRef.current?.focus()); };
    const restart = () => { setIndex(0); setAnswer(null); setScore(0); setFinished(false); requestAnimationFrame(() => questionRef.current?.focus()); };
    return <section className="plp-community-section plp-fun-corner" id="fun-corner" aria-labelledby="fun-title">
  <div className="plp-section-heading"><div><p className="plp-section-label">{translateUi("LEARN. REMEMBER. BUILD PEACE.")}</p><h2 id="fun-title">{translateUi("Learn our history. Shape our peace.")}<span aria-hidden="true">{translateUi("\u2733")}</span></h2></div><p>{translateUi("The PLP fun corner.")}<br />{translateUi("Rwanda, remembrance, and everyday peacebuilding.")}</p></div>
  <div className="plp-play-grid">
   <div className="plp-trivia-card">
    <div className="plp-trivia-meta"><span><Sparkles size={17}/>{translateUi(" THE PEACE & LEARNING CORNER")}</span><span>{translateUi(finished ? 'Round complete' : `${index + 1} / ${trivia.length}`)}</span></div>
    <div className="plp-trivia-progress" aria-hidden="true">{translateUi(trivia.map((_, i) => <span key={i} className={finished || i <= index ? 'is-active' : ''}/>))}</div>
    {translateUi(finished ? <div className="plp-trivia-result"><p className="plp-section-label">{translateUi("KEEP LEARNING. KEEP BUILDING PEACE.")}</p><h3 ref={questionRef} tabIndex={-1}>{translateUi("You scored ")}{translateUi(score)}{translateUi(" / ")}{translateUi(trivia.length)}{translateUi("!")}</h3><p>{translateUi(score === trivia.length ? 'Thank you for taking time to learn. Carry these lessons into your community.' : 'Every question is an opportunity to understand more. Revisit the explanations and keep learning.')}</p><button className="plp-play-next" onClick={restart}>{translateUi("Review again ")}<ArrowRight size={18}/></button></div> : <>
     <p className="plp-section-label">{translateUi(q.category)}</p><h3 ref={questionRef} tabIndex={-1}>{translateUi(q.question)}</h3>
     <div className="plp-trivia-options" role="group" aria-label={translateUi("Choose your answer")}>{translateUi(q.options.map((option, i) => <button key={option} disabled={answer !== null} className={answer !== null ? (i === q.answer ? 'is-correct' : i === answer ? 'is-incorrect' : '') : ''} onClick={() => choose(i)}><span>{translateUi(String.fromCharCode(65 + i))}</span>{translateUi(option)}{translateUi(answer !== null && i === q.answer && <small>{translateUi("Correct")}</small>)}{translateUi(answer === i && i !== q.answer && <small>{translateUi("Your choice")}</small>)}</button>))}</div>
     <div className="plp-trivia-feedback" aria-live="polite">{translateUi(answer !== null ? <><strong>{translateUi(answer === q.answer ? 'That’s correct.' : 'Let’s learn more.')}</strong><p>{translateUi(q.detail)}</p>{q.source && <a href={q.source} target="_blank" rel="noopener noreferrer">{translateUi("Explore with ")}{translateUi(q.sourceName || "the source")} <ArrowUpRight size={14}/></a>}<button className="plp-play-next" onClick={next}>{translateUi(index === trivia.length - 1 ? 'See my score' : 'Next question')} <ArrowRight size={18}/></button></> : <p>{translateUi("Take your time. Reflect, choose an answer, and learn more.")}</p>)}</div>
    </>)}
   </div>
   <aside className="plp-quote-card" aria-label={translateUi("A thought to take with you")}><p className="plp-section-label">{translateUi("VOICES FOR PEACE")}</p><span className="plp-quote-mark" aria-hidden="true">{translateUi("\u201C")}</span><div aria-live="polite"><blockquote cite={quote.source || undefined}>{translateUi(quote.text)}</blockquote><strong className="plp-quote-author">{translateUi(quote.author)}</strong><p>{translateUi(quote.context)}</p></div><div className="plp-quote-bottom">{quote.source ? <a href={quote.source} target="_blank" rel="noopener noreferrer" className="plp-quote-source">{translateUi("Source: ")}{translateUi(quote.sourceName || "link")} <ArrowUpRight size={14}/></a> : <span/>}<button onClick={() => setQuoteIndex((quoteIndex + 1) % cornerQuotes.length)} aria-label={translateUi("Next quote")}><ArrowRight size={20}/></button></div></aside>
  </div>
 </section>;
}
export function AlbumSection() {
    useSiteLanguage();
    const [selected, setSelected] = useState('all');
    const [photoIndex, setPhotoIndex] = useState(0);
    const dialog = useRef<HTMLDialogElement>(null);
    const gallery = albums.flatMap(a => a.photos.map((file, i) => ({ src: `/images/plp/albums/${file}.jpg`, title: a.title, alt: `${a.title}, community photo ${i + 1}` })));
    const shown = selected === 'all' ? albums : albums.filter(a => a.id === selected);
    const photo = gallery[photoIndex];
    const openPhoto = (file: string) => { setPhotoIndex(gallery.findIndex(p => p.src === `/images/plp/albums/${file}.jpg`)); dialog.current?.showModal(); };
    const move = (direction: number) => setPhotoIndex(index => (index + direction + gallery.length) % gallery.length);
    return <section className="plp-community-section plp-albums" id="plp-album">
  <div className="plp-section-heading"><div><p className="plp-section-label">{translateUi("THE MOMENTS BETWEEN THE MILESTONES")}</p><h2>{translateUi("The PLP album.")}</h2></div><p>{translateUi("Real people. Shared memories.")}<br />{translateUi("Explore every photo right here.")}</p></div>
  <div className="plp-album-filters" aria-label={translateUi("Filter albums")}>{translateUi([{ id: 'all', title: 'All moments' }, ...albums].map(a => <button key={a.id} aria-pressed={selected === a.id} onClick={() => setSelected(a.id)}>{translateUi(a.title)}</button>))}</div>
  <div className="plp-album-grid">{translateUi(shown.map(a => <article key={a.id}><div className="plp-album-pair">{translateUi(a.photos.map((file, i) => <button key={file} aria-label={translateUi("Enlarge {p0} photo {p1}", { p0: translateUi(a.title), p1: translateUi(i + 1) })} onClick={() => openPhoto(file)}><img src={`/images/plp/albums/${file}.jpg`} alt={translateUi("{p0}, community photo {p1}", { p0: translateUi(a.title), p1: translateUi(i + 1) })} loading="lazy" width="700" height="600"/></button>))}</div><div className="plp-album-caption"><div><h3>{translateUi(a.title)}</h3><p>{translateUi(a.description)}{translateUi(" \u00B7 ")}{translateUi(a.photos.length)}{translateUi(" photos")}</p></div><button className="plp-album-open" aria-label={translateUi("View {p0} photos", { p0: translateUi(a.title) })} onClick={() => openPhoto(a.photos[0])}><ArrowUpRight size={22}/></button></div></article>))}</div>
  <dialog ref={dialog} className="plp-photo-dialog plp-canada-dialog" aria-label={translateUi("PLP album photo viewer")} onKeyDown={e => { if (e.key === 'ArrowRight') {
        e.preventDefault();
        move(1);
    } if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move(-1);
    } }} onClick={e => { if (e.target === e.currentTarget)
        dialog.current?.close(); }}><button autoFocus aria-label={translateUi("Close photo")} onClick={() => dialog.current?.close()}><X /></button><img src={photo.src} alt={translateUi(photo.alt)}/><div className="plp-canada-photo-controls"><button aria-label={translateUi("Previous album photo")} onClick={() => move(-1)}><ArrowLeft size={20}/></button><p aria-live="polite">{translateUi(photo.title)}{translateUi(" \u00B7 ")}{translateUi(photoIndex + 1)}{translateUi(" / ")}{translateUi(gallery.length)}</p><button aria-label={translateUi("Next album photo")} onClick={() => move(1)}><ArrowRight size={20}/></button></div></dialog>
 </section>;
}
const canadaPhotos = [
    { file: 'community-frame', title: 'A community across borders', alt: 'Three PLP Canada members smiling behind a PLP Canada photo frame' },
    { file: 'peace-signs', title: 'Peace, love & friendship', alt: 'Two women in white sharing peace signs at a PLP Canada gathering' },
    { file: 'welcome-desk', title: 'Every connection starts with hello', alt: 'Participants being welcomed at a PLP Canada registration desk' },
    { file: 'on-stage', title: 'Space for every voice', alt: 'A speaker sharing his voice on stage at a PLP Canada event' },
    { file: 'together', title: 'The moments that bring us together', alt: 'Young people smiling and connecting at a PLP Canada gathering' },
];
export function CanadaSection() {
    useSiteLanguage();
    const [selected, setSelected] = useState(0);
    const dialog = useRef<HTMLDialogElement>(null);
    const openPhoto = (index: number) => { setSelected(index); dialog.current?.showModal(); };
    const photo = canadaPhotos[selected];
    return <section className="plp-community-section plp-canada-story" id="plp-canada" aria-labelledby="canada-title">
  <div className="plp-canada-lead">
   <div className="plp-canada-copy"><span className="plp-canada-route">{translateUi("RW ")}<span aria-hidden="true">{translateUi("\u2194")}</span>{translateUi(" CA")}</span><p className="plp-section-label">{translateUi("OUR COMMUNITY, ACROSS BORDERS")}</p><h2 id="canada-title">{translateUi("Our roots.")}<br />{translateUi("Our people.")}<br /><em>{translateUi("Our shared future.")}</em></h2><p>{translateUi("From Rwanda to Canada, peace and love bring us together. A community for connection, shared heritage, and the voices shaping what comes next.")}</p><a className="plp-editorial-link" href="https://www.instagram.com/plpyouthca/" target="_blank" rel="noopener noreferrer">{translateUi("Meet the community ")}<ArrowUpRight size={17}/></a></div>
   <figure className="plp-canada-feature"><button onClick={() => openPhoto(0)} aria-label={translateUi("Enlarge PLP Canada community photo")}><img src="/images/plp/canada/community-frame-hd.png" alt={translateUi(canadaPhotos[0].alt)} width="1244" height="916" {...{fetchpriority: "high"}}/></button><figcaption><span>{translateUi("01 / PEOPLE & CONNECTION")}</span><span>{translateUi("PLP Canada ")}<ArrowUpRight size={16}/></span></figcaption></figure>
  </div>
  <div className="plp-canada-gallery-heading"><div><p className="plp-section-label">{translateUi("LITTLE MOMENTS. LASTING CONNECTIONS.")}</p><h2>{translateUi("A little closer, wherever we are.")}</h2></div><p>{translateUi("Shared smiles. New conversations.")}<br />{translateUi("A place to belong.")}</p></div>
  <div className="plp-canada-gallery">{translateUi(canadaPhotos.slice(1).map((p, i) => <figure key={p.file}><button aria-label={translateUi("Enlarge {p0}", { p0: translateUi(p.title) })} onClick={() => openPhoto(i + 1)}><img src={`/images/plp/canada/${p.file}-hd.png`} alt={translateUi(p.alt)} loading="lazy"/><span className="plp-canada-enlarge" aria-hidden="true"><ArrowUpRight size={20}/></span></button><figcaption><span>{translateUi("0")}{translateUi(i + 2)}</span>{translateUi(p.title)}</figcaption></figure>))}</div>
  <div className="plp-canada-connect"><div><p className="plp-section-label">{translateUi("KEEP THE CONNECTION GOING")}</p><h2>{translateUi("There\u2019s more to the story.")}</h2><p>{translateUi("Follow our community\u2019s moments, conversations, and gatherings.")}</p></div><a className="plp-editorial-link" href="https://www.instagram.com/plpyouthca/" target="_blank" rel="noopener noreferrer">{translateUi("Follow @plpyouthca ")}<ArrowUpRight size={18}/></a></div>
  <dialog ref={dialog} className="plp-photo-dialog plp-canada-dialog" aria-label={translateUi("PLP Canada photo gallery")} onClick={e => { if (e.target === e.currentTarget)
        dialog.current?.close(); }}><button autoFocus aria-label={translateUi("Close photo")} onClick={() => dialog.current?.close()}><X /></button><img src={`/images/plp/canada/${photo.file}-hd.png`} alt={translateUi(photo.alt)}/><div className="plp-canada-photo-controls"><button aria-label={translateUi("Previous Canada photo")} onClick={() => setSelected((selected + 4) % 5)}><ArrowLeft size={20}/></button><p>{translateUi(photo.title)}{translateUi(" \u00B7 ")}{translateUi(selected + 1)}{translateUi(" / 5")}</p><button aria-label={translateUi("Next Canada photo")} onClick={() => setSelected((selected + 1) % 5)}><ArrowRight size={20}/></button></div></dialog>
 </section>;
}
