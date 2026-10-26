import { useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react';
import { albums } from './site-content';
import './community-sections.css';
const testimonials = [
 {name:'Kamahoro Linda', initials:'AU', topic:'Finding my voice', quote:'I used to stay quiet in group discussions. Having people listen to my ideas helped me feel more comfortable speaking up.'},
 {name:'Babou Prince', initials:'EN', topic:'Growing together', quote:'I thought being a leader meant having all the answers. I have learned to listen first and ask for help when I need it.'},
 {name:'Gasore Corene', initials:'DM', topic:'A place to belong', quote:'I did not know anyone when I first joined. People made an effort to include me, and that made it easier to come back.'},
]; 
export function TestimonialsSection() {
 const [index,setIndex]=useState(0);const item=testimonials[index];
 return <section className="plp-community-section plp-testimonials" id="testimonials" aria-labelledby="voices-title"><div><p className="plp-section-label">PEOPLE. POSSIBILITY. PLP.</p><h2 id="voices-title">Every voice.<br/><em>A new beginning.</em></h2><div className="plp-small-controls"><button aria-label="Previous testimonial" onClick={()=>setIndex((index+2)%3)}><ArrowLeft size={18}/></button><span>0{index+1} / 03</span><button aria-label="Next testimonial" onClick={()=>setIndex((index+1)%3)}><ArrowRight size={18}/></button></div></div><figure aria-live="polite"><span className="plp-big-quote" aria-hidden="true">“</span><blockquote>{item.quote}</blockquote><figcaption><span className="plp-initials">{item.initials}</span><div><strong>{item.name}</strong><span>{item.topic} · Illustrative story</span></div></figcaption></figure></section>;
}
const trivia = [
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
const cornerQuotes = [
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
export function FunCorner() {
 const [index,setIndex]=useState(0);
 const [answer,setAnswer]=useState<number|null>(null);
 const [score,setScore]=useState(0);
 const [finished,setFinished]=useState(false);
 const [quoteIndex,setQuoteIndex]=useState(0);
 const questionRef=useRef<HTMLHeadingElement>(null);
 const q=trivia[index];const quote=cornerQuotes[quoteIndex];
 const choose=(choice:number)=>{if(answer!==null)return;setAnswer(choice);if(choice===q.answer)setScore(value=>value+1);};
 const next=()=>{if(index===trivia.length-1){setFinished(true);}else{setIndex(index+1);setAnswer(null);}requestAnimationFrame(()=>questionRef.current?.focus());};
 const restart=()=>{setIndex(0);setAnswer(null);setScore(0);setFinished(false);requestAnimationFrame(()=>questionRef.current?.focus());};
 return <section className="plp-community-section plp-fun-corner" id="fun-corner" aria-labelledby="fun-title">
  <div className="plp-section-heading"><div><p className="plp-section-label">LEARN. REMEMBER. BUILD PEACE.</p><h2 id="fun-title">Learn our history. Shape our peace.<span aria-hidden="true">✳</span></h2></div><p>The PLP fun corner.<br/>Rwanda, remembrance, and everyday peacebuilding.</p></div>
  <div className="plp-play-grid">
   <div className="plp-trivia-card">
    <div className="plp-trivia-meta"><span><Sparkles size={17}/> THE PEACE & LEARNING CORNER</span><span>{finished?'Round complete':`${index+1} / ${trivia.length}`}</span></div>
    <div className="plp-trivia-progress" aria-hidden="true">{trivia.map((_,i)=><span key={i} className={finished||i<=index?'is-active':''}/>)}</div>
    {finished?<div className="plp-trivia-result"><p className="plp-section-label">KEEP LEARNING. KEEP BUILDING PEACE.</p><h3 ref={questionRef} tabIndex={-1}>You scored {score} / {trivia.length}!</h3><p>{score===trivia.length?'Thank you for taking time to learn. Carry these lessons into your community.':'Every question is an opportunity to understand more. Revisit the explanations and keep learning.'}</p><button className="plp-play-next" onClick={restart}>Review again <ArrowRight size={18}/></button></div>:<>
     <p className="plp-section-label">{q.category}</p><h3 ref={questionRef} tabIndex={-1}>{q.question}</h3>
     <div className="plp-trivia-options" role="group" aria-label="Choose your answer">{q.options.map((option,i)=><button key={option} disabled={answer!==null} className={answer!==null?(i===q.answer?'is-correct':i===answer?'is-incorrect':''):''} onClick={()=>choose(i)}><span>{String.fromCharCode(65+i)}</span>{option}{answer!==null&&i===q.answer&&<small>Correct</small>}{answer===i&&i!==q.answer&&<small>Your choice</small>}</button>)}</div>
     <div className="plp-trivia-feedback" aria-live="polite">{answer!==null?<><strong>{answer===q.answer?'That’s correct.':'Let’s learn more.'}</strong><p>{q.detail}</p><a href={q.source} target="_blank" rel="noopener noreferrer">Explore with {q.sourceName} <ArrowUpRight size={14}/></a><button className="plp-play-next" onClick={next}>{index===trivia.length-1?'See my score':'Next question'} <ArrowRight size={18}/></button></>:<p>Take your time. Reflect, choose an answer, and learn more.</p>}</div>
    </>}
   </div>
   <aside className="plp-quote-card" aria-label="A thought to take with you"><p className="plp-section-label">VOICES FOR PEACE</p><span className="plp-quote-mark" aria-hidden="true">“</span><div aria-live="polite"><blockquote cite={quote.source}>{quote.text}</blockquote><strong className="plp-quote-author">{quote.author}</strong><p>{quote.context}</p></div><div className="plp-quote-bottom"><a href={quote.source} target="_blank" rel="noopener noreferrer" className="plp-quote-source">Source: {quote.sourceName} <ArrowUpRight size={14}/></a><button onClick={()=>setQuoteIndex((quoteIndex+1)%cornerQuotes.length)} aria-label="Next quote"><ArrowRight size={20}/></button></div></aside>
  </div>
 </section>;
}
export function AlbumSection() {
 const [selected,setSelected]=useState('all');
 const [photoIndex,setPhotoIndex]=useState(0);
 const dialog=useRef<HTMLDialogElement>(null);
 const gallery=albums.flatMap(a=>a.photos.map((file,i)=>({src:`/images/plp/albums/${file}.jpg`,title:a.title,alt:`${a.title}, community photo ${i+1}`})));
 const shown=selected==='all'?albums:albums.filter(a=>a.id===selected);
 const photo=gallery[photoIndex];
 const openPhoto=(file:string)=>{setPhotoIndex(gallery.findIndex(p=>p.src===`/images/plp/albums/${file}.jpg`));dialog.current?.showModal();};
 const move=(direction:number)=>setPhotoIndex(index=>(index+direction+gallery.length)%gallery.length);
 return <section className="plp-community-section plp-albums" id="plp-album">
  <div className="plp-section-heading"><div><p className="plp-section-label">THE MOMENTS BETWEEN THE MILESTONES</p><h2>The PLP album.</h2></div><p>Real people. Shared memories.<br/>Explore every photo right here.</p></div>
  <div className="plp-album-filters" aria-label="Filter albums">{[{id:'all',title:'All moments'},...albums].map(a=><button key={a.id} aria-pressed={selected===a.id} onClick={()=>setSelected(a.id)}>{a.title}</button>)}</div>
  <div className="plp-album-grid">{shown.map(a=><article key={a.id}><div className="plp-album-pair">{a.photos.map((file,i)=><button key={file} aria-label={`Enlarge ${a.title} photo ${i+1}`} onClick={()=>openPhoto(file)}><img src={`/images/plp/albums/${file}.jpg`} alt={`${a.title}, community photo ${i+1}`} loading="lazy" width="700" height="600"/></button>)}</div><div className="plp-album-caption"><div><h3>{a.title}</h3><p>{a.description} · {a.photos.length} photos</p></div><button className="plp-album-open" aria-label={`View ${a.title} photos`} onClick={()=>openPhoto(a.photos[0])}><ArrowUpRight size={22}/></button></div></article>)}</div>
  <dialog ref={dialog} className="plp-photo-dialog plp-canada-dialog" aria-label="PLP album photo viewer" onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}}} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><button autoFocus aria-label="Close photo" onClick={()=>dialog.current?.close()}><X/></button><img src={photo.src} alt={photo.alt}/><div className="plp-canada-photo-controls"><button aria-label="Previous album photo" onClick={()=>move(-1)}><ArrowLeft size={20}/></button><p aria-live="polite">{photo.title} · {photoIndex+1} / {gallery.length}</p><button aria-label="Next album photo" onClick={()=>move(1)}><ArrowRight size={20}/></button></div></dialog>
 </section>;
}
const canadaPhotos = [
 {file:'community-frame', title:'A community across borders', alt:'Three PLP Canada members smiling behind a PLP Canada photo frame'},
 {file:'peace-signs', title:'Peace, love & friendship', alt:'Two women in white sharing peace signs at a PLP Canada gathering'},
 {file:'welcome-desk', title:'Every connection starts with hello', alt:'Participants being welcomed at a PLP Canada registration desk'},
 {file:'on-stage', title:'Space for every voice', alt:'A speaker sharing his voice on stage at a PLP Canada event'},
 {file:'together', title:'The moments that bring us together', alt:'Young people smiling and connecting at a PLP Canada gathering'},
];
export function CanadaSection() {
 const [selected,setSelected]=useState(0);
 const dialog=useRef<HTMLDialogElement>(null);
 const openPhoto=(index:number)=>{setSelected(index);dialog.current?.showModal();};
 const photo=canadaPhotos[selected];
 return <section className="plp-community-section plp-canada-story" id="plp-canada" aria-labelledby="canada-title">
  <div className="plp-canada-lead">
   <div className="plp-canada-copy"><span className="plp-canada-route">RW <span aria-hidden="true">↔</span> CA</span><p className="plp-section-label">OUR COMMUNITY, ACROSS BORDERS</p><h2 id="canada-title">Our roots.<br/>Our people.<br/><em>Our shared future.</em></h2><p>From Rwanda to Canada, peace and love bring us together. A community for connection, shared heritage, and the voices shaping what comes next.</p><a className="plp-editorial-link" href="https://www.instagram.com/plpyouthca/" target="_blank" rel="noopener noreferrer">Meet the community <ArrowUpRight size={17}/></a></div>
   <figure className="plp-canada-feature"><button onClick={()=>openPhoto(0)} aria-label="Enlarge PLP Canada community photo"><img src="/images/plp/canada/community-frame-hd.png" alt={canadaPhotos[0].alt} width="1244" height="916" fetchPriority="high"/></button><figcaption><span>01 / PEOPLE & CONNECTION</span><span>PLP Canada <ArrowUpRight size={16}/></span></figcaption></figure>
  </div>
  <div className="plp-canada-gallery-heading"><div><p className="plp-section-label">LITTLE MOMENTS. LASTING CONNECTIONS.</p><h2>A little closer, wherever we are.</h2></div><p>Shared smiles. New conversations.<br/>A place to belong.</p></div>
  <div className="plp-canada-gallery">{canadaPhotos.slice(1).map((p,i)=><figure key={p.file}><button aria-label={`Enlarge ${p.title}`} onClick={()=>openPhoto(i+1)}><img src={`/images/plp/canada/${p.file}-hd.png`} alt={p.alt} loading="lazy"/><span className="plp-canada-enlarge" aria-hidden="true"><ArrowUpRight size={20}/></span></button><figcaption><span>0{i+2}</span>{p.title}</figcaption></figure>)}</div>
  <div className="plp-canada-connect"><div><p className="plp-section-label">KEEP THE CONNECTION GOING</p><h2>There’s more to the story.</h2><p>Follow our community’s moments, conversations, and gatherings.</p></div><a className="plp-editorial-link" href="https://www.instagram.com/plpyouthca/" target="_blank" rel="noopener noreferrer">Follow @plpyouthca <ArrowUpRight size={18}/></a></div>
  <dialog ref={dialog} className="plp-photo-dialog plp-canada-dialog" aria-label="PLP Canada photo gallery" onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><button autoFocus aria-label="Close photo" onClick={()=>dialog.current?.close()}><X/></button><img src={`/images/plp/canada/${photo.file}-hd.png`} alt={photo.alt}/><div className="plp-canada-photo-controls"><button aria-label="Previous Canada photo" onClick={()=>setSelected((selected+4)%5)}><ArrowLeft size={20}/></button><p>{photo.title} · {selected+1} / 5</p><button aria-label="Next Canada photo" onClick={()=>setSelected((selected+1)%5)}><ArrowRight size={20}/></button></div></dialog>
 </section>;
}
