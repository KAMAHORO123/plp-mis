import { randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { hashPassword, verifyPassword, digest } from './auth.mjs';
import { transaction } from './db.mjs';
const fields = 'id,title,location,join_url,opens_at,closes_at,credits,closed,latitude,longitude,radius_m';
const inputSchema = z.object({
 title:z.string().trim().min(1).max(100), location:z.string().trim().max(200).default(''),
 join_url:z.string().max(1000).refine(v=>v==='' || /^https:\/\//.test(v) && URL.canParse(v)).default(''),
 latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),radius_m:z.number().int().min(30).max(300),
 opens_at:z.string().datetime(), closes_at:z.string().datetime(), credits:z.number().int().min(1).max(500),
 publish:z.boolean().default(false),
}).strict().refine(v=>new Date(v.closes_at)>new Date(v.opens_at),{message:'Attendance must close after it opens'});
function demand(ok,status,message){if(!ok)throw Object.assign(new Error(message),{status});}
const newCode = () => randomBytes(6).toString('hex').toUpperCase();
export async function meetingsRoute({p,req,db,user,body,send}) {
 if (p==='/public/meetings' && req.method==='GET') {
  send(200,(await db.query(`SELECT ${fields} FROM meetings WHERE closed=false AND closes_at>now() ORDER BY opens_at LIMIT 100`)).rows);return true;
 }
 const publicMatch=p.match(/^\/public\/meetings\/([^/]+)$/);
 if(publicMatch && req.method==='GET') {
  const id=z.string().uuid().parse(publicMatch[1]);
  const row=(await db.query(`SELECT ${fields} FROM meetings WHERE id=$1`,[id])).rows[0];
  demand(row,404,'Meeting not found');send(200,row);return true;
 }
 if(!p.startsWith('/meetings'))return false;
 demand(user,401,'Sign in to mark your attendance');
 if(p==='/meetings' && req.method==='GET') {
  demand(user.role==='admin',403,'Administrator required');
  send(200,(await db.query(`SELECT ${fields},(SELECT count(*)::int FROM meeting_checkins c WHERE c.meeting_id=meetings.id) AS attendees FROM meetings ORDER BY opens_at DESC LIMIT 100`)).rows);return true;
 }
 if(p==='/meetings' && req.method==='POST') {
  demand(user.role==='admin',403,'Administrator required');
  const input=inputSchema.parse(await body());
  demand(new Date(input.closes_at)>new Date(),400,'Choose a future attendance window');
  const id=randomUUID(),code=newCode(),hash=await hashPassword(code);
  const row=await transaction(db,async tx=>{
   const row=(await tx.query(`INSERT INTO meetings(id,title,location,join_url,opens_at,closes_at,credits,code_hash,created_by,latitude,longitude,radius_m) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING ${fields}`,[id,input.title,input.location,input.join_url,input.opens_at,input.closes_at,input.credits,hash,user.id,input.latitude,input.longitude,input.radius_m])).rows[0];
   if(input.publish) await tx.query("INSERT INTO content(key,data) VALUES('announcement',$1) ON CONFLICT(key) DO UPDATE SET data=$1,updated_at=now()",[{
    enabled:true,title:input.title,date:input.closes_at.slice(0,10),location:input.location,href:`/meetings/${id}`,linkLabel:'View meeting',
   }]);
   await tx.query("INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'meeting.create',$2)",[user.id,id]);
   return row;
  });
  send(201,{...row,code});return true;
 }
 const edit=p.match(/^\/meetings\/([^/]+)$/);
 // Meetings with check-ins hold attendance and credits, so only unattended ones can be deleted.
 if(edit && req.method==='DELETE') {
  demand(user.role==='admin',403,'Administrator required');
  const id=z.string().uuid().parse(edit[1]);
  await transaction(db,async tx=>{
   demand((await tx.query('SELECT 1 FROM meetings WHERE id=$1 FOR UPDATE',[id])).rowCount,404,'Meeting not found');
   demand(!(await tx.query('SELECT 1 FROM meeting_checkins WHERE meeting_id=$1 LIMIT 1',[id])).rowCount,409,'This meeting has check-ins, so it is kept for the attendance record.');
   await tx.query("DELETE FROM content WHERE key='announcement' AND data->>'href'=$1",[`/meetings/${id}`]);
   await tx.query('DELETE FROM meetings WHERE id=$1',[id]);
   await tx.query("INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'meeting.delete',$2)",[user.id,id]);
  });
  send(200,{deleted:true});return true;
 }
 if(edit && req.method==='PUT') {
  demand(user.role==='admin',403,'Administrator required');
  const id=z.string().uuid().parse(edit[1]),input=inputSchema.parse(await body());
  const row=await transaction(db,async tx=>{
   const previous=(await tx.query('SELECT * FROM meetings WHERE id=$1 FOR UPDATE',[id])).rows[0];
   demand(previous,404,'Meeting not found');
   demand(!previous.closed,400,'Create a new meeting after closing attendance');
   demand(new Date(input.closes_at)>new Date(),400,'Choose a future attendance window');
   const attended=(await tx.query('SELECT 1 FROM meeting_checkins WHERE meeting_id=$1 LIMIT 1',[id])).rowCount;
   demand(!attended || input.credits===previous.credits,400,'Credits cannot change after attendance has been recorded');
   const row=(await tx.query(`UPDATE meetings SET title=$2,location=$3,join_url=$4,opens_at=$5,closes_at=$6,credits=$7,latitude=$8,longitude=$9,radius_m=$10 WHERE id=$1 RETURNING ${fields}`,[id,input.title,input.location,input.join_url,input.opens_at,input.closes_at,input.credits,input.latitude,input.longitude,input.radius_m])).rows[0];
   await tx.query("UPDATE content SET data=data || $2::jsonb,updated_at=now() WHERE key='announcement' AND data->>'href'=$1",[`/meetings/${id}`,JSON.stringify({title:input.title,date:input.closes_at.slice(0,10),location:input.location})]);
   await tx.query("INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'meeting.edit',$2)",[user.id,id]);
   return row;
  });send(200,row);return true;
 }
 const match=p.match(/^\/meetings\/([^/]+)\/(check-in|manage|attendance)$/);
 if(!match)return false;
 const id=z.string().uuid().parse(match[1]),action=match[2];
 if(action==='attendance' && req.method==='GET') {
  demand(user.role==='admin',403,'Administrator required');
  send(200,(await db.query('SELECT u.name,u.email,u.role,c.checked_in_at,c.distance_m,c.accuracy_m FROM meeting_checkins c JOIN users u ON u.id=c.member_id WHERE c.meeting_id=$1 ORDER BY c.checked_in_at',[id])).rows);return true;
 }
 if(action==='manage' && req.method==='POST') {
  demand(user.role==='admin',403,'Administrator required');
  const input=z.object({action:z.enum(['close','rotate','publish'])}).strict().parse(await body());
  const code=input.action==='rotate'?newCode():null,hash=code?await hashPassword(code):null;
  const row=await transaction(db,async tx=>{
   const row=(await tx.query(`SELECT ${fields} FROM meetings WHERE id=$1 FOR UPDATE`,[id])).rows[0];
   demand(row,404,'Meeting not found');
   if(input.action==='close')await tx.query('UPDATE meetings SET closed=true WHERE id=$1',[id]);
   if(hash)await tx.query('UPDATE meetings SET code_hash=$2 WHERE id=$1',[id,hash]);
   if(input.action==='publish') {
    demand(!row.closed && new Date(row.closes_at)>new Date(),400,'This meeting has ended');
    await tx.query("INSERT INTO content(key,data) VALUES('announcement',$1) ON CONFLICT(key) DO UPDATE SET data=$1,updated_at=now()",[{enabled:true,title:row.title,date:new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Kigali'}).format(row.opens_at),location:row.location,href:`/meetings/${id}`,linkLabel:'View meeting'}]);
   }
   if(input.action==='close')await tx.query("UPDATE content SET data=jsonb_set(data,'{enabled}','false'),updated_at=now() WHERE key='announcement' AND data->>'href'=$1",[`/meetings/${id}`]);
   await tx.query('INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)',[user.id,`meeting.${input.action}`,id]);
   return row;
  });
  send(200,{...row,closed:input.action==='close'||row.closed,...(code?{code}:{})});return true;
 }
 if(action==='check-in' && req.method==='GET') {
  send(200,{checkedIn:!!(await db.query('SELECT 1 FROM meeting_checkins WHERE meeting_id=$1 AND member_id=$2',[id,user.id])).rowCount});return true;
 }
 if(action==='check-in' && req.method==='POST') {
  const {code,position}=z.object({code:z.string().trim().regex(/^[a-fA-F0-9]{12}$/).transform(v=>v.toUpperCase()),position:z.object({latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),accuracy:z.number().positive().max(10000),timestamp:z.number().positive()}).strict()}).strict().parse(await body());
  const key=digest(`meeting:${id}:${user.id}`);
  const limit=(await db.query("INSERT INTO auth_limits(key,count,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_limits.expires_at<now() THEN 1 ELSE auth_limits.count+1 END,expires_at=CASE WHEN auth_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE auth_limits.expires_at END RETURNING count",[key])).rows[0];
  demand(limit.count<=10,429,'Too many attempts. Try again in 15 minutes.');
  const result=await transaction(db,async tx=>{
   const meeting=(await tx.query('SELECT *,now() BETWEEN opens_at AND closes_at AS active FROM meetings WHERE id=$1 FOR UPDATE',[id])).rows[0];
   demand(meeting,404,'Meeting not found');
   if((await tx.query('SELECT 1 FROM meeting_checkins WHERE meeting_id=$1 AND member_id=$2',[id,user.id])).rowCount)return {alreadyCheckedIn:true,credits:meeting.credits};
   demand(!meeting.closed && meeting.active,400,'Attendance is not open for this meeting');
   demand(await verifyPassword(code,meeting.code_hash),400,'Incorrect attendance code. Ask your host for the current code.');
   demand(Date.now()-position.timestamp<=120000 && position.timestamp<=Date.now()+30000,400,'Refresh your location and try again');
   const distance=distanceMeters(meeting.latitude,meeting.longitude,position.latitude,position.longitude);
   demand(position.accuracy<=Math.min(100,meeting.radius_m),400,'Your location is not precise enough. Enable precise location and try again near the entrance.');
   demand(distance+position.accuracy<=meeting.radius_m,403,'You need to be at the meeting venue to mark attendance');
   await tx.query('INSERT INTO meeting_checkins(meeting_id,member_id,distance_m,accuracy_m) VALUES($1,$2,$3,$4)',[id,user.id,Math.round(distance),Math.ceil(position.accuracy)]);
   await tx.query('INSERT INTO credits(id,member_id,source,label,amount) VALUES($1,$2,$3,$4,$5) ON CONFLICT(member_id,source) DO NOTHING',[randomUUID(),user.id,`meeting:${id}`,meeting.title,meeting.credits]);
   await tx.query("INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'meeting.check-in',$2)",[user.id,id]);
   return {alreadyCheckedIn:false,credits:meeting.credits};
  });
  send(200,result);return true;
 }
 return false;
}

export function distanceMeters(lat1,lon1,lat2,lon2) {
 const radians=x=>x*Math.PI/180;
 const a=Math.sin(radians(lat2-lat1)/2)**2+Math.cos(radians(lat1))*Math.cos(radians(lat2))*Math.sin(radians(lon2-lon1)/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
}
