import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, Clock3, Globe, Coins, BriefcaseBusiness, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { StatCard } from '@/components/shared/stat-card';
import { useHub, balance } from './store';
import { clubs, categories } from './data';
import { demoSchools } from './school-data';
import { Panel, Empty, Progress } from './ui';
import './workspaces.css';

type Row = { id: string; title: string; detail: string; status: string; value: string; to: string };
export function RoleDashboard() {
 const { state, profile } = useHub();
 const admin=profile.role==='Administrator', trainer=profile.role==='Trainer', coordinator=profile.role==='School coordinator', leader=profile.role==='Club leader';
 const [query,setQuery]=useState('');
 const courses=state.courses.filter(c=>admin||c.ownerId===profile.id);
 const own=state.enrollments.filter(e=>e.memberId===profile.id);
 const teaching=state.enrollments.filter(e=>courses.some(c=>c.id===e.courseId));
 const activities=state.activities.filter(a=>admin||profile.managedClubIds.includes(a.clubId));
 const members=state.profiles.filter(p=>p.membership==='Approved'&&(admin||p.clubIds.some(id=>profile.managedClubIds.includes(id))));
 const schoolMembers=state.schoolRecords.members.filter(m=>m.schoolId===profile.schoolId);
 const requests=state.schoolRecords.requests.filter(r=>admin||r.schoolId===profile.schoolId);
 const pending=requests.filter(r=>r.status==='Submitted');
 const completed=state.enrollments.filter(e=>e.completedAt);
 const activeClubs=clubs.filter(c=>state.profiles.some(p=>p.membership==='Approved'&&p.clubIds.includes(c.id)));
 const title=admin?'Platform overview':trainer?'Teaching overview':coordinator?'School overview':leader?'Club leadership overview':'My learning journey';
 const description=admin?'Monitor learning, communities, and opportunities across PLP.':trainer?'Create courses, support learners, and review their assignments.':coordinator?`${demoSchools.find(s=>s.id===profile.schoolId)?.name??'School not assigned'} · Manage your register and school achievement requests.`:leader?'Manage your assigned clubs, record participation, and submit reports.':'Discover your strengths. Build skills. Put them into practice.';
 let stats: [string,number,LucideIcon][];
 let rows:Row[];
 let tableTitle:string;
 let chart:{name:string;value:number}[];
 let chartTitle:string;
 let action:{to:string;label:string};
 if(admin){
  stats=[['Members',members.length,Users],['Courses completed',completed.length,BookOpen],['Active clubs',activeClubs.length,Globe],['Published opportunities',state.opportunities.filter(o=>o.published).length,BriefcaseBusiness]];
  chart=categories.map(name=>({name:name.replace(' Development','').replace(' Skills','').replace('Civic & Peace Leadership','Peace leadership'),value:completed.filter(e=>state.courses.find(c=>c.id===e.courseId)?.category===name).length}));chartTitle='Course completions by learning pathway';
  rows=[...pending.map(r=>({id:r.id,title:r.programme,detail:'School certificate request',status:'Awaiting review',value:`${r.members.length} recipients`,to:'/certificate-centre'})),...state.proofs.filter(p=>p.status==='Pending review').map(p=>({id:p.id,title:state.profiles.find(m=>m.id===p.memberId)?.name??'Member',detail:'ALX completion evidence',status:'Awaiting review',value:'Recognition badge',to:'/studio?tab=ALX%20reviews'})),...state.activities.filter(a=>a.status==='Submitted').map(a=>({id:a.id,title:a.title,detail:'Club activity report',status:'Submitted',value:`${a.attendees.length} attendees`,to:'/clubs'})),...state.profiles.filter(p=>p.requestedRole).map(p=>({id:p.id,title:p.name,detail:`Staff assignment: ${p.requestedRole}`,status:'Verify assignment',value:p.email,to:'/memberships'}))];
  tableTitle='Tasks requiring attention';action={to:'/hub-analytics',label:'View impact analytics'};
 } else if(trainer){
  stats=[['Assigned courses',courses.length,BookOpen],['Enrolled learners',new Set(teaching.map(e=>e.memberId)).size,Users],['Assignments submitted',teaching.filter(e=>e.assignment).length,Clock3],['Courses completed',teaching.filter(e=>e.completedAt).length,Award]];
  chart=courses.map(c=>({name:c.title,value:teaching.filter(e=>e.courseId===c.id).length}));chartTitle='Learners by course';
  rows=courses.map(c=>({id:c.id,title:c.title,detail:c.category,status:c.published?'Published':'Draft',value:`${teaching.filter(e=>e.courseId===c.id&&e.assignment).length} assignments`,to:'/studio'}));tableTitle='Your teaching portfolio';action={to:'/studio',label:'Open trainer studio'};
 } else if(coordinator){
  stats=[['School members',schoolMembers.length,Users],['Submitted batches',pending.length,Clock3],['Returned for correction',requests.filter(r=>r.status==='Returned').length,BookOpen],['Issued certificates',requests.filter(r=>r.status==='Issued').reduce((n,r)=>n+r.members.length,0),Award]];
  chart=['Submitted','Returned','Issued'].map(name=>({name,value:requests.filter(r=>r.status===name).length}));chartTitle='School certificate requests';
  rows=requests.map(r=>({id:r.id,title:r.programme,detail:`Completed ${r.completed}`,status:r.status,value:`${r.members.length} recipients`,to:'/certificate-centre'}));tableTitle='School achievement requests';action={to:'/school-members',label:'Manage school members'};
 } else if(leader){
  stats=[['Assigned clubs',profile.managedClubIds.length,Globe],['Club members',members.length,Users],['Activities',activities.length,BookOpen],['Reports to submit',activities.filter(a=>a.status==='Draft').length,Clock3]];
  chart=['Meeting','Volunteering','Challenge','Recruitment'].map(name=>({name,value:activities.filter(a=>a.type===name).reduce((n,a)=>n+a.attendees.length,0)}));chartTitle='Participation by activity';
  rows=activities.map(a=>({id:a.id,title:a.title,detail:clubs.find(c=>c.id===a.clubId)?.name??'Club',status:a.status,value:`${a.attendees.length} attendees`,to:'/clubs'}));tableTitle='Activities & reports';action={to:'/clubs',label:'Manage clubs'};
 } else {
  stats=[['Courses in progress',own.filter(e=>!e.completedAt).length,BookOpen],['Courses completed',own.filter(e=>e.completedAt).length,Award],['PLP credits',balance(state,profile.id),Coins],['My communities',profile.clubIds.length,Globe]];
  chart=categories.map(name=>({name:name.replace(' Development','').replace(' Skills','').replace('Civic & Peace Leadership','Peace leadership'),value:own.filter(e=>e.completedAt&&state.courses.find(c=>c.id===e.courseId)?.category===name).length}));chartTitle='My completed learning pathways';
  rows=own.flatMap(e=>{const c=state.courses.find(c=>c.id===e.courseId);return c?[{id:c.id,title:c.title,detail:c.category,status:e.completedAt?'Completed':'In progress',value:`${e.lessons.length}/${c.lessons.length} lessons`,to:`/academy/${c.id}`}]:[]});tableTitle='Continue learning';action={to:'/academy',label:'Explore learning academy'};
 }
 const visible=rows.filter(r=>`${r.title} ${r.detail} ${r.status}`.toLowerCase().includes(query.toLowerCase()));
 const shortcuts=admin?[['Content studio','Courses, ALX reviews, and opportunities','/studio'],['Members & staff','Account access and assigned responsibilities','/memberships'],['Clubs & reports','Community participation and submitted reports','/clubs']]:trainer?[['Assignments','Read work submitted by your learners','/studio?tab=Assignments'],['Course authoring','Lessons, assignments, and assessments','/studio'],['My profile','Keep your trainer details up to date','/passport']]:coordinator?[['School register','Add students individually or as a group','/school-members'],['Certificate requests','Submit evidence and download approved batches','/certificate-centre'],['Learning academy','Explore the programmes available to students','/academy']]:leader?[['Club workspace','Members, attendance, activities, and reports','/clubs'],['Club invitations','Invite people into your assigned communities','/memberships'],['My learning','Continue your own development','/academy']]:[['ALX learning zone','Explore external programmes and record progress','/alx'],['Opportunity centre','Internships, jobs, scholarships, and more','/opportunities'],['Digital youth passport','Skills, achievements, and your development record','/passport']];
 return <div className="ws-page ws-overview"><header className="ws-page-header"><div><p className="ws-kicker">DISCOVER & DEVELOP · {profile.role}</p><h1>{title}</h1><p>{description}</p></div><Link className="hub-button" to={action.to}>{action.label}<ArrowUpRight size={16}/></Link></header>
 {profile.requestedRole&&<p className="hub-feedback">You requested {profile.requestedRole} access. Your member account is active; PLP must verify your staff assignment before staff tools become available.</p>}
 <div className="ws-stats">{stats.map(([label,value,icon])=><StatCard key={label} label={label} value={String(value)} icon={icon}/>)}</div>
 <div className="ws-shortcuts">{shortcuts.map(([label,detail,to])=><Link to={to} key={to}><strong>{label}<ArrowUpRight size={16}/></strong><span>{detail}</span></Link>)}</div>
 <Panel><div className="ws-panel-title"><h2>{chartTitle}</h2><span className="ws-pill">Current demo records</span></div><div className="ws-chart" role="img" aria-label={chart.map(c=>`${c.name}: ${c.value}`).join(', ')}><ResponsiveContainer width="100%" height={230}><BarChart data={chart}><CartesianGrid vertical={false} stroke="#eef0f4"/><XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false} interval={0}/><YAxis allowDecimals={false} width={30} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="value" name={trainer?'Enrolments':leader?'Attendances':coordinator?'Requests':'Completions'} fill="#659fe8" maxBarSize={64} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></Panel>
 <Panel><div className="ws-panel-title"><h2>{tableTitle} <span className="ws-count">{rows.length}</span></h2></div><div className="ws-table-tools"><input aria-label={`Search ${tableTitle.toLowerCase()}`} placeholder="Search by name or status…" value={query} onChange={e=>setQuery(e.target.value)}/></div>{visible.length?<div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Name</th><th>Status</th><th>Details</th><th>Action</th></tr></thead><tbody>{visible.map(r=><tr key={r.id}><td><strong>{r.title}</strong><small>{r.detail}</small></td><td>{r.status}</td><td>{r.value}</td><td><Link className="hub-text-link" to={r.to}>Open →</Link></td></tr>)}</tbody></table></div>:<Empty>{query?'No records match your search.':admin?'You are up to date. New review tasks will appear here.':trainer?'Create your first course in the trainer studio.':leader?'Your assigned club activities will appear here.':coordinator?'No school requests yet. Start with your school register.':'No courses started yet. Choose a course in the Learning Academy.'}</Empty>}</Panel>
 {!admin&&!trainer&&!coordinator&&!leader&&<Panel><h2>Your PLP pathway</h2><p className="hub-caption">Discover & Develop → Do through PLP Connect → Demonstrate your impact.</p><Progress label={`${own.filter(e=>e.completedAt).length} of ${own.length} enrolled courses completed`} value={own.length?Math.round(100*own.filter(e=>e.completedAt).length/own.length):0}/><p>Course certificates and credits are awarded automatically when you meet the lessons, assignment, and assessment requirements.</p><div className="hub-actions"><Link className="hub-text-link" to="/certificates">My achievements →</Link><Link className="hub-text-link" to="/mentorship">Find a mentor →</Link><Link className="hub-text-link" to="/clubs">Clubs & challenges →</Link></div></Panel>}
 </div>;
}
