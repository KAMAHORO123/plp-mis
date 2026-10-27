import { answerFaq, faqEntries, type FaqLanguage, type FaqLanguageChoice } from './faq';
import { RecordActions } from './record-actions';
import { downloadCertificatePDF, certificateFileName, schoolCertificateDesign } from './certificate-pdf';
import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, MessageCircle, X, Send, CheckCircle2, Clock3 } from 'lucide-react';
import { toast } from 'sonner';
import { useHub, uid } from './store';
import { platformApi } from './platform-api';
import { saveRecord, resyncSchoolData } from './platform-records';
import { demoSchools, type CertificateRequest } from './school-data';
import { Heading, Panel, Field, Empty } from './ui';
import { FormModal } from './modal';
import './workspaces.css';

const schoolName = (id?: string) => demoSchools.find(s => s.id === id)?.name ?? 'School not assigned';
function useRecords() {
 const hub = useHub();
 const admin = hub.profile.role === 'Administrator';
 const coordinator = hub.profile.role === 'Club leader';
 const requests = hub.state.schoolRecords.requests.filter(r => admin || (coordinator ? r.schoolId === hub.profile.schoolId : r.members.some(m => m.email.toLowerCase() === hub.profile.email.toLowerCase())));
 const members = hub.state.schoolRecords.members.filter(m => admin || m.schoolId === hub.profile.schoolId);
 return {...hub, admin, coordinator, requests, members};
}
function Status({status}:{status:string}) { return <span className={`ws-status ws-status-${status.toLowerCase()}`}>{status==='Issued'?<CheckCircle2 size={13}/>:<Clock3 size={13}/>} {status}</span>; }
export function SchoolMembersPage() {
 const {profile,admin,members,state}=useRecords();
 const [school,setSchool]=useState(profile.schoolId??demoSchools[0]?.id??'');
 const [query,setQuery]=useState(''),[adding,setAdding]=useState<'one'|'group'|null>(null);
 const visible=(admin?state.schoolRecords.members.filter(m=>m.schoolId===school):members).filter(m=>`${m.name} ${m.email}`.toLowerCase().includes(query.toLowerCase()));
 const schoolId=admin?school:profile.schoolId;
 return <div className="ws-page"><Heading eyebrow="SCHOOL COMMUNITY" title="Every member matters." description="Keep your school register in one place. Students do not need an account to receive a certificate."/>
 {admin&&<Field label="School"><select value={school} onChange={e=>setSchool(e.target.value)}>{demoSchools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>}
 {adding==='one'&&<FormModal title="Add a school member" description="Students do not need an account to receive a certificate." onClose={()=>setAdding(null)}><form className="hub-form" onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const f=new FormData(form);const name=String(f.get('name')).trim(),email=String(f.get('email')).trim().toLowerCase();if(!schoolId||!name)return;if(email&&state.schoolRecords.members.some(m=>m.email===email)){toast.error('This email is already in the member register.');return;}saveRecord('members',{title:name,...(email?{email}:{}),category:'High school',school_id:schoolId}).then(()=>{setAdding(null);toast.success('School member added');}).catch(err=>toast.error((err as Error).message));}}><Field label="Student full name"><input name="name" required minLength={2} maxLength={100} pattern=".*\S.*"/></Field><Field label="Student email (optional)"><input name="email" type="email" maxLength={254}/></Field><div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={()=>setAdding(null)}>Cancel</button><button className="hub-button">Add member</button></div></form></FormModal>}
 {adding==='group'&&<FormModal title="Add a group" description="Paste one student per line: name | email. Email is optional." onClose={()=>setAdding(null)}><form className="hub-form" onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const rows=String(new FormData(form).get('rows')).split('\n').filter(x=>x.trim()).map(line=>{const [name,email='']=line.split('|').map(x=>x.trim());return {id:uid(),schoolId:schoolId!,name,email:email.toLowerCase(),category:'High school'};});if(!schoolId||!rows.length)return;if(rows.length>200){toast.error('Add up to 200 members at a time.');return;}
 // Point to the exact line that needs fixing.
 const problem=rows.map((r,i)=>!r.name||r.name.length<2?`Line ${i+1}: enter the member's full name.`:r.name.length>100?`Line ${i+1}: the name is longer than 100 characters.`:r.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)?`Line ${i+1}: "${r.email}" is not a valid email.`:r.email&&state.schoolRecords.members.some(m=>m.email===r.email)?`Line ${i+1}: ${r.email} is already in the register.`:r.email&&rows.slice(0,i).some(m=>m.email===r.email)?`Line ${i+1}: ${r.email} appears twice in this list.`:'').find(Boolean);
 if(problem){toast.error(problem);return;}void (async()=>{try{for(const r of rows)await platformApi('/records/members','POST',{title:r.name,...(r.email?{email:r.email}:{}),category:r.category,school_id:schoolId});resyncSchoolData();setAdding(null);toast.success(`${rows.length} members added`);}catch(err){resyncSchoolData();toast.error((err as Error).message);}})();}}><Field label="Group member list"><textarea name="rows" rows={5} required placeholder={'Student full name | student email\nAnother student name'}/></Field><div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={()=>setAdding(null)}>Cancel</button><button className="hub-button">Add group</button></div></form></FormModal>}
 <Panel><div className="ws-panel-title"><h2>{schoolName(schoolId)} <span className="ws-count">{visible.length} members</span></h2><div className="hub-actions"><button className="hub-button secondary" disabled={!schoolId} onClick={()=>setAdding('group')}>Add a group</button><button className="hub-button" disabled={!schoolId} onClick={()=>setAdding('one')}>Add member</button></div></div><Field label="Search school members"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name or email"/></Field><div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Name</th><th>Email</th><th>Category</th><th>Actions</th></tr></thead><tbody>{visible.map(m=><tr key={m.id}><td>{m.name}</td><td>{m.email||'No email needed'}</td><td>{m.category}</td><td><RecordActions kind="member" id={m.id}/></td></tr>)}</tbody></table></div>{!visible.length&&<Empty>No members match this view.</Empty>}</Panel></div>;
}
export async function downloadCertificates(request: CertificateRequest, recipients=request.members) {
 try {
  // Issued certificates on the platform verify at /verify/<id>; older local batches keep their local check link.
  // Each issued certificate carries its own wording; the request supplies it for older ones.
  const issued = await platformApi<{id:string;school_member_id:string;issued_at:string;title:string|null;programme:string;citation:string|null;role:string|null;period_from:string|null;period_to:string|null}[]>(`/certificate-requests/${request.id}/certificates`).catch(() => []);
  const certFor = (memberId: string) => issued.find(c => c.school_member_id === memberId);
  await downloadCertificatePDF(recipients.map(member => {
   const c = certFor(member.id);
   return schoolCertificateDesign({
    id: c?.id ?? `${request.id}/${member.id}`, recipient: member.name, school: schoolName(request.schoolId),
    issued: c?.issued_at.slice(0, 10) ?? request.issued ?? request.completed,
    title: c?.title ?? request.title, programme: c?.programme ?? request.programme, citation: c?.citation ?? request.citation, role: c?.role ?? member.role,
    periodFrom: c?.period_from ?? request.periodFrom, periodTo: c?.period_to ?? request.periodTo,
    // Older local batches keep their local check link.
    verificationUrl: c ? undefined : `${window.location.origin}/certificate-check/${encodeURIComponent(request.id)}/${encodeURIComponent(member.id)}`,
   });
  }), recipients.length === 1
   ? certificateFileName(recipients[0].name, certFor(recipients[0].id)?.title ?? request.title)
   : certificateFileName(schoolName(request.schoolId), request.title, `${recipients.length} certificates`));
 } catch { toast.error('Could not generate the PDF. Please try again.'); }
}
export function CertificateCheckPage(){const {requestId,memberId}=useParams();const {state}=useHub();const r=state.schoolRecords.requests.find(r=>r.id===requestId&&r.status==='Issued');const member=r?.members.find(m=>m.id===memberId);return <div className="hub-section hub-narrow"><Panel><Award size={40}/><Heading title={member?'Certificate found':'Certificate not found'} description="PLP certificate verification"/>{member&&r?<><h2>{member.name}</h2><p>{r.programme}</p><p>{schoolName(r.schoolId)}</p><p>Issued {r.issued} · Completed {r.completed}</p><Status status="Issued"/></>:<p>No issued certificate matches this link.</p>}<Link className="hub-text-link" to="/">PLP website</Link></Panel></div>;}
export function HelpChat() {
  const logRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [choice, setChoice] = useState<FaqLanguageChoice>('auto');
  const [lastLanguage, setLastLanguage] = useState<FaqLanguage>('en');
  const [messages, setMessages] = useState<{who: 'help' | 'you'; text: string; language?: FaqLanguage}[]>([
    {who: 'help', text: 'Muraho! Baza mu Kinyarwanda cyangwa mu Cyongereza. Hi! Ask about joining PLP, certificates, or roles in Kinyarwanda or English.'},
  ]);
  const language = choice === 'auto' ? lastLanguage : choice;
  const rw = language === 'rw';
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [messages, open]);
  function ask(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const answer = answerFaq(clean, choice, lastLanguage);
    setLastLanguage(answer.language);
    setMessages(m => [...m, {who: 'you', text: clean}, {who: 'help', text: answer.text, language: answer.language}]);
    setInput('');
  }
  return <div className="ws-chat">{open && <section className="ws-chat-panel" aria-label={rw ? 'Ubufasha bwa PLP' : 'PLP help chat'}>
    <header><div><strong>{rw ? 'Ubufasha bwa PLP' : 'PLP help'}</strong><small>{rw ? 'Ibisubizo byikora ku bibazo bikunze kubazwa' : 'Quick answers · Automated FAQ'}</small></div><button aria-label={rw ? 'Funga ubufasha' : 'Close help chat'} onClick={() => setOpen(false)}><X size={18}/></button></header>
    <label className="ws-chat-language">Language / Ururimi <select value={choice} onChange={e => setChoice(e.target.value as FaqLanguageChoice)}><option value="auto">Auto / Byikora</option><option value="rw">Kinyarwanda</option><option value="en">English</option></select></label>
    <div ref={logRef} className="ws-chat-messages" role="log" aria-live="polite">{messages.map((m,i) => <div className={m.who === 'you' ? 'ws-chat-you' : ''} key={i}><small>{m.who === 'you' ? (rw ? 'Wowe' : 'You') : 'PLP'}</small><p lang={m.language}>{m.text}</p></div>)}</div>
    <div className="ws-chat-suggestions">{faqEntries.slice(0,3).map(a => <button key={a.id} onClick={() => ask(a.q[language])}>{a.q[language]}</button>)}</div>
    <form onSubmit={e => {e.preventDefault(); ask(input);}}><input aria-label={rw ? 'Baza PLP' : 'Ask PLP help'} value={input} onChange={e => setInput(e.target.value)} maxLength={400} placeholder={rw ? 'Andika ikibazo cyawe…' : 'Ask in English or Kinyarwanda…'}/><button aria-label={rw ? 'Ohereza ikibazo' : 'Send question'}><Send size={18}/></button></form>
  </section>}<button className="ws-chat-toggle" aria-expanded={open} onClick={() => setOpen(!open)}><MessageCircle size={21}/>{open ? (rw ? 'Funga' : 'Close help') : 'Need help? / Ubufasha'}</button></div>;
}

