import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, ImagePlus, PencilLine, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirmAction } from '@/components/shared/confirm-dialog';
import { FileInput, Select } from '@/components/shared/form-controls';
import { platformApi, uploadFile } from './platform-api';
import { FormModal } from './modal';
import { Field, Panel } from './ui';
import { builtInSlides, type HeroSlide } from './hero-slides';
import './hero-slides-editor.css';

const LIMIT = 8;
const blankSlide: HeroSlide = { image: '', position: 'center 50%', name: '', title: '', text: '', cta: '', to: '/' };
const FOCUS = [['center 20%', 'Top'], ['center 35%', 'Upper middle'], ['center 50%', 'Middle'], ['center 65%', 'Lower middle'], ['center 80%', 'Bottom']] as const;
const safeLink = (v: string) => (/^\/(?!\/)/.test(v) || /^https:\/\//.test(v)) && !/[\\\s]/.test(v);
/** In the Hub, uploads are read through the signed-in files API, so unsaved photos preview too. */
const previewImage = (image: string) => image.startsWith('/') ? image : `/api/files/${image}`;

/** One slide as it looks on the homepage: the photo, a gold name, a light-blue line, a sentence and a button. */
function SlidePreview({ slide, large = false }: { slide: HeroSlide; large?: boolean }) {
    return <div className={`hse-preview${large ? ' is-large' : ''}`}>
      {slide.image ? <img src={previewImage(slide.image)} alt="" style={{ objectPosition: slide.position }}/> : <span className="hse-empty"><ImagePlus size={large ? 36 : 24}/>{translateUi('No photo yet')}</span>}
      <div className="hse-copy">
        <strong><span>{slide.name || translateUi('Name')}</span><br/>{slide.title || translateUi('Headline')}</strong>
        {large && slide.text && <p>{slide.text}</p>}
        <em>{slide.cta || translateUi('Button')}<ArrowRight size={large ? 14 : 11}/></em>
      </div>
    </div>;
}

/** Administrators edit the homepage slideshow (photos and words); each save is live on the website. */
export function HeroSlidesEditor() {
    useSiteLanguage();
    const [slides, setSlides] = useState<HeroSlide[]>(builtInSlides);
    const [custom, setCustom] = useState(false);
    const [editing, setEditing] = useState<{ index: number; value: HeroSlide } | null>(null);
    const [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false);
    useEffect(() => {
        platformApi<{ slides: HeroSlide[] }>('/public/hero-slides').then(v => { if (v.slides?.length) { setSlides(v.slides); setCustom(true); } }).catch(() => { });
    }, []);

    async function publish(next: HeroSlide[], message: string) {
        setBusy(true);
        try {
            const saved = await platformApi<{ slides: HeroSlide[] }>('/hero-slides', 'PUT', { slides: next });
            setSlides(saved.slides); setCustom(true); setEditing(null);
            window.dispatchEvent(new Event('plp:hero-slides-updated'));
            toast.success(translateUi(message));
        }
        catch (e) { toast.error(translateUi((e as Error).message)); }
        finally { setBusy(false); }
    }
    function move(index: number, step: number) {
        const next = [...slides];
        [next[index], next[index + step]] = [next[index + step], next[index]];
        void publish(next, 'Slide order saved');
    }
    async function remove(index: number) {
        if (slides.length === 1) return toast.error(translateUi('Keep at least one slide on the homepage.'));
        if (!await confirmAction({ title: translateUi('Delete this slide?'), description: translateUi('It is removed from the homepage straight away.'), confirmLabel: translateUi('Delete'), destructive: true })) return;
        await publish(slides.filter((_, i) => i !== index), 'The slide was deleted');
    }
    async function restore() {
        if (!await confirmAction({ title: translateUi('Restore the original slideshow?'), description: translateUi('Your slides are replaced by the ones PLP started with.'), confirmLabel: translateUi('Restore') })) return;
        try {
            await platformApi('/hero-slides', 'DELETE');
            setSlides(builtInSlides); setCustom(false);
            window.dispatchEvent(new Event('plp:hero-slides-updated'));
            toast.success(translateUi('The original slideshow is back on the website'));
        }
        catch (e) { toast.error(translateUi((e as Error).message)); }
    }
    function save(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) return;
        const v = editing.value;
        if (!v.image) return toast.error(translateUi('Upload a photo for this slide.'));
        const to = v.to.trim();
        if (!safeLink(to)) return toast.error(translateUi('The button link must be a site path like /about or a link starting with https://'));
        const clean = { ...v, name: v.name.trim(), title: v.title.trim(), text: v.text.trim(), cta: v.cta.trim(), to };
        const next = editing.index < 0 ? [...slides, clean] : slides.map((s, i) => i === editing.index ? clean : s);
        void publish(next, editing.index < 0 ? 'Slide added to the homepage' : 'Slide updated on the homepage');
    }
    const change = (patch: Partial<HeroSlide>) => setEditing(d => d && { ...d, value: { ...d.value, ...patch } });

    return <Panel>
 <div className="ws-panel-title"><div><h2>{translateUi('Homepage slideshow')} <span className={`ws-status ${custom ? 'ws-status-issued' : 'ws-status-returned'}`}>{translateUi(custom ? 'Custom' : 'Original')}</span></h2><p className="hub-caption">{translateUi('The large photos at the top of the website’s home page. Change any photo or its words; saving updates the website straight away.')}</p></div>
  <div className="hub-actions">{custom && <button type="button" className="hub-button secondary" disabled={busy} onClick={restore}><RotateCcw size={16}/>{translateUi('Restore original')}</button>}<button type="button" className="hub-button" disabled={busy || slides.length >= LIMIT} onClick={() => setEditing({ index: -1, value: blankSlide })}><Plus size={16}/>{translateUi('Add slide')}</button></div></div>
 <ol className="hse-list">{slides.map((s, i) => <li key={`${i}-${s.image}`}>
   <SlidePreview slide={s}/>
   <div className="hse-meta"><span className="hse-no">{String(i + 1).padStart(2, '0')}</span><div><strong>{s.name} · {s.title}</strong><small>{s.cta} → {s.to}</small></div></div>
   <div className="hse-actions">
    <button type="button" className="hub-button secondary" disabled={busy} onClick={() => setEditing({ index: i, value: s })}><PencilLine size={15}/>{translateUi('Edit')}</button>
    <button type="button" className="hse-icon" disabled={busy || i === 0} aria-label={translateUi('Move slide {p0} earlier', { p0: i + 1 })} onClick={() => move(i, -1)}><ArrowUp size={16}/></button>
    <button type="button" className="hse-icon" disabled={busy || i === slides.length - 1} aria-label={translateUi('Move slide {p0} later', { p0: i + 1 })} onClick={() => move(i, 1)}><ArrowDown size={16}/></button>
    <button type="button" className="hse-icon is-danger" disabled={busy} aria-label={translateUi('Delete slide {p0}', { p0: i + 1 })} onClick={() => remove(i)}><Trash2 size={16}/></button>
   </div>
  </li>)}</ol>
 {editing && <FormModal wide title={translateUi(editing.index < 0 ? 'Add a slide' : 'Edit slide')} description={translateUi('Saving updates the homepage straight away.')} onClose={() => { if (!busy && !uploading) setEditing(null); }}><form className="hub-form" onSubmit={save}>
  <h3>{translateUi('Preview')}</h3>
  <SlidePreview slide={editing.value} large/>
  <Field label={translateUi('Photo (PNG or JPEG, a wide photo at least 1600 pixels across looks sharpest)')}><FileInput accept="image/png,image/jpeg" disabled={uploading} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { change({ image: await uploadFile(file) }); toast.success(translateUi('Photo uploaded. Save to publish it.')); } catch (err) { toast.error(translateUi((err as Error).message)); } finally { setUploading(false); } }}/></Field>
  <Field label={translateUi('Part of the photo to show')}><Select value={FOCUS.some(([v]) => v === editing.value.position) ? editing.value.position : ''} onChange={e => change({ position: e.target.value })}>{!FOCUS.some(([v]) => v === editing.value.position) && <option value="">{translateUi('As it is now')}</option>}{FOCUS.map(([v, label]) => <option key={v} value={v}>{translateUi(label)}</option>)}</Select></Field>
  <div className="ws-form-grid">
   <Field label={translateUi('Name (gold)')}><input required maxLength={40} value={editing.value.name} placeholder="PLP Hub" onChange={e => change({ name: e.target.value })}/></Field>
   <Field label={translateUi('Headline (light blue)')}><input required maxLength={60} value={editing.value.title} placeholder={translateUi('Learn and lead.')} onChange={e => change({ title: e.target.value })}/></Field>
  </div>
  <Field label={translateUi('Sentence')}><textarea maxLength={200} rows={2} value={editing.value.text} onChange={e => change({ text: e.target.value })}/></Field>
  <div className="ws-form-grid">
   <Field label={translateUi('Button label')}><input required maxLength={30} value={editing.value.cta} onChange={e => change({ cta: e.target.value })}/></Field>
   <Field label={translateUi('Button link (a page like /about, or https://)')}><input required maxLength={500} value={editing.value.to} onChange={e => change({ to: e.target.value })}/></Field>
  </div>
  <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" disabled={busy || uploading} onClick={() => setEditing(null)}>{translateUi('Cancel')}</button><button className="hub-button" disabled={busy || uploading}>{translateUi(busy ? 'Saving…' : uploading ? 'Uploading…' : 'Save slide')}</button></div>
 </form></FormModal>}
 </Panel>;
}
