import { translateUi, useSiteLanguage } from '../../i18n/language';
import { Award, Clock3, Users } from 'lucide-react';
import { useLiveTick } from './live';
import { MonthlyActivity } from './dashboard-insights';
import { useEffect, useState, type FormEvent } from 'react';
import { platformApi } from './platform-api';
import { resyncSchoolData } from './platform-records';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useHub } from './store';
import { Heading, Panel, Field, Empty, Stats, Tag } from './ui';
import { RecordTable, usePaged, Pager } from './management-ui';
import { FormModal } from './modal';
import { downloadCertificates } from './workspaces';
import { hostName } from './school-operations';
import type { CertificateRequest } from './school-data';
import { DEFAULT_CITATION, schoolCertificateDesign, issuedCertificateDesign, type IssuedCertificate } from './certificate-pdf';
import { CertificateCard } from './certificate-card';
const label = (r: CertificateRequest) => r.status === 'Issued' ? 'Issued' : r.status === 'Returned' ? 'Correction required' : r.correctedAt ? 'Corrected' : 'Awaiting approval';
const pending = (r: CertificateRequest) => r.status === 'Submitted';
export function MembershipCertificatesPage() {
    useSiteLanguage();
    const { profile } = useHub();
    // Members see only certificates issued to them; school request batches belong to club leaders and administrators.
    return profile.role === 'Administrator' || profile.role === 'Club leader' ? <CertificateRequestsPage /> : <MyCertificatesPage />;
}
// Certificate wording: drafted by the club leader, checked and finalised by the administrator who approves it.
const TITLES = ['Certificate of Membership', 'Certificate of Leadership', 'Certificate of Appreciation', 'Certificate of Service', 'Certificate of Achievement'];
type Draft = {
    title: string;
    programme: string;
    citation: string;
    periodFrom: string;
    periodTo: string;
    roles: Record<string, string>;
};
const draftOf = (r?: CertificateRequest): Draft => ({ title: r?.title || TITLES[0], programme: r?.programme || 'Service as a PLP member', citation: r?.citation || DEFAULT_CITATION, periodFrom: r?.periodFrom ?? '', periodTo: r?.periodTo ?? '', roles: Object.fromEntries((r?.members ?? []).filter(m => m.role).map(m => [m.id, m.role!])) });
const wordingPayload = (d: Draft, ids: string[]) => ({ title: d.title.trim(), programme: d.programme.trim(), citation: d.citation.trim(), period_from: d.periodFrom || null, period_to: d.periodTo || null, roles: Object.fromEntries(Object.entries(d.roles).filter(([id, v]) => v.trim() && ids.includes(id)).map(([id, v]) => [id, v.trim()])) });
const draftProblem = (d: Draft) => d.title.trim().length < 3 ? 'Give the certificate a title.' : d.programme.trim().length < 3 ? 'Say what the certificate is for.' : /[<>]/.test(`${d.title}${d.programme}${d.citation}${Object.values(d.roles).join('')}`) ? 'Use plain text without < or >.' : d.periodFrom && d.periodTo && d.periodFrom > d.periodTo ? 'The term must end after it starts.' : '';
const todayISO = () => new Date().toISOString().slice(0, 10);
function WordingFields({ draft, set }: {
    draft: Draft;
    set: (d: Draft) => void;
}) {
    useSiteLanguage();
    return <div className="cw-fields">
  <Field label={translateUi("Certificate title")}><input list="cw-titles" value={draft.title} onChange={e => set({ ...draft, title: e.target.value })} required minLength={3} maxLength={60}/><datalist id="cw-titles">{translateUi(TITLES.map(t => <option key={t} value={t}/>))}</datalist></Field>
  <Field label={translateUi("Awarded for")}><input value={draft.programme} onChange={e => set({ ...draft, programme: e.target.value })} required minLength={3} maxLength={100} placeholder={translateUi("e.g. Peace Club Leadership 2026")}/></Field>
  <Field label={translateUi("Citation ({p0}/300)", { p0: translateUi(draft.citation.length) })}><textarea value={draft.citation} onChange={e => set({ ...draft, citation: e.target.value })} maxLength={300} rows={3}/></Field>
  <div className="ws-form-grid"><Field label={translateUi("Term starts (optional)")}><input type="date" value={draft.periodFrom} max={draft.periodTo || todayISO()} onChange={e => set({ ...draft, periodFrom: e.target.value })}/></Field><Field label={translateUi("Term ends (optional)")}><input type="date" value={draft.periodTo} min={draft.periodFrom || undefined} onChange={e => set({ ...draft, periodTo: e.target.value })}/></Field></div>
 </div>;
}
/** How the certificate will read, using the first recipient: the same card members see once it is issued. */
function CertificatePreview({ draft, name, role, school, issued }: {
    draft: Draft;
    name: string;
    role?: string;
    school: string;
    issued?: {
        id: string;
        date: string;
    };
}) {
    useSiteLanguage();
    // A sample for the whole batch, so no QR: each issued certificate carries its own.
    return <CertificateCard actions={false} pending qrNote={issued ? 'Each certificate has its own QR code' : undefined} design={schoolCertificateDesign({ id: issued?.id ?? 'preview', recipient: name || 'Member name', issued: issued?.date ?? new Date().toISOString().slice(0, 10), school, title: draft.title, programme: draft.programme, citation: draft.citation, role, periodFrom: draft.periodFrom || null, periodTo: draft.periodTo || null })}/>;
}
function CertificateRequestsPage() {
    useSiteLanguage();
    const { state, profile } = useHub();
    const admin = profile.role === 'Administrator', leader = profile.role === 'Club leader';
    const [composing, setComposing] = useState<null | {
        editing?: CertificateRequest;
    }>(null), [selected, setSelected] = useState<string[]>([]), [draft, setDraft] = useState<Draft>(draftOf());
    const [detail, setDetail] = useState(''), [review, setReview] = useState<Draft>(draftOf()), [note, setNote] = useState(''), [busy, setBusy] = useState(false);
    const requests = state.schoolRecords.requests.filter(r => admin || leader && r.schoolId === profile.schoolId);
    const waiting = requests.filter(pending);
    // A member can hold one membership certificate and be in one open request at a time.
    const taken = new Set(requests.filter(r => r.status !== 'Returned').flatMap(r => r.members.map(m => m.id)));
    const register = state.schoolRecords.members.filter(m => m.schoolId === profile.schoolId);
    const available = register.filter(m => !taken.has(m.id) || composing?.editing?.members.some(x => x.id === m.id));
    const record = requests.find(r => r.id === detail);
    // Long lists show a page at a time so popups never need scrolling.
    const pagedAvailable = usePaged(available, 6), pagedMembers = usePaged(record?.members ?? [], 6);
    const startCompose = (editing?: CertificateRequest) => { setComposing({ editing }); setSelected(editing ? editing.members.map(m => m.id) : []); setDraft(draftOf(editing)); };
    const openDetail = (r: CertificateRequest) => { setDetail(r.id); setReview(draftOf(r)); setNote(''); };
    async function submit(e: FormEvent) { e.preventDefault(); if (!selected.length || !profile.schoolId)
        return toast.error(translateUi('Select at least one member.')); const problem = draftProblem(draft); if (problem)
        return toast.error(translateUi(problem)); setBusy(true); try {
        const body = wordingPayload(draft, selected);
        if (composing?.editing)
            await platformApi(`/certificate-requests/${composing.editing.id}`, 'PUT', { member_ids: selected, ...body });
        else
            await platformApi('/certificate-requests', 'POST', { school_id: profile.schoolId, member_ids: selected, ...body });
        resyncSchoolData();
        toast.success(translateUi(composing?.editing ? 'Corrected request sent for approval' : 'Request sent. PLP will review it and issue the certificates.'));
        setComposing(null);
    }
    catch (err) {
        toast.error(translateUi((err as Error).message));
    }
    finally {
        setBusy(false);
    } }
    async function decide(decision: 'issued' | 'returned') { if (!record || !admin)
        return; if (decision === 'returned' && !note.trim())
        return toast.error(translateUi('Explain what needs correcting.')); if (decision === 'issued') {
        const problem = draftProblem(review);
        if (problem)
            return toast.error(translateUi(problem));
    } setBusy(true); try {
        await platformApi(`/certificate-requests/${record.id}/review`, 'POST', decision === 'issued' ? { decision, note: note.trim(), ...wordingPayload(review, record.members.map(m => m.id)) } : { decision, note: note.trim() });
        resyncSchoolData();
        setDetail('');
        toast.success(translateUi(decision === 'issued' ? `${record.members.length} certificate${record.members.length === 1 ? '' : 's'} issued` : 'Request returned for correction'));
    }
    catch (err) {
        toast.error(translateUi((err as Error).message));
    }
    finally {
        setBusy(false);
    } }
    const school = (id: string) => hostName(id);
    return <div className="ws-page cc-center-page"><Heading title={translateUi(admin ? 'School certificates' : 'Membership certificates')} description={translateUi(admin ? 'Approve certificate requests from club leaders. You can adjust the wording before issuing, and every certificate can be verified online.' : 'Request certificates for members of your school register, with your own wording. PLP approves them, then they are ready to download.')} action={leader && profile.schoolId ? <button className="hub-button" onClick={() => startCompose()}>{translateUi("Request certificates")}</button> : undefined}/>
 {translateUi(admin && waiting.length > 0 && <div className="act-review-callout" role="status"><Award size={20}/><div><strong>{translateUi(waiting.length)}{translateUi(" certificate request")}{translateUi(waiting.length === 1 ? ' is' : 's are')}{translateUi(" waiting for your approval")}</strong><p>{translateUi("Check the names and wording, adjust anything that needs it, then issue.")}</p></div><button className="hub-button" onClick={() => openDetail(waiting[0])}>{translateUi("Review the first")}</button></div>)}
 <Stats items={[{ label: 'Awaiting approval', value: waiting.length, icon: Clock3 }, { label: 'Certificates issued', value: requests.filter(r => r.status === 'Issued').reduce((n, r) => n + r.members.length, 0), icon: Award }, { label: admin ? 'Schools requesting' : 'Members not yet certified', value: admin ? new Set(requests.map(r => r.schoolId)).size : register.filter(m => !taken.has(m.id)).length, icon: Users }]}/>
 <MonthlyActivity records={requests.map(r => ({ date: r.submitted, completed: r.status === 'Issued' }))} title={translateUi("Certificate requests and approvals")} primary="Requests" secondary="Approved"/>
 {translateUi(leader && composing && <FormModal title={translateUi(composing.editing ? 'Correct the request' : 'Request membership certificates')} description={translateUi("Choose the members, write the wording, and check the preview. PLP approves the request before certificates are issued.")} onClose={() => setComposing(null)} wide><form className="hub-form" onSubmit={e => void submit(e)}>
  {translateUi(composing.editing?.note && <p className="hub-feedback"><strong>{translateUi("PLP asked for a correction:")}</strong> {translateUi(composing.editing.note)}</p>)}
  {translateUi(available.length ? <fieldset className="ws-recipient-list cw-recipients"><legend>{translateUi("Members (")}{translateUi(selected.length)}{translateUi(" selected)")}</legend><button type="button" className="hub-text-button" onClick={() => setSelected(selected.length === available.length ? [] : available.map(m => m.id))}>{translateUi(selected.length === available.length ? 'Clear selection' : 'Select all')}</button>{translateUi(pagedAvailable.items.map(m => <div className="cw-recipient" key={m.id}><label><input type="checkbox" checked={selected.includes(m.id)} onChange={e => setSelected(e.target.checked ? [...selected, m.id] : selected.filter(id => id !== m.id))}/>{translateUi(m.name)}</label>{translateUi(selected.includes(m.id) && <input aria-label={translateUi("Role for {p0} (optional)", { p0: translateUi(m.name) })} placeholder={translateUi("Role (optional), e.g. Club President")} maxLength={60} value={draft.roles[m.id] ?? ''} onChange={e => setDraft({ ...draft, roles: { ...draft.roles, [m.id]: e.target.value } })}/>)}</div>))}<Pager {...pagedAvailable}/></fieldset> : <p className="pv-empty">{translateUi("Every member of your register already has a certificate or is in a request waiting for approval.")}</p>)}
  <WordingFields draft={draft} set={setDraft}/>
  <CertificatePreview draft={draft} name={register.find(m => m.id === selected[0])?.name ?? ''} role={selected[0] ? draft.roles[selected[0]] : ''} school={profile.schoolId ? school(profile.schoolId) : ''}/>
  <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setComposing(null)}>{translateUi("Cancel")}</button><button className="hub-button" disabled={busy || !selected.length}>{translateUi(busy ? 'Sending…' : composing.editing ? 'Send corrected request' : `Request ${selected.length || ''} certificate${selected.length === 1 ? '' : 's'}`)}</button></div>
 </form></FormModal>)}
 <Panel><RecordTable title={translateUi("certificate requests")} rows={requests.slice().sort((a, b) => Number(pending(b)) - Number(pending(a)) || (b.requestedAt ?? b.submitted).localeCompare(a.requestedAt ?? a.submitted))} searchText={r => `${r.id} ${school(r.schoolId)} ${r.title} ${r.programme} ${r.members.map(m => m.name).join(' ')} ${label(r)}`} columns={[{ label: 'Certificate', render: r => <><strong>{translateUi(r.title)}</strong><small>{translateUi(r.programme)}</small></> }, { label: 'School', render: r => school(r.schoolId) }, { label: 'Members', render: r => r.members.length }, { label: 'Requested', render: r => r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : r.submitted }, { label: 'Status', render: r => <Tag>{translateUi(label(r))}</Tag> } ]}/></Panel>
 {translateUi(record && <FormModal title={translateUi(admin && pending(record) ? 'Review certificate request' : record.title)} description={translateUi("{p0} \u00B7 {p1} member{p2} \u00B7 {p3}", { p0: translateUi(school(record.schoolId)), p1: translateUi(record.members.length), p2: translateUi(record.members.length === 1 ? '' : 's'), p3: translateUi(label(record)) })} onClose={() => setDetail('')} wide>
  {translateUi(record.note && <p className="hub-feedback">{translateUi(record.note)}</p>)}
  {translateUi(admin && pending(record) ? <div className="hub-form">
   <WordingFields draft={review} set={setReview}/>
   <fieldset className="ws-recipient-list cw-recipients"><legend>{translateUi("Recipients and roles (")}{translateUi(record.members.length)}{translateUi(")")}</legend>{translateUi(pagedMembers.items.map(m => <div className="cw-recipient" key={m.id}><span>{translateUi(m.name)}</span><input aria-label={translateUi("Role for {p0} (optional)", { p0: translateUi(m.name) })} placeholder={translateUi("Role (optional)")} maxLength={60} value={review.roles[m.id] ?? ''} onChange={e => setReview({ ...review, roles: { ...review.roles, [m.id]: e.target.value } })}/></div>))}<Pager {...pagedMembers}/></fieldset>
   <CertificatePreview draft={review} name={record.members[0]?.name ?? ''} role={record.members[0] ? review.roles[record.members[0].id] : ''} school={school(record.schoolId)}/>
   <Field label={translateUi("Note for the club leader (required when returning)")}><textarea value={note} onChange={e => setNote(e.target.value)} maxLength={1000}/></Field>
   <div className="hub-actions hub-dialog-actions"><button className="hub-button danger" disabled={busy} onClick={() => void decide('returned')}>{translateUi("Return for correction")}</button><button className="hub-button" disabled={busy} onClick={() => void decide('issued')}>{translateUi(busy ? 'Issuing…' : 'Approve & issue')}</button></div>
  </div> : <>
   <CertificatePreview draft={draftOf(record)} name={record.members[0]?.name ?? ''} role={record.members[0]?.role} school={school(record.schoolId)} issued={record.status === 'Issued' ? { id: record.id, date: record.issued ?? record.submitted } : undefined}/>
   <ul className="cw-list">{translateUi(pagedMembers.items.map(m => <li key={m.id}><span>{translateUi(m.name)}{translateUi(m.role && <small>{translateUi(" \u00B7 ")}{translateUi(m.role)}</small>)}</span>{translateUi(record.status === 'Issued' && <div className="hub-actions"><button className="hub-text-button" onClick={() => void downloadCertificates(record, [m])}>{translateUi("Download")}</button><Link to={`/certificate-check/${record.id}/${m.id}`}>{translateUi("Verify")}</Link></div>)}</li>))}</ul><Pager {...pagedMembers}/>
   <div className="hub-actions hub-dialog-actions">{translateUi(leader && record.status === 'Returned' && <button className="hub-button" onClick={() => { setDetail(''); startCompose(record); }}>{translateUi("Correct the request")}</button>)}{translateUi(record.status === 'Issued' && <button className="hub-button" onClick={() => void downloadCertificates(record)}>{translateUi("Download all (PDF)")}</button>)}</div>
  </>)}
 </FormModal>)}
 {translateUi(leader && !profile.schoolId && <Empty>{translateUi("A school assignment is required.")}</Empty>)}</div>;
}
type IssuedRow = IssuedCertificate & {
    revoked_at: string | null;
};
function MyCertificatesPage() {
    useSiteLanguage();
    const { state, profile } = useHub();
    const [issued, setIssued] = useState<IssuedRow[]>([]), [loaded, setLoaded] = useState(false);
    const live = useLiveTick();
    useEffect(() => { let active = true; platformApi<IssuedRow[]>('/certificates').then(rows => { if (active)
        setIssued(rows.filter(r => r.kind === 'school')); }).catch(() => { }).finally(() => { if (active)
        setLoaded(true); }); return () => { active = false; }; }, [live]);
    const email = profile.email.toLowerCase();
    const local = issued.length ? [] : state.schoolRecords.requests.filter(r => r.status === 'Issued').flatMap(r => r.members.filter(m => m.email && m.email.toLowerCase() === email).map(m => ({ request: r, member: m })));
    const total = issued.length + local.length;
    return <div className="ws-page"><Heading eyebrow="MY ACHIEVEMENTS" title={translateUi("My school certificates")} description={translateUi("Certificates issued to you for your service as a PLP member. Only your own certificates appear here.")}/>
  {translateUi(!loaded ? <p role="status">{translateUi("Loading your certificates\u2026")}</p> : !total ? <Empty><Award size={32}/><h2>{translateUi("No school certificate yet")}</h2><p>{translateUi("When your club leader requests a membership certificate for you and PLP approves it, it appears here for you to download.")}</p></Empty> :
            <div className="cc-grid">
   {translateUi(issued.map(c => <CertificateCard key={c.id} design={issuedCertificateDesign(c)} revoked={!!c.revoked_at}/>))}
   {translateUi(local.map(({ request, member }) => <CertificateCard key={`${request.id}-${member.id}`} design={schoolCertificateDesign({ id: `${request.id}/${member.id}`, recipient: member.name, issued: request.issued ?? request.submitted, school: hostName(request.schoolId), title: request.title, programme: request.programme, citation: request.citation, role: member.role, periodFrom: request.periodFrom, periodTo: request.periodTo, verificationUrl: `${window.location.origin}/certificate-check/${encodeURIComponent(request.id)}/${encodeURIComponent(member.id)}` })}/>))}
  </div>)}
 </div>;
}
