import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {connectDatabase} from '../src/db.mjs';
import {createServer} from '../src/server.mjs';
import {digest,sessionToken,sessionJwt} from "../src/auth.mjs";
import {composeMentorshipEmail,mentorDomains} from '../src/mentorship.mjs';
const database=process.env.TEST_DATABASE_URL;
if(database){if(!new URL(database).pathname.endsWith('_test'))throw Error('Dedicated test DB required');process.env.DATABASE_URL=database;}
const request={kind:'requested',session_id:randomUUID(),recipient_email:'aline.m@peaceloveproclaimers.org',recipient_name:'Aline M.',mentor_name:'Aline M.',mentee_name:'Test Member',topic:'Leadership',date:'2026-11-05T12:00:00.000Z',goal:'Plan a peace campaign for our club.',meeting_link:'',note:''};
test('request email names the session in Kigali time and links to the mentor dashboard',()=>{
 const mail=composeMentorshipEmail(request,'https://plp.example');
 assert.match(mail.subject,/New mentorship session request from Test Member/);
 assert.match(mail.body,/14:00 \(Kigali time\)/);
 assert.match(mail.body,/https:\/\/plp\.example\/mentor-sessions/);
 assert.match(composeMentorshipEmail({...request,kind:'confirmed',meeting_link:'https://meet.example/x'},'https://plp.example').body,/Meeting: https:\/\/meet\.example\/x/);
});
test('mentor domains are configurable',()=>{assert.deepEqual(mentorDomains({MENTOR_EMAIL_DOMAINS:' a.org, B.org '}),['a.org','b.org']);assert.deepEqual(mentorDomains({}),['peaceloveproclaimers.org']);});
test('mentorship emails are queued only to mentor addresses, and only mentors can reply',{skip:!database},async()=>{
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null,recoveryEnabled:true});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(body,cookie)=>{const r=await fetch(base+'/api/mentorship/notify',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});return r.status;};
 async function account(email,role='member'){const id=randomUUID(),token=sessionToken();await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Mentorship tester','unused',$3,'approved',now())",[id,email,role]);await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),id]);return {id,email,cookie:`plp_session=${sessionJwt(id,token)}`};}
 try{
  const member=await account(`${randomUUID()}@example.org`),mentor=await account(`${randomUUID()}@peaceloveproclaimers.org`,'mentor');
  const input={...request,recipient_email:mentor.email};
  assert.equal(await call(request,''),401);
  assert.equal(await call({...request,recipient_email:'someone@gmail.com'},member.cookie),400);
  assert.equal(await call(input,member.cookie),202);
  const queued=(await db.query('SELECT * FROM notification_mail WHERE sender_id=$1',[member.id])).rows[0];
  assert.equal(queued.recipient,mentor.email);assert.match(queued.body,new RegExp(member.email));
  const reply={...input,kind:'confirmed',recipient_email:member.email};
  assert.equal(await call(reply,member.cookie),403);
  // Recipient is derived from the stored session, so a client cannot redirect mail.
  assert.equal(await call({...reply,recipient_email:'nobody@example.test'},mentor.cookie),202);
  const sent=(await db.query('SELECT recipient FROM notification_mail WHERE sender_id=$1',[mentor.id])).rows[0];assert.equal(sent.recipient,member.email);
  const api=async(path,method,body,cookie)=>{const r=await fetch(base+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
  // Mentors publish their own profile; mentees see it in the directory.
  const profile={title:'Leadership coach',area:'Leadership Development',bio:'I help young leaders plan and run community projects.',avatar:'',accepting:true};
  assert.equal((await api('/mentors/me','PUT',profile,member.cookie)).status,403);
  assert.equal((await api('/mentors/me','PUT',{...profile,avatar:'http://insecure.example/a.png'},mentor.cookie)).status,400);
  assert.equal((await api('/mentors/me','PUT',profile,mentor.cookie)).status,200);
  assert.equal((await api('/mentors','GET',undefined,member.cookie)).data.find(m=>m.id===mentor.id).title,'Leadership coach');
  // A venue can be plain text; links must be HTTPS.
  const second={...input,session_id:randomUUID(),date:new Date(Date.now()+7*86400000).toISOString()};
  assert.equal(await call(second,member.cookie),202);
  assert.equal(await call({...second,kind:'confirmed',recipient_email:member.email,meeting_link:'http://meet.example/x'},mentor.cookie),400);
  assert.equal(await call({...second,kind:'confirmed',recipient_email:member.email,meeting_link:'PLP office, Kigali'},mentor.cookie),202);
  // Pausing new requests blocks them on the server.
  assert.equal((await api('/mentors/me','PUT',{...profile,accepting:false},mentor.cookie)).status,200);
  assert.equal(await call({...input,session_id:randomUUID(),date:new Date(Date.now()+9*86400000).toISOString()},member.cookie),409);
 }finally{await new Promise(r=>server.close(r));await db.end();}
});
