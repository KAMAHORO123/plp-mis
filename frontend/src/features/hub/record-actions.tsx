import { useState } from 'react';
import { FilePenLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirmAction } from '@/components/shared/confirm-dialog';
import { useHub, type HubState } from './store';
import { Field } from './ui';
import { FormModal } from './modal';
import { demoSchools } from './school-data';
import { uploadFile } from './platform-api';
import { deleteRecord, readRecord, saveRecord } from './platform-records';
import { TypeInput, activityDateRange } from './school-operations';

type Kind = 'activity' | 'material' | 'member';
const labels: Record<Kind, string> = { activity: 'activity', material: 'material', member: 'member' };
const serverKind = { activity: 'events', material: 'materials', member: 'members' } as const;

// Edits and deletes are saved on the platform, which re-checks permissions and linked records.
export function RecordActions({ kind, id }: { kind: Kind | string; id: string }) {
 const { state, profile } = useHub();
 const [editing, setEditing] = useState(false);
 const [busy, setBusy] = useState(false);
 if (!(kind in labels)) return null;
 const k = kind as Kind;
 const admin = profile.role === 'Administrator';
 const label = labels[k];
 const find = (s: HubState) => k === 'activity' ? s.operations.activities.find(r => r.id === id) : k === 'material' ? s.operations.materials.find(r => r.id === id) : s.schoolRecords.members.find(r => r.id === id);
 const record = find(state);
 const allowed = !!record && (admin || (k !== 'material' && profile.role === 'Club leader' && !!profile.schoolId && (('schoolId' in record && record.schoolId === profile.schoolId) || ('hostId' in record && record.hostId === profile.schoolId))));
 if (!record || !allowed) return null;
 const blocked = () => {
  if (k === 'activity') { const a = state.operations.activities.find(r => r.id === id); if (a?.report || a?.attendees.length) return 'Activities with reports or attendance must be retained.'; }
  if (k === 'material' && state.operations.completions.some(r => r.materialId === id)) return 'Materials with completion records must be retained.';
  if (k === 'member' && (state.schoolRecords.requests.some(r => r.members.some(m => m.id === id)) || state.operations.activities.some(r => r.attendees.includes(id)))) return 'Members linked to certificate requests or attendance must be retained.';
  return '';
 };
 const remove = async () => {
  const reason = blocked();
  if (reason) return toast.error(reason);
  if (!await confirmAction({ title: `Delete this ${label}?`, description: 'This permanently removes the record and cannot be undone.', confirmLabel: 'Delete', destructive: true })) return;
  try { await deleteRecord(serverKind[k], id); toast.success(`${label[0].toUpperCase() + label.slice(1)} deleted`); } catch (e) { toast.error((e as Error).message); }
 };
 const value = (key: string) => String((record as unknown as Record<string, unknown>)[key] ?? '');
 const fields = k === 'activity' ? ['title','date','description','hours'] : k === 'material' ? ['title'] : ['name','email','category'];
 return <div>
  <div className="hub-actions">
   <button type="button" className="hub-record-icon hub-record-edit" aria-label={`Edit ${label}`} title={`Update ${label}`} aria-expanded={editing} onClick={() => setEditing(!editing)}><FilePenLine size={18} strokeWidth={1.5} aria-hidden="true"/></button>
   <button type="button" className="hub-record-icon hub-record-delete" aria-label={`Delete ${label}`} title={`Delete ${label}`} onClick={() => void remove()}><Trash2 size={18} strokeWidth={1.5} aria-hidden="true"/></button>
  </div>
  {editing && <FormModal title={`Edit ${label}`} onClose={() => setEditing(false)}><form className="hub-form" aria-label={`Edit ${label}`} onSubmit={async e => {
   e.preventDefault();
   const f = new FormData(e.currentTarget);
   const str = (key: string) => String(f.get(key) ?? '').trim();
   if (fields.some(key => key !== 'email' && !str(key))) return toast.error('Complete all required fields.');
   setBusy(true);
   try {
    const stored = await readRecord<Record<string, unknown>>(serverKind[k], id);
    const data: Record<string, unknown> = { ...stored.data };
    if (k === 'member') { const email = str('email').toLowerCase(); if (email && state.schoolRecords.members.some(m => m.id !== id && m.email.toLowerCase() === email)) throw new Error('This email is already in the member register.'); Object.assign(data, { title: str('name'), email: email || undefined, category: str('category') }); if (!email) delete data.email; }
    if (k === 'activity') Object.assign(data, { title: str('title'), date: str('date'), description: str('description'), hours: Number(f.get('hours')), activity_type: str('activityType') });
    if (k === 'material') {
     const file = f.get('replacement') as File | null;
     Object.assign(data, { title: str('title'), school_ids: f.getAll('schools').map(String) });
     if (file?.size) { data.attachments = [await uploadFile(file)]; data.description = file.name; }
    }
    await saveRecord(serverKind[k], data, { id, version: stored.version });
    setEditing(false); toast.success(`${label[0].toUpperCase() + label.slice(1)} updated`);
   } catch (error) { toast.error((error as Error).message); } finally { setBusy(false); }
  }}>
   {fields.map(key => <Field key={key} label={`${label[0].toUpperCase() + label.slice(1)} ${key}`}>
    {key === 'description' ? <textarea name={key} required defaultValue={value(key)} minLength={10} maxLength={2000}/> : <input name={key} defaultValue={value(key)} required={key !== 'email'} type={key === 'email' ? 'email' : key === 'date' ? 'date' : key === 'hours' ? 'number' : 'text'} {...(key === 'hours' ? { min: 0.5, max: 24, step: 0.5 } : key === 'date' ? activityDateRange() : key === 'email' ? { maxLength: 254 } : { minLength: key === 'title' ? 3 : 2, maxLength: key === 'category' ? 60 : 120, pattern: '.*\\S.*' })}/>}
   </Field>)}
   {k === 'activity' && <Field label="Activity type"><TypeInput defaultValue={value('type') || 'Meeting'}/></Field>}
   {k === 'material' && <>
    <Field label="Replacement material file"><input name="replacement" type="file" accept=".pdf,.png,.jpg,.jpeg"/></Field>
    <fieldset><legend>Schools (leave unchecked for all schools)</legend>{demoSchools.map(({id: school, name}) => <label className="hub-check" key={school}><input type="checkbox" name="schools" value={school} defaultChecked={'schoolIds' in record && record.schoolIds.includes(school)}/>{name}</label>)}</fieldset>
   </>}
   <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" disabled={busy} onClick={() => setEditing(false)}>Cancel</button><button className="hub-button" disabled={busy}>Save {label}</button></div>
  </form></FormModal>}
 </div>;
}
