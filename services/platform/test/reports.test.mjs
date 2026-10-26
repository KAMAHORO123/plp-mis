import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {connectDatabase} from '../src/db.mjs';
import {createServer} from '../src/server.mjs';
import {digest,sessionToken,sessionJwt} from "../src/auth.mjs";
const database=process.env.TEST_DATABASE_URL;
if(database){if(!new URL(database).pathname.endsWith('_test'))throw Error('Dedicated test DB required');process.env.DATABASE_URL=database;}
test('report figures match the records: attendance, hours and credits; reports need no review',{skip:!database},async()=>{
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null,recoveryEnabled:false});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 async function account(role){const id=randomUUID(),token=sessionToken();await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,$3,'unused',$4,'approved',now())",[id,`${id}@example.test`,`Report ${role}`,role]);await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),id]);return {id,cookie:`plp_session=${sessionJwt(id,token)}`};}
 const api=async(path,method,body,cookie)=>{const r=await fetch(base+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json().catch(()=>null)};};
 try{
  const admin=await account('admin');
  const before=(await api('/reports/overview','GET',undefined,admin.cookie)).data;
  const attendee=await account('member'),absent=await account('member');
  const event=(await api('/records/events','POST',{title:'Report check clean-up',date:'2020-05-01',description:'Past volunteering.',activity_type:'Volunteering',hours:3,category:'Report test'},admin.cookie)).data.id;
  assert.equal((await api(`/events/${event}/attendance`,'PUT',{member_ids:[attendee.id]},admin.cookie)).status,200);
  assert.equal((await api(`/events/${event}/report`,'POST',{report:'Twelve members cleaned the park and planted flowers.'},admin.cookie)).status,200);
  const after=(await api('/reports/overview','GET',undefined,admin.cookie)).data;
  // Other test files run at the same time, so platform-wide totals can only be checked as lower bounds.
  for(const [k,n] of [['activities',1],['reportsSubmitted',1],['attendance',1],['creditsAwarded',20],['members',2]])assert.ok(after[k]>=before[k]+n,`${k} grew by at least ${n}`);
  const credited=(await db.query("SELECT coalesce(sum(amount),0)::int AS n FROM credits WHERE source=$1",[`activity:${event}`])).rows[0].n;
  assert.equal(credited,20,'one attendee earned the volunteering amount');
  assert.ok(!after.tasks.some(t=>t.id===event),'reports are final when submitted, so they never wait for review');
  for(const [k,v] of Object.entries(after))if(typeof v==='number')assert.ok(Number.isInteger(v)&&v>=0,`${k} is a whole, non-negative number`);
  const mine=(await api('/reports/overview','GET',undefined,attendee.cookie)).data;
  assert.deepEqual([mine.activitiesAttended,mine.volunteerHours,mine.activityHours,mine.credits],[1,3,3,20]);
  assert.deepEqual([(await api('/reports/overview','GET',undefined,absent.cookie)).data.credits],[0]);
  assert.equal(mine.members,undefined,'members never receive platform-wide figures');
  // A report can only be submitted once the activity has happened.
  const future=(await api('/records/events','POST',{title:'Report check future',date:new Date(Date.now()+5*864e5).toISOString().slice(0,10),description:'Not held yet.',hours:1,category:'Report test'},admin.cookie)).data.id;
  assert.equal((await api(`/events/${future}/report`,'POST',{report:'Trying to report an activity that has not happened.'},admin.cookie)).status,409);
  assert.equal((await api('/reports/overview','GET',undefined,'')).status,401);
 }finally{await new Promise(r=>server.close(r));await db.end();}
});
