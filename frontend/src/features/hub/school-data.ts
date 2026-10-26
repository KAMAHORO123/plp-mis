export interface SchoolMember { id: string; schoolId: string; name: string; email: string; category: string; version?: number; }
/** Wording printed on a school certificate, drafted by the club leader and confirmed by an administrator. */
export interface CertificateWording { title: string; programme: string; citation: string; periodFrom?: string; periodTo?: string }
export interface CertificateRequest extends CertificateWording { id: string; schoolId: string; createdBy: string; completed: string; evidence: string; members: { id: string; name: string; email: string; role?: string }[]; status: 'Submitted' | 'Returned' | 'Issued'; note: string; submitted: string; requestedAt?: string; correctedAt?: string; issued?: string; approvedBy?: string; }
export interface SchoolRecords { members: SchoolMember[]; requests: CertificateRequest[]; }
export interface School { id: string; name: string; district: string }
/** Schools from the platform; filled in place by the store's sync so existing imports stay current. */
export const demoSchools: School[] = [];
export function seedSchoolRecords(): SchoolRecords {
 return { members: [], requests: [] };
}
