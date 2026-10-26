import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {connectDatabase} from '../src/db.mjs';
import {createServer} from '../src/server.mjs';
import {digest,sessionToken,sessionJwt} from "../src/auth.mjs";
import {withoutAnswers,assessmentsOf} from '../src/assessments.mjs';
const database=process.env.TEST_DATABASE_URL;
if(database){if(!new URL(database).pathname.endsWith('_test'))throw Error('Dedicated test DB required');process.env.DATABASE_URL=database;}
const q=(id,answer=0)=>({id,prompt:`Question ${id}?`,options:['Right','Wrong','Also wrong'],answer});
const course={title:'Assessed course',description:'Timed checks',published:true,lessons:[{title:'Module one',content:'Reading',quiz:[q('m1'),q('m2')],quiz_minutes:3}],exam:[q('e1'),q('e2'),q('e3')],exam_minutes:5,pass_mark:70,max_attempts:3,assignment:'Explain how you will apply this course in your club.'};
const words='I will apply this learning in my club by planning one listening circle each month and recording what members suggest so that we improve together. '.repeat(3);
test('answers are removed for learners and assessments derive from course data',()=>{
 const safe=withoutAnswers(course);assert.equal(safe.lessons[0].quiz[0].answer,undefined);assert.equal(safe.exam[0].answer,undefined);
 assert.deepEqual(assessmentsOf(course).map(a=>[a.id,a.minutes,a.passMark]),[['module-0',3,80],['final',5,70]]);
});
test('timed assessments are enforced by the server and complete the course',{skip:!database},async()=>{
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(path,method='GET',body,cookie='')=>{const r=await fetch(base+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 async function account(role){const id=randomUUID(),token=sessionToken();await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Assessment tester','unused',$3,'approved',now())",[id,`${id}@example.test`,role]);await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),id]);return {id,cookie:`plp_session=${sessionJwt(id,token)}`};}
 try{
  const admin=await account('admin');
  const trainer=await account('trainer');
  const created=await call('/records/courses','POST',{...course,published:false,review_state:'submitted'},trainer.cookie);assert.equal(created.status,201,JSON.stringify(created.data));
  const courseId=created.data.id;
  assert.equal((await call(`/records/courses/${courseId}`,'PUT',{version:1,data:{...course,review_state:'approved'}},admin.cookie)).status,200);
  const enrol=async()=>{const m=await account('member');await call('/enrollments','POST',{course_id:courseId},m.cookie);const e=(await call('/enrollments','GET',undefined,m.cookie)).data.find(x=>x.course_id===courseId);return {...m,e:e.id};};
  const learner=await enrol();
  const seen=await call(`/records/courses/${courseId}`,'GET',undefined,learner.cookie);
  assert.equal(seen.data.data.exam[0].answer,undefined);assert.equal(seen.data.data.lessons[0].quiz[0].answer,undefined);
  assert.equal((await call(`/enrollments/${learner.e}/progress`,'POST',{lesson:0},learner.cookie)).status,409);
  assert.equal((await call(`/enrollments/${learner.e}/assessments/module-0/start`,'POST',{},learner.cookie)).status,409,'quiz needs the reading first');
  await call(`/enrollments/${learner.e}/viewed`,'POST',{lesson:0},learner.cookie);
  const quiz=await call(`/enrollments/${learner.e}/assessments/module-0/start`,'POST',{},learner.cookie);
  assert.equal(quiz.status,201);assert.equal(quiz.data.questions[0].answer,undefined);
  assert.equal((await call(`/enrollments/${learner.e}/assessments/final/start`,'POST',{},learner.cookie)).status,409,'one open attempt at a time');
  assert.equal((await call(`/assessment-attempts/${quiz.data.id}`,'PUT',{answers:{m1:0}},learner.cookie)).data.saved,true);
  const graded=await call(`/assessment-attempts/${quiz.data.id}/submit`,'POST',{answers:{m2:0}},learner.cookie);
  assert.equal(graded.data.submitted.percent,100);assert.equal(graded.data.submitted.passed,true);
  assert.equal((await call(`/enrollments/${learner.e}/assessments/final/start`,'POST',{},learner.cookie)).status,409,'assignment first');
  assert.equal((await call(`/enrollments/${learner.e}/progress`,'POST',{assignment:'Too short'},learner.cookie)).status,400);
  assert.equal((await call(`/enrollments/${learner.e}/progress`,'POST',{assignment:words},learner.cookie)).status,200);
  // A late submission is graded only on answers saved before the deadline.
  const late=await call(`/enrollments/${learner.e}/assessments/final/start`,'POST',{},learner.cookie);
  await db.query("UPDATE assessment_attempts SET ends_at=now()-interval '1 minute' WHERE id=$1",[late.data.id]);
  const lateResult=await call(`/assessment-attempts/${late.data.id}/submit`,'POST',{answers:{e1:0,e2:0,e3:0}},learner.cookie);
  assert.equal(lateResult.data.submitted.reason,'time');assert.equal(lateResult.data.submitted.percent,0);assert.equal(lateResult.data.submitted.results,undefined,'exam answers are not revealed');
  for(let i=0;i<2;i++){const a=await call(`/enrollments/${learner.e}/assessments/final/start`,'POST',{},learner.cookie);await call(`/assessment-attempts/${a.data.id}/submit`,'POST',{answers:{e1:1}},learner.cookie);}
  assert.equal((await call(`/enrollments/${learner.e}/assessments/final/start`,'POST',{},learner.cookie)).status,429);
  // Expired open attempts are graded when the learner returns.
  const other=await enrol();
  await call(`/enrollments/${other.e}/viewed`,'POST',{lesson:0},other.cookie);
  const abandoned=await call(`/enrollments/${other.e}/assessments/module-0/start`,'POST',{},other.cookie);
  await call(`/assessment-attempts/${abandoned.data.id}`,'PUT',{answers:{m1:0,m2:0}},other.cookie);
  await db.query("UPDATE assessment_attempts SET ends_at=now()-interval '1 minute' WHERE id=$1",[abandoned.data.id]);
  const back=await call(`/enrollments/${other.e}/assessments`,'GET',undefined,other.cookie);
  assert.equal(back.data.active,null);assert.equal(back.data.attempts[0].reason,'time');assert.equal(back.data.attempts[0].passed,true);
  await call(`/enrollments/${other.e}/progress`,'POST',{assignment:words},other.cookie);
  const exam=await call(`/enrollments/${other.e}/assessments/final/start`,'POST',{},other.cookie);
  const done=await call(`/assessment-attempts/${exam.data.id}/submit`,'POST',{answers:{e1:0,e2:0,e3:0}},other.cookie);
  assert.equal(done.data.submitted.passed,true);
  const finished=(await call('/enrollments','GET',undefined,other.cookie)).data.find(x=>x.id===other.e);
  assert.ok(finished.completed_at);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM certificates WHERE member_id=$1 AND course_id=$2',[other.id,courseId])).rows[0].n,1);
  const stats=(await call('/teaching/enrollments','GET',undefined,admin.cookie)).data.find(x=>x.id===other.e);
  assert.equal(stats.exam_best,100);assert.equal(stats.quizzes_passed,1);
 }finally{await new Promise(r=>server.close(r));await db.end();}
});
test('administrators create, approve and delete accounts; accounts with history are kept',{skip:!database},async()=>{
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(path,method='GET',body,cookie='')=>{const r=await fetch(base+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 try{
  const id=randomUUID(),token=sessionToken();await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Admin tester','unused','admin','approved',now())",[id,`${id}@example.test`]);await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),id]);
  const cookie=`plp_session=${sessionJwt(id,token)}`,email=`${randomUUID()}@example.test`;
  const made=await call('/users','POST',{name:'New Trainer',email,role:'trainer'},cookie);assert.equal(made.status,201);
  assert.equal((await call('/users','POST',{name:'Again',email,role:'member'},cookie)).status,409);
  const row=(await db.query('SELECT status,role,email_verified_at FROM users WHERE id=$1',[made.data.id])).rows[0];assert.equal(row.status,'approved');assert.equal(row.role,'trainer');assert.ok(row.email_verified_at);
  assert.equal((await call(`/users/${id}`,'DELETE',undefined,cookie)).status,409,'cannot delete self');
  assert.equal((await call(`/users/${made.data.id}`,'DELETE',undefined,cookie)).status,200);
  assert.equal((await db.query('SELECT 1 FROM users WHERE id=$1',[made.data.id])).rowCount,0);
 }finally{await new Promise(r=>server.close(r));await db.end();}
});
test('members set and clear their own profile picture; others can view it',{skip:!database},async()=>{
 const {mkdtemp}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const pathMod=await import('node:path');
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null,uploadDirectory:await mkdtemp(pathMod.join(tmpdir(),'plp-avatars-'))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/api`;
 async function account(){const id=randomUUID(),token=sessionToken();await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Avatar tester','unused','mentor','approved',now())",[id,`${id}@example.test`]);await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),id]);return {id,cookie:`plp_session=${sessionJwt(id,token)}`};}
 const png=Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000','hex');
 const upload=async(who,bytes)=>(await fetch(base+'/files',{method:'POST',headers:{Origin:origin,Cookie:who.cookie,'x-file-name':'me.png'},body:bytes})).json();
 const setAvatar=async(who,file_id)=>(await fetch(base+'/me/avatar',{method:'PUT',headers:{Origin:origin,Cookie:who.cookie,'Content-Type':'application/json'},body:JSON.stringify({file_id})})).status;
 try{
  const a=await account(),b=await account();
  const mine=await upload(a,png),theirs=await upload(b,png),pdf=await upload(a,Buffer.from('%PDF-1.4 test'));
  assert.equal(await setAvatar(a,theirs.id),400,"cannot use another member's upload");
  assert.equal(await setAvatar(a,pdf.id),400,'must be an image');
  assert.equal(await setAvatar(a,mine.id),200);
  const view=await fetch(`${base}/avatars/${a.id}`,{headers:{Cookie:b.cookie}});
  assert.equal(view.status,200);assert.equal(view.headers.get('content-type'),'image/png');
  assert.equal((await fetch(`${base}/avatars/${a.id}`)).status,401,'sign-in required');
  const listed=(await (await fetch(base+'/mentors',{headers:{Cookie:b.cookie}})).json()).find(m=>m.id===a.id);
  assert.match(listed.avatar,new RegExp(`/api/avatars/${a.id}`));
  assert.equal(await setAvatar(a,null),200);
  assert.equal((await fetch(`${base}/avatars/${a.id}`,{headers:{Cookie:b.cookie}})).status,404);
  assert.equal((await db.query('SELECT 1 FROM files WHERE id=$1',[mine.id])).rowCount,0,'replaced picture is removed');
 }finally{await new Promise(r=>server.close(r));await db.end();}
});
test('opportunities are shared records with external links and one application per member',{skip:!database},async()=>{
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/api`;
 const call=async(path,method,body,cookie)=>{const r=await fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 async function account(role){const id=randomUUID(),token=sessionToken();await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Opportunity tester','unused',$3,'approved',now())",[id,`${id}@example.test`,role]);await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),id]);return {id,cookie:`plp_session=${sessionJwt(id,token)}`};}
 try{
  const admin=await account('admin'),member=await account('member');
  const deadline=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  const base_={title:'Scholars program',description:'Full scholarship',organization:'Foundation',location:'Africa',deadline,eligibility:'Young Africans',opportunity_type:'Scholarship',format:'Hybrid',published:true};
  assert.equal((await call('/records/opportunities','POST',{...base_,apply_mode:'external'},admin.cookie)).status,400);
  assert.equal((await call('/records/opportunities','POST',base_,member.cookie)).status,403);
  const ext=await call('/records/opportunities','POST',{...base_,apply_mode:'external',url:'https://example.org/apply'},admin.cookie);assert.equal(ext.status,201);
  const hidden=await call('/records/opportunities','POST',{...base_,title:'Draft role',published:false},admin.cookie);
  const seen=(await call('/records/opportunities','GET',undefined,member.cookie)).data.map(r=>r.id);
  assert.ok(seen.includes(ext.data.id));assert.ok(!seen.includes(hidden.data.id));
  const apply={title:'Scholars program',reference_id:ext.data.id,description:'Applied on example.org',external:true};
  assert.equal((await call('/records/applications','POST',apply,member.cookie)).status,201);
  assert.equal((await call('/records/applications','POST',apply,member.cookie)).status,409);
  assert.equal((await call('/records/applications','POST',{...apply,reference_id:hidden.data.id},member.cookie)).status,404);
  assert.equal((await call(`/records/opportunities/${ext.data.id}`,'DELETE',undefined,admin.cookie)).status,409);
  assert.equal((await call(`/records/opportunities/${hidden.data.id}`,'DELETE',undefined,admin.cookie)).status,200);
  assert.ok((await call('/records/applications','GET',undefined,admin.cookie)).data.some(a=>a.data.reference_id===ext.data.id));
 }finally{await new Promise(r=>server.close(r));await db.end();}
});
test('trainers upload lesson videos that enrolled members can stream with byte ranges',{skip:!database},async()=>{
 const {mkdtemp}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const pathMod=await import('node:path');
 const db=connectDatabase(),origin='http://localhost:5173',server=createServer({db,origin,secure:false,google:null,uploadDirectory:await mkdtemp(pathMod.join(tmpdir(),'plp-videos-'))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/api`;
 async function account(role){const id=randomUUID(),token=sessionToken();await db.query("INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,'Video tester','unused',$3,'approved',now())",[id,`${id}@example.test`,role]);await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[digest(token),id]);return {id,cookie:`plp_session=${sessionJwt(id,token)}`};}
 const mp4=Buffer.concat([Buffer.from([0,0,0,0x18]),Buffer.from('ftypmp42'),Buffer.alloc(4000,7)]);
 const upload=(who,bytes)=>fetch(base+'/files',{method:'POST',headers:{Origin:origin,Cookie:who.cookie,'x-file-name':'lesson.mp4'},body:bytes});
 const json=(path,method,body,cookie)=>fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});
 try{
  const trainer=await account('trainer'),admin=await account('admin'),member=await account('member'),outsider=await account('member');
  assert.equal((await upload(member,mp4)).status,403,'members cannot upload videos');
  const video=await (await upload(trainer,mp4)).json();assert.equal(video.mime,'video/mp4');
  const q=(id)=>({id,prompt:`Question ${id}?`,options:['Right','Wrong'],answer:0});
  const course={title:'Video course',description:'With a lesson video',published:false,review_state:'submitted',lessons:[{title:'Watch first',content:'Watch the video.',video:{kind:'file',file_id:video.id,name:'lesson.mp4'},quiz:[q('a')]},{title:'YouTube',content:'Watch this too.',video:{kind:'youtube',youtube_id:'dQw4w9WgXcQ'},quiz:[q('b')]}],assignment:'Reflect on what the two videos taught you.',exam:[q('e1'),q('e2'),q('e3')]};
  assert.equal((await json('/records/courses','POST',{...course,lessons:[{...course.lessons[1],video:{kind:'youtube',youtube_id:'not-valid'}}]},trainer.cookie)).status,400);
  const created=await (await json('/records/courses','POST',course,trainer.cookie)).json();
  assert.equal((await fetch(`${base}/files/${video.id}`,{headers:{Cookie:outsider.cookie}})).status,404,'unpublished course video is private');
  const stored=await (await json(`/records/courses/${created.id}`,'GET',undefined,admin.cookie)).json();
  assert.ok(stored.data.attachments.includes(video.id));
  assert.equal((await json(`/records/courses/${created.id}`,'PUT',{version:stored.version,data:{...stored.data,published:true,review_state:'approved'}},admin.cookie)).status,200);
  const ranged=await fetch(`${base}/files/${video.id}`,{headers:{Cookie:member.cookie,Range:'bytes=0-99'}});
  assert.equal(ranged.status,206);assert.equal(ranged.headers.get('content-range'),`bytes 0-99/${mp4.length}`);assert.equal((await ranged.arrayBuffer()).byteLength,100);
  assert.equal((await fetch(`${base}/files/${video.id}`,{headers:{Cookie:member.cookie}})).headers.get('content-type'),'video/mp4');
 }finally{await new Promise(r=>server.close(r));await db.end();}
});
