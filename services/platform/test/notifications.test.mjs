import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {connectDatabase} from '../src/db.mjs';
import {createServer} from '../src/server.mjs';
import {digest,sessionToken,sessionJwt} from "../src/auth.mjs";
const database=process.env.TEST_DATABASE_URL;
if(database){if(!new URL(database).pathname.endsWith('_test'))throw Error('Dedicated test DB required');process.env.DATABASE_URL=database;}
test('activity participation notifies the organiser live, and members hear about new activities',{skip:!database},async()=>{
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null,recoveryEnabled:false});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 async function account(role){const id=randomUUID(),token=sessionToken();await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,$3,'unused',$4,'approved',now())",[id,`${id}@example.test`,`Notify ${role}`,role]);await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),id]);return {id,cookie:`plp_session=${sessionJwt(id,token)}`};}
 const api=async(path,method,body,cookie)=>{const r=await fetch(base+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json().catch(()=>null)};};
 const controller=new AbortController();
 try{
  const admin=await account('admin'),member=await account('member');
  // The organiser keeps a live connection open, as an open browser tab does.
  const stream=await fetch(base+'/api/live',{headers:{Cookie:admin.cookie},signal:controller.signal});
  assert.equal(stream.headers.get('content-type'),'text/event-stream');
  const reader=stream.body.getReader(),decoder=new TextDecoder();let received='';
  const until=async(text)=>{while(!received.includes(text)){const {value,done}=await reader.read();if(done)break;received+=decoder.decode(value);}return received.includes(text);};
  const event=await api('/records/events','POST',{title:'Notification test walk',date:new Date(Date.now()+30*864e5).toISOString().slice(0,10),description:'A walk to test notifications.',activity_type:'Meeting',hours:1,category:'Test community'},admin.cookie);
  assert.equal(event.status,201);
  const inbox=await api('/notifications','GET',undefined,member.cookie);
  assert.ok(inbox.data.items.some(n=>n.title==='New activity: Notification test walk'));
  assert.ok(inbox.data.unread>=1);
  assert.equal((await api('/records/applications','POST',{title:'Notify member',description:'Activity participation',category:`activity:${event.data.id}`},member.cookie)).status,201);
  assert.ok(await until('Notify member will participate'),'organiser receives the notification live');
  assert.ok(received.includes('event: change'),'open pages are told data changed');
  assert.equal((await api('/notifications/read','POST',{},member.cookie)).status,200);
  assert.equal((await api('/notifications','GET',undefined,member.cookie)).data.unread,0);
  assert.equal((await api('/notifications','GET',undefined,'')).status,401);
 }finally{controller.abort();await new Promise(r=>{server.closeAllConnections?.();server.close(r);});await db.end();}
});
