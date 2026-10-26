import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {connectDatabase} from '../src/db.mjs';
import {createServer} from '../src/server.mjs';
import {digest,sessionToken,hashPassword,sessionJwt} from "../src/auth.mjs";
import {requestVerification,confirmVerification} from '../src/email-verification.mjs';
const database=process.env.TEST_DATABASE_URL;
if(database){if(!new URL(database).pathname.endsWith('_test'))throw Error('Dedicated test DB required');process.env.DATABASE_URL=database;}
test('email verification does not approve trainers; only admin approval unlocks teaching', {skip:!database}, async()=>{
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null,recoveryEnabled:true});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(path,method='GET',body,cookie='')=>{const r=await fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};};
 const id=randomUUID(),email=`staff-${id}@example.test`,password='Strong-password-123';
 try{
  await db.query("INSERT INTO users(id,email,name,password_hash,requested_role) VALUES($1,$2,'Trainer applicant',$3,'trainer')",[id,email,await hashPassword(password)]);
  await requestVerification(db,email);
  const code=(await db.query('SELECT token FROM recovery_mail WHERE recipient=$1',[email])).rows[0].token;
  assert.equal(await confirmVerification(db,email,code),true);
  assert.equal((await db.query('SELECT status FROM users WHERE id=$1',[id])).rows[0].status,'pending');
  const login=await call('/auth/login','POST',{email,password});assert.equal(login.status,200);assert.equal(login.data.pendingApproval,true);assert.equal(login.cookie,null);
  assert.equal((await call('/teaching/courses')).status,401);
  const stale=sessionToken();await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(stale),id]);
  assert.equal((await call('/teaching/courses','GET',undefined,`plp_session=${sessionJwt(id,stale)}`)).status,401);
  const admin=randomUUID(),token=sessionToken();await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Approval admin','unused','admin','approved',now())",[admin,`${admin}@example.test`]);await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),admin]);
  const approval={role:'trainer',status:'approved',school_id:null};
  assert.equal((await call(`/users/${id}`,'PATCH',approval,`plp_session=${sessionJwt(admin,token)}`)).status,200);
  const approved=await call('/auth/login','POST',{email,password});assert.equal(approved.data.role,'trainer');assert.ok(approved.cookie);
  const cookie=approved.cookie.split(';')[0];assert.equal((await call('/teaching/courses','GET',undefined,cookie)).status,200);
  assert.equal((await call(`/users/${admin}`,'PATCH',approval,cookie)).status,403);
  assert.equal((await call(`/users/${id}`,'PATCH',{...approval,status:'suspended'},`plp_session=${sessionJwt(admin,token)}`)).status,200);
  assert.equal((await call('/teaching/courses','GET',undefined,cookie)).status,401);
 }finally{await new Promise(r=>server.close(r));await db.end();}
});
