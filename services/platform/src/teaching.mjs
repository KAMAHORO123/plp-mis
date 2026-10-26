import {z} from 'zod';
import {transaction} from './db.mjs';
const demand=(ok,status,message)=>{if(!ok)throw Object.assign(new Error(message),{status});};
export async function teachingRoute({p,req,db,user,body,send}){
 if(!p.startsWith('/teaching/'))return false;
 demand(['trainer','admin'].includes(user.role),403,'Approved trainer access required');
 const owner=user.role==='admin'?null:user.id;
 if(p==='/teaching/courses'&&req.method==='GET'){
  send(200,(await db.query("SELECT r.*,u.name AS trainer_name,(SELECT count(*)::int FROM enrollments e WHERE e.course_id=r.id) AS learners,(SELECT count(*)::int FROM enrollments e WHERE e.course_id=r.id AND e.assignment<>'' AND e.reviewed_at IS NULL) AS pending_reviews,(SELECT count(*)::int FROM enrollments e WHERE e.course_id=r.id AND e.completed_at IS NOT NULL) AS completions,(SELECT round(avg(best))::int FROM (SELECT max(a.percent) AS best FROM assessment_attempts a JOIN enrollments e ON e.id=a.enrollment_id WHERE e.course_id=r.id AND a.assessment_id='final' AND a.submitted_at IS NOT NULL GROUP BY e.id) x) AS avg_exam FROM records r JOIN users u ON u.id=r.owner_id WHERE r.kind='courses' AND ($1::uuid IS NULL OR r.owner_id=$1) ORDER BY r.updated_at DESC",[owner])).rows);return true;
 }
 if(p==='/teaching/enrollments'&&req.method==='GET'){
  send(200,(await db.query("SELECT e.*,u.name AS learner_name,u.email AS learner_email,r.data->>'title' AS course_title,(SELECT max(a.percent) FROM assessment_attempts a WHERE a.enrollment_id=e.id AND a.assessment_id='final' AND a.submitted_at IS NOT NULL) AS exam_best,(SELECT count(*)::int FROM assessment_attempts a WHERE a.enrollment_id=e.id AND a.submitted_at IS NOT NULL) AS attempts,(SELECT count(DISTINCT a.assessment_id)::int FROM assessment_attempts a WHERE a.enrollment_id=e.id AND a.passed AND a.assessment_id LIKE 'module-%') AS quizzes_passed FROM enrollments e JOIN records r ON r.id=e.course_id JOIN users u ON u.id=e.member_id WHERE r.kind='courses' AND ($1::uuid IS NULL OR r.owner_id=$1) ORDER BY e.completed_at DESC NULLS LAST",[owner])).rows);return true;
 }
 const match=p.match(/^\/teaching\/enrollments\/([^/]+)\/review$/);
 if(match&&req.method==='POST'){
  const id=z.string().uuid().parse(match[1]),{feedback}=z.object({feedback:z.string().trim().min(1).max(5000)}).strict().parse(await body());
  await transaction(db,async tx=>{
   const row=(await tx.query("SELECT e.id,e.assignment,r.owner_id FROM enrollments e JOIN records r ON r.id=e.course_id WHERE e.id=$1 FOR UPDATE OF e",[id])).rows[0];
   demand(row && (!owner||row.owner_id===owner),404,'Learner submission not found');demand(row.assignment,400,'No assignment has been submitted');
   await tx.query('UPDATE enrollments SET review_feedback=$1,reviewed_by=$2,reviewed_at=now() WHERE id=$3',[feedback,user.id,id]);
   await tx.query("INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'assignment.review',$2)",[user.id,id]);
  });send(200,{ok:true});return true;
 }
 return false;
}
