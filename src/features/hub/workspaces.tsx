import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, MessageCircle, X, Send, CheckCircle2, Clock3 } from 'lucide-react';
import { toast } from 'sonner';
import { useHub, uid } from './store';
import { demoSchools, type CertificateRequest } from './school-data';
import { Heading, Panel, Field, Empty } from './ui';
import './workspaces.css';

const schoolName = (id?: string) => demoSchools.find(s => s.id === id)?.name ?? 'School not assigned';
function useRecords() {
 const hub = useHub();
 const admin = hub.profile.role === 'Administrator';
 const coordinator = hub.profile.role === 'School coordinator';
 const requests = hub.state.schoolRecords.requests.filter(r => admin || (coordinator ? r.schoolId === hub.profile.schoolId : r.members.some(m => m.email.toLowerCase() === hub.profile.email.toLowerCase())));
 const members = hub.state.schoolRecords.members.filter(m => admin || m.schoolId === hub.profile.schoolId);
 return {...hub, admin, coordinator, requests, members};
}
function Status({status}:{status:string}) { return <span className={`ws-status ws-status-${status.toLowerCase()}`}>{status==='Issued'?<CheckCircle2 size={13}/>:<Clock3 size={13}/>} {status}</span>; }
export function SchoolMembersPage() {
 const {profile,admin,members,state,update}=useRecords();
 const [school,setSchool]=useState(profile.schoolId??demoSchools[0].id);
 const [query,setQuery]=useState('');
 const visible=(admin?state.schoolRecords.members.filter(m=>m.schoolId===school):members).filter(m=>`${m.name} ${m.email}`.toLowerCase().includes(query.toLowerCase()));
 const schoolId=admin?school:profile.schoolId;
 return <div className="ws-page"><Heading eyebrow="SCHOOL COMMUNITY" title="Every member matters." description="Keep your school register in one place. Students do not need an account to receive a certificate."/>
 {admin&&<Field label="School"><select value={school} onChange={e=>setSchool(e.target.value)}>{demoSchools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>}
 <div className="ws-dashboard-grid"><Panel><h2>Add a school member</h2><form className="hub-form" onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const f=new FormData(form);const name=String(f.get('name')).trim(),email=String(f.get('email')).trim().toLowerCase();if(!schoolId||!name)return;if(email&&state.schoolRecords.members.some(m=>m.email===email)){toast.error('This email is already in the member register.');return;}if(update(s=>s.schoolRecords.members.push({id:uid(),schoolId,name,email,category:'High school'}))){form.reset();toast.success('School member added');}}}><Field label="Student full name"><input name="name" required maxLength={100}/></Field><Field label="Student email (optional)"><input name="email" type="email"/></Field><button className="hub-button">Add member</button></form></Panel>
 <Panel><h2>Add a group</h2><p>Paste one student per line: name | email. Email is optional.</p><form className="hub-form" onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const rows=String(new FormData(form).get('rows')).split('\n').filter(x=>x.trim()).map(line=>{const [name,email='']=line.split('|').map(x=>x.trim());return {id:uid(),schoolId:schoolId!,name,email:email.toLowerCase(),category:'High school'};});if(!schoolId||!rows.length)return;if(rows.some(r=>!r.name||(r.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)))||rows.some((r,i)=>r.email&&(state.schoolRecords.members.some(m=>m.email===r.email)||rows.slice(0,i).some(m=>m.email===r.email)))){toast.error('Check names and emails. Duplicate emails cannot be imported.');return;}if(update(s=>s.schoolRecords.members.push(...rows))){form.reset();toast.success(`${rows.length} members added`);}}}><Field label="Group member list"><textarea name="rows" rows={5} required placeholder={'Aline Uwase | aline@example.com\nJean Mugisha'}/></Field><button className="hub-button secondary">Add group</button></form></Panel></div>
 <Panel><div className="ws-panel-title"><h2>{schoolName(schoolId)}</h2><span className="ws-pill">{visible.length} members</span></div><Field label="Search school members"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name or email"/></Field><div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Name</th><th>Email</th><th>Category</th></tr></thead><tbody>{visible.map(m=><tr key={m.id}><td>{m.name}</td><td>{m.email||'No email needed'}</td><td>{m.category}</td></tr>)}</tbody></table></div>{!visible.length&&<Empty>No members match this view.</Empty>}</Panel></div>;
}
export async function downloadCertificates(request: CertificateRequest, recipients=request.members) {
 try {
 const logo=await new Promise<string>((resolve,reject)=>{const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=564;canvas.height=324;const ctx=canvas.getContext('2d');if(!ctx){reject(new Error('Canvas unavailable'));return;}ctx.drawImage(img,0,0,564,324);resolve(canvas.toDataURL('image/png'));};img.onerror=reject;img.src='/logo.svg';});
 const {jsPDF}=await import('jspdf');const QRCode=await import('qrcode');const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
 for(let i=0;i<recipients.length;i++){
  const m=recipients[i];if(i)pdf.addPage();
  pdf.setFillColor(255,255,255);pdf.rect(0,0,297,210,'F');
  pdf.setFillColor(18,54,82);pdf.rect(0,0,7,210,'F');pdf.setFillColor(29,117,219);pdf.rect(7,0,2,210,'F');
  pdf.setDrawColor(203,177,116);pdf.setLineWidth(.5);pdf.rect(15,12,269,186);pdf.setDrawColor(226,232,239);pdf.setLineWidth(.2);pdf.rect(18,15,263,180);
  pdf.addImage(logo,'PNG',125,21,47,27);
  pdf.setTextColor(29,117,219);pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setCharSpace(0);pdf.text('RECOGNIZING GROWTH & SERVICE',148.5,58,{align:'center'});pdf.setCharSpace(0);
  pdf.setTextColor(18,54,82);pdf.setFont('times','normal');pdf.setFontSize(31);pdf.text('Certificate of Achievement',148.5,75,{align:'center'});
  pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.setTextColor(99,112,128);pdf.text('Proudly presented to',148.5,88,{align:'center'});
  pdf.setFont('times','bold');pdf.setTextColor(18,54,82);pdf.setFontSize(29);pdf.setFontSize(Math.min(29,29*235/Math.max(pdf.getTextWidth(m.name),1)));pdf.text(m.name,148.5,103,{align:'center'});
  pdf.setDrawColor(203,177,116);pdf.line(90,110,207,110);
  pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.setTextColor(99,112,128);pdf.text(request.programme==='Service as a PLP member'?'In recognition of dedicated service':'For successful completion of',148.5,121,{align:'center'});
  pdf.setFont('helvetica','bold');pdf.setTextColor(18,54,82);pdf.setFontSize(16);pdf.setFontSize(Math.min(16,16*235/Math.max(pdf.getTextWidth(request.programme),1)));pdf.text(request.programme,148.5,133,{align:'center'});
  pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.text(schoolName(request.schoolId),148.5,143,{align:'center'});
  pdf.setDrawColor(226,232,239);pdf.line(29,154,268,154);
  pdf.setFontSize(8);pdf.setTextColor(99,112,128);pdf.text(request.programme==='Service as a PLP member'?'REQUESTED':'COMPLETED',29,164);pdf.text('DEMO AUTHORIZATION',103,164);
  pdf.setTextColor(18,54,82);pdf.setFontSize(10);pdf.text(request.completed,29,172);pdf.text(request.approvedBy??'Demo administrator',103,172,{maxWidth:100});
  pdf.setFontSize(8);pdf.setTextColor(99,112,128);pdf.text(`Issued ${request.issued}`,29,181);pdf.text(`Certificate ID: ${request.id}/${m.id}`,29,187,{maxWidth:200});
  const url=`${window.location.origin}/certificate-check/${encodeURIComponent(request.id)}/${encodeURIComponent(m.id)}`;pdf.addImage(await QRCode.toDataURL(url,{margin:1,width:240}),'PNG',241,158,25,25);pdf.setFontSize(7);pdf.text('SCAN TO VERIFY',253.5,188,{align:'center'});
  pdf.setFontSize(7);pdf.text('FRONTEND DEMO · Not an official credential. Verification uses records saved in this browser.',148.5,204,{align:'center'});

 }
 pdf.save(`${request.id}-${recipients.length===1?'certificate':'batch'}.pdf`);
 }catch{toast.error('Could not generate the PDF. Please try again.');}
}
export function CertificateCheckPage(){const {requestId,memberId}=useParams();const {state}=useHub();const r=state.schoolRecords.requests.find(r=>r.id===requestId&&r.status==='Issued');const member=r?.members.find(m=>m.id===memberId);return <div className="hub-section hub-narrow"><Panel><Award size={40}/><Heading title={member?'Certificate found':'Certificate not found'} description="PLP certificate verification · Frontend demo"/>{member&&r?<><h2>{member.name}</h2><p>{r.programme}</p><p>{schoolName(r.schoolId)}</p><p>Issued {r.issued} · Completed {r.completed}</p><Status status="Issued"/></>:<p>No issued certificate matches this link in this browser.</p>}<p className="hub-caption">This is a demonstration record, not an official credential.</p><Link className="hub-text-link" to="/">PLP website</Link></Panel></div>;}
const answers=[{q:'How do I join PLP?',words:['join','signup','sign up','register','password'],a:'Choose Join PLP, enter your name and email, choose Member, and set a password. Member access is immediate. Staff roles require an authorized assignment; demo accounts are available on the sign-in page.'},{q:'How do I get a certificate?',words:['certificate','pdf','download','approve','request'],a:'Academy course certificates are awarded automatically when you complete the required lessons, assignment, and assessment. School club leaders add students in School members, then select recipients to request standard PLP membership certificates. An administrator approves and issues the request. The coordinator can then download one PDF or the full batch. Members with a matching email can see their own issued certificates.'},{q:'Do students need an account?',words:['student','account','school'],a:'Students do not need an account for a coordinator to request their certificates. An optional matching email connects an issued certificate to a member account.'},{q:'Who is the administrator?',words:['admin','coordinator','role','trainer'],a:'The administrator manages staff access and issues certificates. Coordinators manage their assigned school only. Trainers manage their assigned courses. For testing, use the clearly labeled demo accounts on Sign in.'},{q:'Will my data work on another device?',words:['device','browser','demo','save','data'],a:'This frontend demo saves records in this browser. Sign out and use another demo role in the same browser to test the workflow. Shared accounts, email, and official certificates need a backend.'}];
export function HelpChat(){const logRef=useRef<HTMLDivElement>(null);const [open,setOpen]=useState(false),[input,setInput]=useState(''),[messages,setMessages]=useState<{who:string;text:string}[]>([{who:'PLP help',text:'Hi! I can explain joining, roles, and school certificates. What would you like to know?'}]);useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[messages,open]);function ask(text:string){const clean=text.trim();if(!clean)return;const scores=answers.map(a=>({a,score:a.words.filter(w=>clean.toLowerCase().includes(w)).length})).sort((a,b)=>b.score-a.score);setMessages(m=>[...m,{who:'You',text:clean},{who:'PLP help',text:scores[0].score?scores[0].a.a:'I can help with joining, roles, demo accounts, and certificates. For other questions, contact info@peaceloveproclaimers.org.'}]);setInput('');}return <div className="ws-chat">{open&&<section className="ws-chat-panel" aria-label="PLP help chat"><header><div><strong>PLP help</strong><small>Quick answers · Automated FAQ</small></div><button aria-label="Close help chat" onClick={()=>setOpen(false)}><X size={18}/></button></header><div ref={logRef} className="ws-chat-messages" role="log" aria-live="polite">{messages.map((m,i)=><div className={m.who==='You'?'ws-chat-you':''} key={i}><small>{m.who}</small><p>{m.text}</p></div>)}</div><div className="ws-chat-suggestions">{answers.slice(0,3).map(a=><button key={a.q} onClick={()=>ask(a.q)}>{a.q}</button>)}</div><form onSubmit={e=>{e.preventDefault();ask(input);}}><input aria-label="Ask PLP help" value={input} onChange={e=>setInput(e.target.value)} maxLength={400} placeholder="Ask a simple question…"/><button aria-label="Send question"><Send size={18}/></button></form></section>}<button className="ws-chat-toggle" aria-expanded={open} onClick={()=>setOpen(!open)}><MessageCircle size={21}/> {open?'Close help':'Need a hand?'}</button></div>;}
