import { confirmAction } from '@/components/shared/confirm-dialog';
import { useLiveTick } from './live';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, MapPin, Coins, Plus, Users, DoorOpen, ClipboardList, ExternalLink, FilePenLine, Megaphone, KeyRound, Ban, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { StatCard } from '@/components/shared/stat-card';
import { platformApi, refreshVerifiedCredits } from './platform-api';
import { Heading, Panel, Field, Empty, downloadCSV } from './ui';
import './workspaces.css';

type Meeting = { id:string;title:string;location:string;join_url:string;opens_at:string;closes_at:string;credits:number;closed:boolean;latitude:number;longitude:number;radius_m:number;attendees?:number };
type Account = {id:string;role:string};
const formatDate=(value:string)=>new Date(value).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Kigali'});
const maps=(m:Meeting)=>`https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`;
const getPosition=()=>new Promise<GeolocationPosition>((resolve,reject)=>{
 if(!navigator.geolocation)return reject(Error('Location is unavailable on this device. Please use a phone with location enabled.'));
 navigator.geolocation.getCurrentPosition(resolve,e=>reject(Error(e.code===1?'Allow location access to confirm you are at the venue.':'Could not get an accurate location. Enable precise location and try again.')),{enableHighAccuracy:true,maximumAge:0,timeout:20000});
});
export function MeetingsPage() {
 const {id}=useParams();
 const [meeting,setMeeting]=useState<Meeting|null>(null),[list,setList]=useState<Meeting[]>([]),[account,setAccount]=useState<Account|null>(null);
 const [loaded,setLoaded]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[checked,setChecked]=useState(false),[code,setCode]=useState('');
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{let active=true;setLoaded(false);setMeeting(null);setError('');setChecked(false);setCode('');
  Promise.all([platformApi<Meeting|Meeting[]>(id?`/public/meetings/${id}`:'/public/meetings'),platformApi<Account>('/me').catch(()=>null)])
   .then(async ([data,user])=>{if(!active)return;setAccount(user);if(id){setMeeting(data as Meeting);if(user){const result=await platformApi<{checkedIn:boolean}>(`/meetings/${id}/check-in`);if(active)setChecked(result.checkedIn);}}else setList(data as Meeting[]);})
   .catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoaded(true);});return()=>{active=false;};
 },[id]);
 if(!loaded)return <div className="hub-meeting-layout"><Panel><p role="status">Loading meeting…</p></Panel></div>;
 if(error&&!meeting&&!list.length)return <div className="hub-meeting-layout"><Panel><p role="alert">{error}</p><Link to="/meetings">Back to meetings</Link></Panel></div>;
 if(!id)return <div className="hub-meeting-layout hub-editorial-page"><Heading title="PLP meetings" description="Show up, connect, and earn verified credits."/>{account?.role==='admin'&&<Link className="hub-button" to="/meetings/manage">Manage meetings</Link>}{list.length?list.map(m=><Panel key={m.id}><h2>{m.title}</h2><p>{formatDate(m.opens_at)} · Kigali time</p><p>{m.location}</p><Link className="hub-button" to={`/meetings/${m.id}`}>View meeting</Link></Panel>):<Empty>No upcoming meetings. Check back soon.</Empty>}</div>;
 if(!meeting)return null;
 const open=!meeting.closed&&now>=new Date(meeting.opens_at).getTime()&&now<=new Date(meeting.closes_at).getTime();
 const ended=meeting.closed||now>new Date(meeting.closes_at).getTime();
 return <div className="hub-meeting-layout hub-editorial-page"><Link className="hub-text-link" to="/meetings">← All meetings</Link><Heading title={meeting.title}/><Panel>
  <dl className="hub-meeting-facts"><div><dt><CalendarDays size={18}/> Attendance window · Kigali time</dt><dd>{formatDate(meeting.opens_at)}<br/>to {formatDate(meeting.closes_at)}</dd></div><div><dt><MapPin size={18}/> Venue</dt><dd>{meeting.location}<br/><a className="hub-text-link" href={maps(meeting)} target="_blank" rel="noreferrer">Directions in Google Maps ↗</a></dd></div><div><dt><Coins size={18}/> Attendance reward</dt><dd>{meeting.credits} verified credits</dd></div></dl>
  {meeting.join_url&&<a className="hub-text-link" href={meeting.join_url} target="_blank" rel="noreferrer">Meeting information ↗</a>}
  {checked?<div role="status" className="hub-feedback"><CheckCircle2/><h2>Attendance confirmed</h2><p>{meeting.credits} credits have been added to your account.</p><Link className="hub-button" to="/credits">View my credits</Link></div>:ended?<p role="status">Attendance is closed for this meeting.</p>:!account?<><p>Sign in with your verified PLP account to mark attendance.</p><Link className="hub-button" to={`/auth/login?returnTo=${encodeURIComponent('/meetings/'+id)}`} onClick={()=>sessionStorage.setItem('plp-meeting-return','/meetings/'+id)}>Sign in to attend</Link></>:!open?<p role="status">Attendance opens at {formatDate(meeting.opens_at)}.</p>:<form className="hub-form" onSubmit={async e=>{
   e.preventDefault();setBusy(true);setError('');try{
    const position=await getPosition();
    await platformApi(`/meetings/${id}/check-in`,'POST',{code:code.replace(/\s/g,''),position:{latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy,timestamp:position.timestamp}});
    setChecked(true);refreshVerifiedCredits();
   }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }}><h2>Mark your attendance</h2><p>At the venue, enter the code shared by your host. We’ll check your current location once; your exact coordinates are not saved.</p><Field label="Attendance code"><input required value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={16} autoComplete="off" placeholder="Code from your host"/></Field><button className="hub-button" disabled={busy||code.replace(/\s/g,'').length!==12}>{busy?'Checking your attendance…':'Verify location & mark attendance'}</button></form>}
  {error&&<p role="alert" className="hub-access-error">{error}</p>}
 </Panel></div>;
}
const localInput=(iso:string)=>{const d=new Date(iso);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
type Attendee = { name: string; email: string; role: string; checked_in_at: string; distance_m: number; accuracy_m: number };
const meetingStatus = (m: Meeting) => m.closed || Date.parse(m.closes_at) <= Date.now() ? 'Closed' : Date.parse(m.opens_at) <= Date.now() ? 'Open now' : 'Scheduled';

/** Administrator workspace page: schedule meetings, run check-in, and review who attended. */
export function MeetingManager() {
 const [list,setList]=useState<Meeting[]>([]),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false);
 const [editing,setEditing]=useState<Meeting|'new'|null>(null),[hostCode,setHostCode]=useState<{title:string;code:string}|null>(null);
 const [register,setRegister]=useState<{meeting:Meeting;rows:Attendee[]}|null>(null),[query,setQuery]=useState('');
 const reload=()=>platformApi<Meeting[]>('/meetings').then(setList);
 const live=useLiveTick();
 useEffect(()=>{reload().catch(e=>toast.error(e.message)).finally(()=>setLoaded(true));},[live]);
 const openRegister=async(m:Meeting)=>{try{setRegister({meeting:m,rows:await platformApi<Attendee[]>(`/meetings/${m.id}/attendance`)});setQuery('');}catch(e){toast.error((e as Error).message);}};
 async function manage(m:Meeting,action:'publish'|'rotate'|'close'){
  setBusy(true);
  try{const result=await platformApi<Meeting&{code?:string}>(`/meetings/${m.id}/manage`,'POST',{action});if(result.code)setHostCode({title:m.title,code:result.code});await reload();window.dispatchEvent(new Event('plp:announcement-updated'));toast.success(action==='publish'?'Meeting shown in the website banner':action==='rotate'?'New attendance code generated':'Attendance closed');}
  catch(e){toast.error((e as Error).message);}finally{setBusy(false);}
 }
 const current=editing&&editing!=='new'?editing:null;
 const totalCheckins=list.reduce((n,m)=>n+(m.attendees||0),0);
 const rows=register?.rows.filter(r=>`${r.name} ${r.email}`.toLowerCase().includes(query.toLowerCase()))??[];
 return <div className="ws-page">
  <header className="ws-page-header"><div><p className="ws-kicker">ADMINISTRATION</p><h1>Meetings & attendance</h1><p>Schedule PLP meetings, share the host code at the venue, and see who checked in.</p></div><button className="hub-button" onClick={()=>{setEditing('new');setHostCode(null);}}><Plus size={16}/> Create meeting</button></header>
  {hostCode&&<Panel className="ms-callout"><div><h2>{hostCode.title} · Host code</h2><p className="hub-meeting-code">{hostCode.code}</p><p>Display this code at the venue. It is shown only once; generate a new one if needed.</p></div><button className="hub-button secondary" onClick={()=>setHostCode(null)}>Hide code</button></Panel>}
  <div className="ws-stats">
   <StatCard label="Meetings" value={String(list.length)} icon={CalendarDays}/>
   <StatCard label="Open for check-in" value={String(list.filter(m=>meetingStatus(m)==='Open now').length)} icon={DoorOpen}/>
   <StatCard label="Total check-ins" value={String(totalCheckins)} icon={Users}/>
   <StatCard label="Credits awarded" value={String(list.reduce((n,m)=>n+(m.attendees||0)*m.credits,0))} icon={Coins}/>
  </div>
  <Panel>
   <div className="ws-panel-title"><h2>Scheduled meetings <span className="ws-count">{list.length}</span></h2></div>
   {!loaded?<p>Loading meetings…</p>:!list.length?<Empty>No meetings yet. Use “Create meeting” to schedule the first one.</Empty>:<div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Meeting</th><th>Attendance window</th><th>Status</th><th>Checked in</th><th>Actions</th></tr></thead><tbody>
    {list.map(m=>{const status=meetingStatus(m);return <tr key={m.id}>
     <td><strong>{m.title}</strong><small><MapPin size={11}/> {m.location}</small></td>
     <td>{formatDate(m.opens_at)}<small>until {formatDate(m.closes_at)} · Kigali time</small></td>
     <td><span className={`ws-status ${status==='Open now'?'ws-status-issued':status==='Closed'?'ws-status-returned':''}`}>{status}</span></td>
     <td><button className="hub-text-button" onClick={()=>void openRegister(m)}>{m.attendees||0} people</button><small>{m.credits} credits each</small></td>
     <td><div className="mb-actions">
      <button className="hub-record-icon hub-record-edit" title="View attendance register" aria-label={`Attendance for ${m.title}`} onClick={()=>void openRegister(m)}><ClipboardList size={17}/></button>
      <Link className="hub-record-icon hub-record-edit" title="Open check-in page" aria-label={`Open check-in page for ${m.title}`} to={`/meetings/${m.id}`} target="_blank"><ExternalLink size={17}/></Link>
      {status!=='Closed'&&<>
       <button className="hub-record-icon hub-record-edit" disabled={busy} title="Edit date & details" aria-label={`Edit ${m.title}`} onClick={()=>{setEditing(m);setHostCode(null);}}><FilePenLine size={17}/></button>
       <button className="hub-record-icon hub-record-edit" disabled={busy} title="Show in website banner" aria-label={`Show ${m.title} in banner`} onClick={()=>void manage(m,'publish')}><Megaphone size={17}/></button>
       <button className="hub-record-icon hub-record-edit" disabled={busy} title="New attendance code" aria-label={`New code for ${m.title}`} onClick={()=>void manage(m,'rotate')}><KeyRound size={17}/></button>
       <button className="hub-record-icon hub-record-delete" disabled={busy} title="Close attendance" aria-label={`Close attendance for ${m.title}`} onClick={async()=>{if(await confirmAction({title:'Close attendance for this meeting?',description:'Members will no longer be able to check in with the attendance code.',confirmLabel:'Close attendance',destructive:true}))void manage(m,'close');}}><Ban size={17}/></button>
      </>}
     </div></td>
    </tr>;})}
   </tbody></table></div>}
  </Panel>
  {register&&<Panel>
   <div className="ws-panel-title"><h2>Attendance register · {register.meeting.title} <span className="ws-count">{register.rows.length}</span></h2><div className="hub-actions"><button className="hub-button secondary" disabled={!register.rows.length} onClick={()=>downloadCSV(`attendance-${register.meeting.title.replace(/\W+/g,'-').toLowerCase()}.csv`,[['Name','Email','Role','Checked in (Kigali)','Distance from venue (m)','Location accuracy (m)'],...register.rows.map(r=>[r.name,r.email,r.role,formatDate(r.checked_in_at),r.distance_m,r.accuracy_m])])}><Download size={15}/> Export CSV</button><button className="hub-button secondary" onClick={()=>setRegister(null)}>Close</button></div></div>
   <p className="hub-caption">{formatDate(register.meeting.opens_at)} – {formatDate(register.meeting.closes_at)} · {register.meeting.location} · {register.rows.length*register.meeting.credits} credits awarded</p>
   {register.rows.length?<>
    <div className="ws-table-tools"><input aria-label="Search attendees" placeholder="Search by name or email" value={query} onChange={e=>setQuery(e.target.value)}/><span>{rows.length} of {register.rows.length}</span></div>
    <div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>#</th><th>Name</th><th>Role</th><th>Checked in</th><th>Distance from venue</th></tr></thead><tbody>
     {rows.map((r,i)=><tr key={r.email}><td>{i+1}</td><td><strong>{r.name}</strong><small>{r.email}</small></td><td>{({member:'Member',leader:'Club leader',trainer:'Trainer',mentor:'Mentor',admin:'Administrator'} as Record<string,string>)[r.role]??r.role}</td><td>{formatDate(r.checked_in_at)}</td><td>{r.distance_m} m<small>±{r.accuracy_m} m accuracy</small></td></tr>)}
    </tbody></table></div>
   </>:<Empty>No one has checked in yet. Members check in on the meeting page with the host code while at the venue.</Empty>}
  </Panel>}
  {editing&&<Dialog open onOpenChange={o=>{if(!o&&!busy)setEditing(null);}}><DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
   <DialogTitle>{current?'Edit meeting':'Create a meeting'}</DialogTitle>
   <DialogDescription>Times use your device’s timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Members see Kigali time.</DialogDescription>
   <form className="hub-form hub-space" onSubmit={async e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);setBusy(true);try{
     const input={title:String(f.get('title')),location:String(f.get('location')),join_url:'',opens_at:new Date(String(f.get('opens'))).toISOString(),closes_at:new Date(String(f.get('closes'))).toISOString(),credits:Number(f.get('credits')),latitude:Number(f.get('latitude')),longitude:Number(f.get('longitude')),radius_m:Number(f.get('radius')),publish:f.get('publish')==='on'};
     const result=await platformApi<Meeting&{code?:string}>(current?`/meetings/${current.id}`:'/meetings',current?'PUT':'POST',input);
     if(result.code)setHostCode({title:result.title,code:result.code});
     setEditing(null);await reload();window.dispatchEvent(new Event('plp:announcement-updated'));toast.success(current?'Meeting updated':'Meeting created');
    }catch(err){toast.error((err as Error).message);}finally{setBusy(false);}
   }}>
    <Field label="Meeting name"><input name="title" required maxLength={100} defaultValue={current?.title||'PLP monthly meeting'}/></Field>
    <Field label="Venue"><input name="location" required maxLength={200} defaultValue={current?.location||'ALX Hub · Deco Center, KG 9 Avenue, Kigali'}/></Field>
    <div className="ws-form-grid"><Field label="Attendance opens"><input name="opens" type="datetime-local" required defaultValue={current?localInput(current.opens_at):''}/></Field><Field label="Attendance closes"><input name="closes" type="datetime-local" required defaultValue={current?localInput(current.closes_at):''}/></Field></div>
    <div className="ws-form-grid"><Field label="Credits per member"><input name="credits" type="number" min={1} max={500} required defaultValue={current?.credits||10}/></Field><Field label="Attendance radius (metres)"><input name="radius" type="number" min={30} max={300} required defaultValue={current?.radius_m||150}/></Field></div>
    <details><summary>Venue map pin</summary><p className="hub-caption">Default pin from the <a href="https://onboarding.alxafrica.com/pathway/hubs/" target="_blank" rel="noreferrer">ALX hub directory</a>. Confirm the entrance location before publishing.</p><div className="ws-form-grid"><Field label="Latitude"><input name="latitude" type="number" step="any" min={-90} max={90} required defaultValue={current?.latitude??-1.9270514}/></Field><Field label="Longitude"><input name="longitude" type="number" step="any" min={-180} max={180} required defaultValue={current?.longitude??30.0986973}/></Field></div></details>
    {!current&&<label className="hub-check"><input name="publish" type="checkbox"/>Show this meeting in the website banner</label>}
    <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" disabled={busy} onClick={()=>setEditing(null)}>Cancel</button><button className="hub-button" disabled={busy}>{busy?'Saving…':current?'Save changes':'Create meeting'}</button></div>
   </form>
  </DialogContent></Dialog>}
 </div>;
}
