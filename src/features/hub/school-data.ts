export interface SchoolMember { id: string; schoolId: string; name: string; email: string; category: string; }
export interface CertificateRequest { id: string; schoolId: string; createdBy: string; programme: string; completed: string; evidence: string; members: { id: string; name: string; email: string }[]; status: 'Submitted' | 'Returned' | 'Issued'; note: string; submitted: string; requestedAt?: string; correctedAt?: string; issued?: string; approvedBy?: string; }
export interface SchoolRecords { members: SchoolMember[]; requests: CertificateRequest[]; }
export const demoSchools = [{id:'school-kigali',name:'Kigali Secondary School (demo)',district:'Kigali'}, {id:'school-huye',name:'Huye Secondary School (demo)',district:'Huye'}];
export const demoAccounts = [
 {id:'preview-member',name:'Aline Member',email:'member@demo.plp.test',role:'Community member' as const,schoolId:'school-kigali'},
 {id:'preview-coordinator',name:'Diane Coordinator',email:'coordinator@demo.plp.test',role:'School coordinator' as const,schoolId:'school-kigali'},
 {id:'preview-trainer',name:'Eric Trainer',email:'trainer@demo.plp.test',role:'Trainer' as const,schoolId:undefined},
 {id:'preview-admin',name:'Alex Administrator',email:'admin@demo.plp.test',role:'Administrator' as const,schoolId:undefined},
];
export function seedSchoolRecords(): SchoolRecords {
 const members = ['Aline Member','Jean Mugisha','Grace Uwase','Patrick Keza','Diane Umutesi','Eric Niyonzima'].map((name,i)=>({id:`school-member-${i}`,schoolId:'school-kigali',name,email:i===0?'member@demo.plp.test':`student${i}@demo.plp.test`,category:'High school'}));
 return {members,requests:[{id:'PLP-DEMO-WELCOME',schoolId:'school-kigali',createdBy:'preview-coordinator',programme:'Youth Leadership Foundations',completed:'2026-09-20',evidence:'Demo: attendance recorded and leadership projects completed for this group.',members:members.slice(0,3).map(({id,name,email})=>({id,name,email})),status:'Submitted',note:'',submitted:'2026-09-21'}]};
}
