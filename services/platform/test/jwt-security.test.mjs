import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import {connectDatabase} from '../src/db.mjs';
import {createServer} from '../src/server.mjs';
import {digest,sessionToken,sessionJwt,signJwt,verifyJwt,hashPassword} from '../src/auth.mjs';
import {passwordProblem} from '../src/password-policy.mjs';
const database=process.env.TEST_DATABASE_URL;
if(database){if(!new URL(database).pathname.endsWith('_test'))throw Error('Dedicated test DB required');process.env.DATABASE_URL=database;}
const b64=(v)=>Buffer.from(JSON.stringify(v)).toString('base64url');
const claims=(o={})=>{const iat=Math.floor(Date.now()/1000);return {iss:'plp-platform',aud:'plp-hub',sub:randomUUID(),sid:'x',iat,nbf:iat,exp:iat+3600,...o};};

test('JWT verification rejects tampering, foreign keys, "none", expiry and wrong audience',()=>{
 const good=signJwt(claims());
 assert.ok(verifyJwt(good));
 const [h,p,sig]=good.split('.');
 const forged=`${h}.${b64({...JSON.parse(Buffer.from(p,'base64url')),sub:randomUUID()})}.${sig}`;
 assert.equal(verifyJwt(forged),null,'edited claims break the signature');
 assert.equal(verifyJwt(`${b64({alg:'none',typ:'JWT'})}.${p}.`),null,'unsigned tokens are refused');
 const hs512=`${b64({alg:'HS512',typ:'JWT'})}.${p}`;
 assert.equal(verifyJwt(`${hs512}.${createHmac('sha512','x').update(hs512).digest('base64url')}`),null,'only HS256 is accepted');
 assert.equal(verifyJwt(signJwt(claims(),'a-completely-different-secret-of-sufficient-length')),null,'other keys are refused');
 assert.equal(verifyJwt(signJwt(claims({exp:Math.floor(Date.now()/1000)-1}))),null,'expired');
 assert.equal(verifyJwt(signJwt(claims({aud:'someone-else'}))),null,'wrong audience');
 assert.equal(verifyJwt(signJwt(claims({iss:'someone-else'}))),null,'wrong issuer');
 assert.equal(verifyJwt('not.a.jwt'),null);
 assert.equal(verifyJwt('x'.repeat(5000)),null,'oversized tokens are ignored');
 // A previous key keeps working during a rotation.
 const old='an-old-secret-that-is-being-rotated-out-now';
 assert.ok(verifyJwt(signJwt(claims(),old),[process.env.JWT_SECRET??'unused-current-secret-xxxxxxxxxxxxxxxx',old]));
});

test('passwords that are easy to guess are refused where passwords are set',()=>{
 for(const weak of ['Password2026!','qwertyuiop12','123456789012','aaaaaaaaaaaaaaa'])assert.ok(passwordProblem(weak),weak);
 assert.match(passwordProblem('ange.uwera2026!',{email:'ange.uwera@example.org'}),/email/);
 for(const fine of ['purple-river-lamp-42','My dog eats rice at 7','Tiger&Moon#Kigali9'])assert.equal(passwordProblem(fine),'',fine);
});

test('sessions: JWT cookies, user binding, revocation on sign-out, account lockout and security headers',{skip:!database},async()=>{
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null,recoveryEnabled:false});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/api`;
 const call=async(path,{method='GET',body,cookie=''}={})=>{const r=await fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,headers:r.headers,data:await r.json().catch(()=>null)};};
 const password='Lantern-Harbour-71';
 async function person(){const id=randomUUID(),email=`${id}@example.test`;await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'JWT tester',$3,'member','approved',now())",[id,email,await hashPassword(password)]);return {id,email};}
 try{
  await db.query("DELETE FROM auth_limits");
  const alice=await person(),bob=await person();
  // A real sign-in sets an HttpOnly cookie holding a three-part JWT.
  const login=await call('/auth/login',{method:'POST',body:{email:alice.email,password}});
  assert.equal(login.status,200);
  const setCookie=login.headers.get('set-cookie');
  assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Lax/);
  const jwt=setCookie.match(/plp_session=([^;]+)/)[1];
  assert.equal(jwt.split('.').length,3);
  assert.equal(verifyJwt(jwt).sub,alice.id);
  const cookie=`plp_session=${jwt}`;
  assert.equal((await call('/me',{cookie})).data.id,alice.id);
  // The old cookie format (a bare session key) no longer works.
  const raw=sessionToken();await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(raw),bob.id]);
  assert.equal((await call('/me',{cookie:`plp_session=${raw}`})).status,401);
  // A token naming Alice cannot ride on Bob's session, and editing the token to claim Bob fails the signature.
  assert.equal((await call('/me',{cookie:`plp_session=${sessionJwt(alice.id,raw)}`})).status,401);
  assert.equal((await call('/me',{cookie:`plp_session=${sessionJwt(bob.id,raw)}`})).data.id,bob.id);
  const [h,p,s]=jwt.split('.');
  const claimsBob=b64({...JSON.parse(Buffer.from(p,'base64url')),sub:bob.id});
  assert.equal((await call('/me',{cookie:`plp_session=${h}.${claimsBob}.${s}`})).status,401);
  // Signing out ends the session at once, even though the token itself has not expired.
  assert.equal((await call('/auth/logout',{method:'POST',cookie})).status,200);
  assert.equal((await call('/me',{cookie})).status,401);
  // Ten wrong passwords lock the account for 15 minutes, even for the right password afterwards.
  for(let i=0;i<10;i++)assert.equal((await call('/auth/login',{method:'POST',body:{email:bob.email,password:'Wrong-Password-'+i}})).status,401);
  const locked=await call('/auth/login',{method:'POST',body:{email:bob.email,password}});
  assert.equal(locked.status,429);assert.match(locked.data.error,/Too many failed sign-in attempts/);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM audit_log WHERE action='auth.locked' AND entity_id=$1",[bob.id])).rows[0].n,1);
  // Weak passwords are refused at sign-up with a plain explanation.
  const weak=await call('/auth/register',{method:'POST',body:{name:'New Member',email:`${randomUUID()}@example.test`,password:'Password2026!'}});
  assert.equal(weak.status,400);assert.match(weak.data.error,/too common/);
  // Every API response carries protective headers.
  const headers=(await call('/healthz')).headers;
  assert.equal(headers.get('x-frame-options'),'DENY');
  assert.match(headers.get('content-security-policy'),/default-src 'none'/);
  assert.equal(headers.get('x-content-type-options'),'nosniff');
  assert.equal(headers.get('referrer-policy'),'no-referrer');
 }finally{await db.query("DELETE FROM auth_limits");await new Promise(r=>server.close(r));await db.end();}
});
