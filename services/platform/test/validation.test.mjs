import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRecord,validatePublishable,kigaliToday} from '../src/validation.mjs';
const soon=new Date(Date.now()+7*864e5).toISOString().slice(0,10);
const event={title:'Tree planting',date:soon,description:'Plant trees around the school.',activity_type:'Volunteering',hours:3};
const rejects=(fn,pattern)=>assert.throws(fn,(e)=>e.status===400&&pattern.test(e.message));
test('activities need a real date, details and sensible hours',()=>{
 assert.doesNotThrow(()=>validateRecord('events',event));
 rejects(()=>validateRecord('events',{...event,date:'2026-02-30'}),/not a real date/);
 rejects(()=>validateRecord('events',{...event,date:'2026-13-01'}),/not a real date/);
 rejects(()=>validateRecord('events',{...event,date:undefined}),/date is required/);
 rejects(()=>validateRecord('events',{...event,date:'2099-01-01'}),/two years/);
 rejects(()=>validateRecord('events',{...event,hours:0}),/between 0.5 and 24/);
 rejects(()=>validateRecord('events',{...event,hours:25}),/between 0.5 and 24/);
 rejects(()=>validateRecord('events',{...event,hours:1.3}),/half hours/);
 rejects(()=>validateRecord('events',{...event,title:'  '}),/title is required/);
 rejects(()=>validateRecord('events',{...event,description:'Short'}),/at least 10/);
 // Editing only checks what changed, so an older record with short details can still be updated.
 const old={...event,description:'Old'};
 assert.doesNotThrow(()=>validateRecord('events',{...old,title:'Tree planting day'},old));
});
test('opportunities cannot open with a deadline in the past',()=>{
 const opp={title:'Scholarship',description:'A full scholarship for youth leaders.'};
 rejects(()=>validateRecord('opportunities',{...opp,deadline:'2020-01-01'}),/cannot be in the past/);
 assert.doesNotThrow(()=>validateRecord('opportunities',{...opp,deadline:kigaliToday()}));
 // An existing opportunity whose deadline has passed can still be edited without moving the deadline.
 const closed={...opp,deadline:'2021-05-05'};
 assert.doesNotThrow(()=>validateRecord('opportunities',{...closed,title:'Scholarship 2021'},closed));
});
test('ALX certificates need a programme and exactly one file',()=>{
 rejects(()=>validateRecord('proofs',{title:'AI',attachments:['x']}),/ALX programme/);
 rejects(()=>validateRecord('proofs',{title:'AI',category:'alx-ai',attachments:[]}),/exactly one/);
 assert.doesNotThrow(()=>validateRecord('proofs',{title:'AI',category:'alx-ai',attachments:['x']}));
});
test('a course is publishable only when learners can complete it',()=>{
 const q={id:'a',prompt:'Why?',options:['A','B'],answer:0};
 const course={title:'Peace',description:'Learn peace.',lessons:[{title:'One',content:'Read this.',quiz:[q]}],assignment:'Write five words or more here.',exam:[q,q,q]};
 assert.doesNotThrow(()=>validatePublishable(course));
 rejects(()=>validatePublishable({...course,exam:[q]}),/final exam/);
 rejects(()=>validatePublishable({...course,lessons:[{title:'One',content:'Read this.'}]}),/knowledge check/);
 rejects(()=>validatePublishable({...course,assignment:''}),/assignment/);
});
