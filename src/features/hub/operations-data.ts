export interface HubFile { name:string; type:string; data:string; size:number }
export interface LearningMaterial { id:string; title:string; file:HubFile; schoolIds:string[]; createdAt:string }
export interface MaterialCompletion { materialId:string; schoolId:string; by:string; completedAt:string }
export interface CommunityActivity { id:string; hostId:string; title:string; date:string; description:string; type?:'Meeting'|'Volunteering'|'Challenge'|'Recruitment'; hours?:number; photos:HubFile[]; authorId:string; report?:string; reportedAt?:string; reviewedAt?:string; attendees:string[] }
export interface CommunityRequest { id:string; memberId:string; hostId:string; activityId?:string; status:'Pending'|'Approved'|'Declined'; createdAt:string }
export interface Operations { materials:LearningMaterial[]; completions:MaterialCompletion[]; activities:CommunityActivity[]; requests:CommunityRequest[] }
export const emptyOperations = ():Operations => ({materials:[],completions:[],activities:[],requests:[]});
export async function readUpload(file:File, imagesOnly=false):Promise<HubFile> {
 const allowed=imagesOnly?['image/png','image/jpeg','image/webp']:['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg'];
 if(!file.size || file.size>1500000 || !allowed.includes(file.type))throw new Error(imagesOnly?'Use a JPG, PNG or WebP image up to 1.5 MB.':'Use a PDF, DOC, DOCX, PNG or JPG file up to 1.5 MB.');
 const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Could not read file.'));reader.readAsDataURL(file);});
 return {name:file.name,type:file.type,data,size:file.size};
}
