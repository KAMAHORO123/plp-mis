import { RecordTable } from "./management-ui";
import { translateUi, useSiteLanguage } from '../../i18n/language';
import { RecordActions, deleteRecords } from './record-actions';
import { downloadCertificatePDF, certificateFileName, schoolCertificateDesign } from './certificate-pdf';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Award } from 'lucide-react';
import { toast } from 'sonner';
import { useHub, uid } from './store';
import { platformApi } from './platform-api';
import { saveRecord, resyncSchoolData } from './platform-records';
import { demoSchools, type CertificateRequest } from './school-data';
import { Heading, Panel, Field, Empty } from './ui';
import { FormModal } from './modal';
import './workspaces.css';
const schoolName = (id?: string) => demoSchools.find(s => s.id === id)?.name ?? 'School not assigned';
function useRecords() {
    const hub = useHub();
    const admin = hub.profile.role === 'Administrator';
    const coordinator = hub.profile.role === 'Club leader';
    const requests = hub.state.schoolRecords.requests.filter(r => admin || (coordinator ? r.schoolId === hub.profile.schoolId : r.members.some(m => m.email.toLowerCase() === hub.profile.email.toLowerCase())));
    const members = hub.state.schoolRecords.members.filter(m => admin || m.schoolId === hub.profile.schoolId);
    return { ...hub, admin, coordinator, requests, members };
}
export function SchoolMembersPage() {
    useSiteLanguage();
    const { profile, admin, members, state } = useRecords();
    const [school, setSchool] = useState(profile.schoolId ?? demoSchools[0]?.id ?? '');
    const [adding, setAdding] = useState<'one' | 'group' | null>(null);
    const visible = (admin ? state.schoolRecords.members.filter(m => m.schoolId === school) : members);
    const schoolId = admin ? school : profile.schoolId;
    return <div className="ws-page"><Heading eyebrow="SCHOOL COMMUNITY" title={translateUi("Every member matters.")} description={translateUi("Keep your school register in one place. Students do not need an account to receive a certificate.")}/>
 {translateUi(admin && <Field label={translateUi("School")}><select value={school} onChange={e => setSchool(e.target.value)}>{translateUi(demoSchools.map(s => <option key={s.id} value={s.id}>{translateUi(s.name)}</option>))}</select></Field>)}
 {translateUi(adding === 'one' && <FormModal title={translateUi("Add a school member")} description={translateUi("Students do not need an account to receive a certificate.")} onClose={() => setAdding(null)}><form className="hub-form" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); const name = String(f.get('name')).trim(), email = String(f.get('email')).trim().toLowerCase(); if (!schoolId || !name)
        return; if (email && state.schoolRecords.members.some(m => m.email === email)) {
        toast.error(translateUi('This email is already in the member register.'));
        return;
    } saveRecord('members', { title: name, ...(email ? { email } : {}), category: 'High school', school_id: schoolId }).then(() => { setAdding(null); toast.success(translateUi('School member added')); }).catch(err => toast.error(translateUi((err as Error).message))); }}><Field label={translateUi("Student full name")}><input name="name" required minLength={2} maxLength={100} pattern=".*\S.*"/></Field><Field label={translateUi("Student email (optional)")}><input name="email" type="email" maxLength={254}/></Field><div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setAdding(null)}>{translateUi("Cancel")}</button><button className="hub-button">{translateUi("Add member")}</button></div></form></FormModal>)}
 {translateUi(adding === 'group' && <FormModal title={translateUi("Add a group")} description={translateUi("Paste one student per line: name | email. Email is optional.")} onClose={() => setAdding(null)}><form className="hub-form" onSubmit={e => {
                e.preventDefault();
                const form = e.currentTarget;
                const rows = String(new FormData(form).get('rows')).split('\n').filter(x => x.trim()).map(line => { const [name, email = ''] = line.split('|').map(x => x.trim()); return { id: uid(), schoolId: schoolId!, name, email: email.toLowerCase(), category: 'High school' }; });
                if (!schoolId || !rows.length)
                    return;
                if (rows.length > 200) {
                    toast.error(translateUi('Add up to 200 members at a time.'));
                    return;
                }
                // Point to the exact line that needs fixing.
                const problem = rows.map((r, i) => !r.name || r.name.length < 2 ? `Line ${i + 1}: enter the member's full name.` : r.name.length > 100 ? `Line ${i + 1}: the name is longer than 100 characters.` : r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) ? `Line ${i + 1}: "${r.email}" is not a valid email.` : r.email && state.schoolRecords.members.some(m => m.email === r.email) ? `Line ${i + 1}: ${r.email} is already in the register.` : r.email && rows.slice(0, i).some(m => m.email === r.email) ? `Line ${i + 1}: ${r.email} appears twice in this list.` : '').find(Boolean);
                if (problem) {
                    toast.error(translateUi(problem));
                    return;
                }
                void (async () => { try {
                    for (const r of rows)
                        await platformApi('/records/members', 'POST', { title: r.name, ...(r.email ? { email: r.email } : {}), category: r.category, school_id: schoolId });
                    resyncSchoolData();
                    setAdding(null);
                    toast.success(translateUi("{p0} members added", { p0: translateUi(rows.length) }));
                }
                catch (err) {
                    resyncSchoolData();
                    toast.error(translateUi((err as Error).message));
                } })();
            }}><Field label={translateUi("Group member list")}><textarea name="rows" rows={5} required placeholder={translateUi('Student full name | student email\nAnother student name')}/></Field><div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setAdding(null)}>{translateUi("Cancel")}</button><button className="hub-button">{translateUi("Add group")}</button></div></form></FormModal>)}
 <Panel><div className="ws-panel-title"><h2>{translateUi(schoolName(schoolId))} <span className="ws-count">{translateUi(visible.length)}{translateUi(" members")}</span></h2><div className="hub-actions"><button className="hub-button secondary" disabled={!schoolId} onClick={() => setAdding('group')}>{translateUi("Add a group")}</button><button className="hub-button" disabled={!schoolId} onClick={() => setAdding('one')}>{translateUi("Add member")}</button></div></div><div className="ws-table-wrap"><RecordTable title="school members" rows={visible} searchText={m => `${m.name} ${m.email} ${m.category}`} bulkActions={[{ label: 'Delete', tone: 'danger', run: (rows) => deleteRecords(state, 'member', rows.map(m => m.id)) }]} filters={[{ label: 'Category', options: [...new Set(visible.map(m => m.category))].map(c => ({ label: c, test: (m: typeof visible[number]) => m.category === c })) }]} csv={{ name: 'plp-school-register', columns: [['Name', m => m.name], ['Email', m => m.email], ['Category', m => m.category], ['School', () => schoolName(schoolId)]] }} columns={[{ label: translateUi('Name'), render: m => <>{translateUi(m.name)}</> }, { label: translateUi('Email'), render: m => <>{translateUi(m.email || 'No email needed')}</> }, { label: translateUi('Category'), render: m => <>{translateUi(m.category)}</> }, { label: translateUi('Actions'), render: m => <><RecordActions kind="member" id={m.id}/></> }]}/></div>{translateUi(!visible.length && <Empty>{translateUi("No members match this view.")}</Empty>)}</Panel></div>;
}
export async function downloadCertificates(request: CertificateRequest, recipients = request.members) {
    try {
        // Issued certificates on the platform verify at /verify/<id>; older local batches keep their local check link.
        // Each issued certificate carries its own wording; the request supplies it for older ones.
        const issued = await platformApi<{
            id: string;
            school_member_id: string;
            issued_at: string;
            title: string | null;
            programme: string;
            citation: string | null;
            role: string | null;
            period_from: string | null;
            period_to: string | null;
        }[]>(`/certificate-requests/${request.id}/certificates`).catch(() => []);
        const certFor = (memberId: string) => issued.find(c => c.school_member_id === memberId);
        await downloadCertificatePDF(recipients.map(member => {
            const c = certFor(member.id);
            return schoolCertificateDesign({
                id: c?.id ?? `${request.id}/${member.id}`, recipient: member.name, school: schoolName(request.schoolId),
                issued: c?.issued_at.slice(0, 10) ?? request.issued ?? request.completed,
                title: c?.title ?? request.title, programme: c?.programme ?? request.programme, citation: c?.citation ?? request.citation, role: c?.role ?? member.role,
                periodFrom: c?.period_from ?? request.periodFrom, periodTo: c?.period_to ?? request.periodTo,
                // Older local batches keep their local check link.
                verificationUrl: c ? undefined : `${window.location.origin}/certificate-check/${encodeURIComponent(request.id)}/${encodeURIComponent(member.id)}`,
            });
        }), recipients.length === 1
            ? certificateFileName(recipients[0].name, certFor(recipients[0].id)?.title ?? request.title)
            : certificateFileName(schoolName(request.schoolId), request.title, `${recipients.length} certificates`));
    }
    catch {
        toast.error(translateUi('Could not generate the PDF. Please try again.'));
    }
}
/** Old QR links (request + register member). The server resolves them, so anyone scanning one lands on the public verification page. */
export function CertificateCheckPage() { useSiteLanguage(); const { requestId, memberId } = useParams(); const [found, setFound] = useState<string | null | undefined>(undefined); useEffect(() => { platformApi<{ id: string }>(`/public/certificates/school/${encodeURIComponent(requestId ?? '')}/${encodeURIComponent(memberId ?? '')}`).then(r => setFound(r.id)).catch(() => setFound(null)); }, [requestId, memberId]); if (found) return <Navigate to={`/verify/${found}`} replace/>; return <div className="hub-section hub-narrow"><Panel><Award size={40}/><Heading title={translateUi(found === undefined ? 'Checking certificate…' : 'Certificate not found')} description={translateUi("PLP certificate verification")}/>{found === null && <p>{translateUi("No issued certificate matches this link.")}</p>}<Link className="hub-text-link" to="/">{translateUi("PLP website")}</Link></Panel></div>; }
export { HelpChat } from './faq-chat';
