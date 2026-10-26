import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {connectDatabase} from '../src/db.mjs';
import {createServer} from '../src/server.mjs';
import {digest,sessionToken,sessionJwt} from "../src/auth.mjs";
import {distanceMeters} from '../src/meetings.mjs';
const database=process.env.TEST_DATABASE_URL;
if(database){if(!new URL(database).pathname.endsWith('_test'))throw Error('Dedicated test DB required');process.env.DATABASE_URL=database;}
test('venue distance uses metres',()=>{assert.equal(distanceMeters(-1.927,30.098,-1.927,30.098),0);assert.ok(distanceMeters(-1.927,30.098,-1.917,30.098)>1100);});
test('meeting attendance requires verified identity, venue, time and code; credits are awarded once', {skip:!database},async()=>{
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(path,method='GET',body,cookie='')=>{const r=await fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 async function account(role,verified=true){const id=randomUUID(),token=sessionToken();await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Meeting tester','unused',$3,'approved',$4)",[id,`${id}@example.test`,role,verified?new Date():null]);await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),id]);return {id,cookie:`plp_session=${sessionJwt(id,token)}`};}
 try{
  const admin=await account('admin'),member=await account('member'),unverified=await account('member',false);
  const input={title:'PLP monthly meeting',location:'ALX Hub · Deco Center',opens_at:new Date(Date.now()-60000).toISOString(),closes_at:new Date(Date.now()+3600000).toISOString(),credits:10,latitude:-1.9270514,longitude:30.0986973,radius_m:150,publish:true};
  assert.equal((await call('/meetings','POST',input,member.cookie)).status,403);
  const created=await call('/meetings','POST',input,admin.cookie);assert.equal(created.status,201);const {id,code}=created.data;
  const publicMeeting=await call(`/public/meetings/${id}`);assert.equal(publicMeeting.status,200);assert.equal(publicMeeting.data.code,undefined);assert.equal(publicMeeting.data.code_hash,undefined);
  assert.equal((await call('/public/announcement')).data.href,`/meetings/${id}`);
  const overnight={...input,opens_at:'2099-01-01T22:30:00.000Z',closes_at:'2099-01-02T23:30:00.000Z'};
  assert.equal((await call(`/meetings/${id}`,'PUT',overnight,admin.cookie)).status,200);
  const banner=(await call('/public/announcement')).data;
  assert.equal(banner.date,'2099-01-02');assert.equal(banner.endsAt,overnight.closes_at);
  assert.equal((await call(`/meetings/${id}`,'PUT',input,admin.cookie)).status,200);
  await db.query("UPDATE meetings SET closes_at=now()-interval '1 minute',opens_at=now()-interval '1 hour' WHERE id=$1",[id]);
  assert.equal((await call('/public/announcement')).data.enabled,false);
  assert.equal((await call(`/meetings/${id}`,'PUT',input,admin.cookie)).status,200);
  const position={latitude:input.latitude,longitude:input.longitude,accuracy:10,timestamp:Date.now()};
  const check=(body,cookie=member.cookie)=>call(`/meetings/${id}/check-in`,'POST',body,cookie);
  assert.equal((await check({code,position},'')).status,401);
  assert.equal((await check({code,position},unverified.cookie)).status,401);
  assert.equal((await check({code,position:{...position,latitude:0}})).status,403);
  assert.equal((await check({code,position:{...position,accuracy:900}})).status,400);
  assert.equal((await check({code,position:{...position,timestamp:Date.now()-300000}})).status,400);
  assert.equal((await check({code:'000000000000'===code?'111111111111':'000000000000',position})).status,400);
  const success=await Promise.all([check({code,position}),check({code,position})]);assert.ok(success.every(r=>r.status===200));assert.equal(success.filter(r=>r.data.alreadyCheckedIn).length,1);
  assert.equal((await call('/credits/balance','GET',undefined,member.cookie)).data.balance,10);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM meeting_checkins WHERE meeting_id=$1',[id])).rows[0].n,1);
  assert.equal((await call(`/meetings/${id}/attendance`,'GET',undefined,member.cookie)).status,403);
  assert.equal((await call(`/meetings/${id}/attendance`,'GET',undefined,admin.cookie)).data.length,1);
  assert.equal((await call(`/meetings/${id}`,'PUT',{...input,credits:20},admin.cookie)).status,400);
  const rescheduled={...input,opens_at:new Date(Date.now()+3600000).toISOString(),closes_at:new Date(Date.now()+7200000).toISOString()};
  assert.equal((await call(`/meetings/${id}`,'PUT',rescheduled,admin.cookie)).status,200);
  const other=await account('member');
  assert.equal((await check({code,position},other.cookie)).status,400);
  assert.equal((await call(`/meetings/${id}`,'PUT',input,admin.cookie)).status,200);
  const rotated=await call(`/meetings/${id}/manage`,'POST',{action:'rotate'},admin.cookie);assert.equal(rotated.status,200);
  assert.equal((await check({code,position},other.cookie)).status,400);
  assert.equal((await check({code:rotated.data.code,position},other.cookie)).status,200);
  await call(`/meetings/${id}/manage`,'POST',{action:'close'},admin.cookie);
  assert.equal((await call('/public/announcement')).data.enabled,false);
  assert.equal((await call(`/meetings/${id}/manage`,'POST',{action:'publish'},admin.cookie)).status,400);
  const last=await account('member');assert.equal((await check({code:rotated.data.code,position},last.cookie)).status,400);
 }finally{await new Promise(r=>server.close(r));await db.end();}
});
