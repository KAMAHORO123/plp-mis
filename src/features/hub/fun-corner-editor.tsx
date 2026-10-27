import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useState } from 'react';
import { FilePenLine, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirmAction } from '@/components/shared/confirm-dialog';
import { platformApi } from './platform-api';
import { FormModal } from './modal';
import { RecordTable } from './management-ui';
import { Field, Panel } from './ui';
import { builtInQuotes, builtInTrivia, type CornerQuote, type FunCornerContent, type TriviaQuestion } from './community-sections';

const LIMIT = 12;
const blankQuestion: TriviaQuestion = { category: '', question: '', options: ['', '', '', ''], answer: 0, detail: '', source: '', sourceName: '' };
const blankQuote: CornerQuote = { text: '', author: '', context: '', source: '', sourceName: '' };
const httpsOrEmpty = (v: string) => !v.trim() || /^https:\/\/[^\s\\]+$/.test(v.trim());

/** Administrators edit the quiz and quotes in the landing-page fun corner; each save is live on the website. */
export function FunCornerEditor() {
    useSiteLanguage();
    const [content, setContent] = useState<FunCornerContent>({ trivia: builtInTrivia, quotes: builtInQuotes });
    const [custom, setCustom] = useState(false);
    const [view, setView] = useState<'Questions' | 'Quotes'>('Questions');
    const [editing, setEditing] = useState<{ kind: 'question'; index: number; value: TriviaQuestion } | { kind: 'quote'; index: number; value: CornerQuote } | null>(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        platformApi<FunCornerContent>('/public/fun-corner').then(value => {
            if (value.trivia.length || value.quotes.length) {
                setContent({ trivia: value.trivia.length ? value.trivia : builtInTrivia, quotes: value.quotes.length ? value.quotes : builtInQuotes });
                setCustom(true);
            }
        }).catch(() => { });
    }, []);

    async function publish(next: FunCornerContent, message: string) {
        setBusy(true);
        try {
            const saved = await platformApi<FunCornerContent>('/fun-corner', 'PUT', next);
            setContent(saved); setCustom(true); setEditing(null);
            window.dispatchEvent(new Event('plp:fun-corner-updated'));
            toast.success(translateUi(message));
        }
        catch (e) { toast.error(translateUi((e as Error).message)); }
        finally { setBusy(false); }
    }
    async function remove(kind: 'question' | 'quote', index: number) {
        const list = kind === 'question' ? content.trivia : content.quotes;
        if (list.length === 1) return toast.error(translateUi(`Keep at least one ${kind} in the fun corner.`));
        if (!await confirmAction({ title: translateUi(`Delete this ${kind}?`), description: translateUi('It is removed from the website straight away.'), confirmLabel: translateUi('Delete'), destructive: true })) return;
        await publish(kind === 'question' ? { ...content, trivia: content.trivia.filter((_, i) => i !== index) } : { ...content, quotes: content.quotes.filter((_, i) => i !== index) }, `The ${kind} was deleted`);
    }
    async function restore() {
        if (!await confirmAction({ title: translateUi('Restore the original fun corner?'), description: translateUi('Your questions and quotes are replaced by the ones PLP started with.'), confirmLabel: translateUi('Restore') })) return;
        try {
            await platformApi('/fun-corner', 'DELETE');
            setContent({ trivia: builtInTrivia, quotes: builtInQuotes }); setCustom(false);
            window.dispatchEvent(new Event('plp:fun-corner-updated'));
            toast.success(translateUi('The original fun corner is back on the website'));
        }
        catch (e) { toast.error(translateUi((e as Error).message)); }
    }
    function saveQuestion(index: number, q: TriviaQuestion) {
        const options = q.options.map(o => o.trim()).filter(Boolean);
        const correct = q.options[q.answer]?.trim();
        if (options.length < 2) return toast.error(translateUi('Give at least two answer options.'));
        if (!correct) return toast.error(translateUi('The correct answer cannot be empty.'));
        if (new Set(options.map(o => o.toLowerCase())).size !== options.length) return toast.error(translateUi('Each answer option must be different.'));
        if (!httpsOrEmpty(q.source)) return toast.error(translateUi('The source must be a link starting with https://'));
        const clean = { ...q, category: q.category.trim().toUpperCase(), question: q.question.trim(), detail: q.detail.trim(), options, answer: options.indexOf(correct), source: q.source.trim(), sourceName: q.sourceName.trim() };
        const trivia = index < 0 ? [...content.trivia, clean] : content.trivia.map((x, i) => i === index ? clean : x);
        void publish({ ...content, trivia }, index < 0 ? 'Question added to the website' : 'Question updated on the website');
    }
    function saveQuote(index: number, q: CornerQuote) {
        if (!httpsOrEmpty(q.source)) return toast.error(translateUi('The source must be a link starting with https://'));
        const clean = { text: q.text.trim(), author: q.author.trim(), context: q.context.trim(), source: q.source.trim(), sourceName: q.sourceName.trim() };
        const quotes = index < 0 ? [...content.quotes, clean] : content.quotes.map((x, i) => i === index ? clean : x);
        void publish({ ...content, quotes }, index < 0 ? 'Quote added to the website' : 'Quote updated on the website');
    }

    const actions = (kind: 'question' | 'quote', index: number, value: TriviaQuestion | CornerQuote) => <div className="hub-actions fc-row-actions">
      <button type="button" className="hub-record-icon hub-record-edit" aria-label={translateUi(`Edit ${kind}`)} title={translateUi(`Edit ${kind}`)} onClick={() => setEditing({ kind, index, value } as never)}><FilePenLine size={18} strokeWidth={1.5} aria-hidden="true"/></button>
      <button type="button" className="hub-record-icon hub-record-delete" aria-label={translateUi(`Delete ${kind}`)} title={translateUi(`Delete ${kind}`)} disabled={busy} onClick={() => void remove(kind, index)}><Trash2 size={18} strokeWidth={1.5} aria-hidden="true"/></button>
    </div>;
    const full = view === 'Questions' ? content.trivia.length >= LIMIT : content.quotes.length >= LIMIT;

    return <Panel>
      <h2>{translateUi('Landing page fun corner')}</h2>
      <p>{translateUi('The quiz and the "Voices for peace" quotes visitors see on the home page. Every change is live on the website as soon as you save it.')}</p>
      <div className="ws-table-tools">
        <div className="hub-chips">{(['Questions', 'Quotes'] as const).map(t => <button key={t} type="button" className={view === t ? 'active' : ''} onClick={() => setView(t)}>{translateUi(t)} ({t === 'Questions' ? content.trivia.length : content.quotes.length})</button>)}</div>
        <div className="hub-actions">
          <button type="button" className="hub-button" disabled={full || busy} title={full ? translateUi(`Up to ${LIMIT} can be shown`) : undefined} onClick={() => setEditing(view === 'Questions' ? { kind: 'question', index: -1, value: blankQuestion } : { kind: 'quote', index: -1, value: blankQuote })}><Plus size={16}/>{translateUi(view === 'Questions' ? 'Add question' : 'Add quote')}</button>
          {custom && <button type="button" className="hub-button secondary" onClick={() => void restore()}><RotateCcw size={16}/>{translateUi('Restore original')}</button>}
        </div>
      </div>
      {view === 'Questions'
        ? <RecordTable key="q" title={translateUi('questions')} pageSize={5} rows={content.trivia.map((q, i) => ({ ...q, id: String(i) }))} searchText={q => `${q.category} ${q.question} ${q.options.join(' ')}`} columns={[
            { label: translateUi('#'), render: q => Number(q.id) + 1 },
            { label: translateUi('Question'), render: q => <><strong>{q.question}</strong><br/><small>{q.category}</small></> },
            { label: translateUi('Correct answer'), render: q => q.options[q.answer] },
            { label: translateUi('Actions'), render: q => actions('question', Number(q.id), content.trivia[Number(q.id)]) },
          ]}/>
        : <RecordTable key="r" title={translateUi('quotes')} pageSize={5} rows={content.quotes.map((q, i) => ({ ...q, id: String(i) }))} searchText={q => `${q.text} ${q.author}`} columns={[
            { label: translateUi('#'), render: q => Number(q.id) + 1 },
            { label: translateUi('Quote'), render: q => <>“{q.text}”</> },
            { label: translateUi('Author'), render: q => q.author },
            { label: translateUi('Actions'), render: q => actions('quote', Number(q.id), content.quotes[Number(q.id)]) },
          ]}/>}
      {editing?.kind === 'question' && <QuestionForm initial={editing.value} isNew={editing.index < 0} busy={busy} onClose={() => setEditing(null)} onSave={q => saveQuestion(editing.index, q)}/>}
      {editing?.kind === 'quote' && <QuoteForm initial={editing.value} isNew={editing.index < 0} busy={busy} onClose={() => setEditing(null)} onSave={q => saveQuote(editing.index, q)}/>}
    </Panel>;
}

function QuestionForm({ initial, isNew, busy, onClose, onSave }: { initial: TriviaQuestion; isNew: boolean; busy: boolean; onClose: () => void; onSave: (q: TriviaQuestion) => void }) {
    useSiteLanguage();
    const [q, setQ] = useState<TriviaQuestion>(() => ({ ...initial, options: [...initial.options, '', '', ''].slice(0, 4) }));
    const set = <K extends keyof TriviaQuestion>(key: K, value: TriviaQuestion[K]) => setQ(d => ({ ...d, [key]: value }));
    return <FormModal wide title={translateUi(isNew ? 'Add a quiz question' : 'Edit quiz question')} description={translateUi('Two to four answers. Pick the correct one, then explain it so visitors learn something either way.')} onClose={onClose}>
      <form className="hub-form" onSubmit={e => { e.preventDefault(); onSave(q); }}>
        <div className="ws-form-grid"><Field label={translateUi('Topic label')}><input required maxLength={60} placeholder="A CULTURE OF PEACE" value={q.category} onChange={e => set('category', e.target.value)}/></Field><Field label={translateUi('Correct answer')}><select value={q.answer} onChange={e => set('answer', Number(e.target.value))}>{q.options.map((option, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}{option.trim() ? `: ${option.trim().slice(0, 40)}` : ''}</option>)}</select></Field></div>
        <Field label={translateUi('Question')}><input required maxLength={300} value={q.question} onChange={e => set('question', e.target.value)}/></Field>
        <div className="ws-form-grid">{q.options.map((option, i) => <Field key={i} label={translateUi(`Option ${String.fromCharCode(65 + i)}${i < 2 ? '' : ' (optional)'}`)}><input required={i < 2} maxLength={160} value={option} onChange={e => set('options', q.options.map((o, j) => j === i ? e.target.value : o))}/></Field>)}</div>
        <Field label={translateUi('Explanation shown after answering')}><textarea required maxLength={600} rows={3} value={q.detail} onChange={e => set('detail', e.target.value)}/></Field>
        <div className="ws-form-grid"><Field label={translateUi('Source link (optional)')}><input type="url" maxLength={1000} placeholder="https://" value={q.source} onChange={e => set('source', e.target.value)}/></Field><Field label={translateUi('Source name')}><input maxLength={80} placeholder="United Nations" value={q.sourceName} onChange={e => set('sourceName', e.target.value)}/></Field></div>
        <div className="hub-actions"><button className="hub-button" disabled={busy}>{translateUi(busy ? 'Saving…' : 'Save and publish')}</button><button type="button" className="hub-button secondary" onClick={onClose}>{translateUi('Cancel')}</button></div>
      </form>
    </FormModal>;
}

function QuoteForm({ initial, isNew, busy, onClose, onSave }: { initial: CornerQuote; isNew: boolean; busy: boolean; onClose: () => void; onSave: (q: CornerQuote) => void }) {
    useSiteLanguage();
    const [q, setQ] = useState<CornerQuote>(initial);
    const set = (key: keyof CornerQuote, value: string) => setQ(d => ({ ...d, [key]: value }));
    return <FormModal title={translateUi(isNew ? 'Add a quote' : 'Edit quote')} description={translateUi('Use words the person really said, and link to where they can be checked.')} onClose={onClose}>
      <form className="hub-form" onSubmit={e => { e.preventDefault(); onSave(q); }}>
        <Field label={translateUi('Quote')}><textarea required maxLength={300} rows={3} value={q.text} onChange={e => set('text', e.target.value)}/></Field>
        <Field label={translateUi('Said by')}><input required maxLength={80} value={q.author} onChange={e => set('author', e.target.value)}/></Field>
        <Field label={translateUi('Context (optional)')}><input maxLength={200} placeholder={translateUi('Where or when it was said')} value={q.context} onChange={e => set('context', e.target.value)}/></Field>
        <div className="ws-form-grid"><Field label={translateUi('Source link (optional)')}><input type="url" maxLength={1000} placeholder="https://" value={q.source} onChange={e => set('source', e.target.value)}/></Field><Field label={translateUi('Source name')}><input maxLength={80} value={q.sourceName} onChange={e => set('sourceName', e.target.value)}/></Field></div>
        <div className="hub-actions"><button className="hub-button" disabled={busy}>{translateUi(busy ? 'Saving…' : 'Save and publish')}</button><button type="button" className="hub-button secondary" onClick={onClose}>{translateUi('Cancel')}</button></div>
      </form>
    </FormModal>;
}
