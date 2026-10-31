import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useSiteLanguage, translateUi } from '../../i18n/language';
import { answerFaq, faqEntries, type FaqLanguage, type FaqLanguageChoice } from './faq';
import './faq-chat.css';

export function HelpChat({ opportunities = false }: { opportunities?: boolean }) {
  const siteLanguage = useSiteLanguage();
  const logRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [choice, setChoice] = useState<FaqLanguageChoice>('auto');
  const [lastLanguage, setLastLanguage] = useState<FaqLanguage>(siteLanguage);
  const [messages, setMessages] = useState<{who: 'help' | 'you'; text: string; language?: FaqLanguage}[]>([]);
  const language = choice === 'auto' ? lastLanguage : choice;
  const t = (text: string) => translateUi(text, undefined, language);
  useEffect(() => { setLastLanguage(siteLanguage); }, [siteLanguage]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [messages, open]);
  function ask(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const answer = answerFaq(clean, choice, lastLanguage);
    setLastLanguage(answer.language);
    setMessages(m => [...m, {who: 'you', text: clean}, {who: 'help', text: answer.text, language: answer.language}]);
    setInput('');
  }
  return <div className="ws-chat">{open && <section className="ws-chat-panel" aria-label={t('PLP help chat')} lang={language}>
    <header><div><strong>{t(opportunities ? 'Opportunity help' : 'PLP help')}</strong><small>{t('Quick answers · Automated FAQ')}</small></div><button aria-label={t('Close help chat')} onClick={() => setOpen(false)}><X size={18}/></button></header>
    <label className="ws-chat-language">{t('Language')} <select aria-label="FAQ language / Ururimi / Langue" value={choice} onChange={e => setChoice(e.target.value as FaqLanguageChoice)}><option value="auto">{t('Automatic')}</option><option value="en">English</option><option value="rw">Kinyarwanda</option><option value="fr">Français</option></select></label>
    <div ref={logRef} className="ws-chat-messages" role="log" aria-live="polite"><div><small>PLP</small><p>{t(opportunities ? 'Ask about applications, eligibility, documents or saved opportunities.' : 'Hello! Ask about joining PLP, certificates, student accounts, or staff roles in English, Kinyarwanda, or French.')}</p></div>{messages.map((m,i) => <div className={m.who === 'you' ? 'ws-chat-you' : ''} key={i}><small>{m.who === 'you' ? t('You') : 'PLP'}</small><p lang={m.language}>{m.text}</p></div>)}</div>
    <div className="ws-chat-suggestions">{faqEntries.filter(a => opportunities ? a.id.startsWith('opportunit') : !a.id.startsWith('opportunit')).slice(0,3).map(a => <button key={a.id} onClick={() => ask(a.q[language])}>{a.q[language]}</button>)}</div>
    <form onSubmit={e => {e.preventDefault(); ask(input);}}><input aria-label={t('Ask PLP help')} value={input} onChange={e => setInput(e.target.value)} maxLength={400} placeholder={t('Write your question…')}/><button aria-label={t('Send question')}><Send size={18}/></button></form>
  </section>}<button className="ws-chat-toggle" aria-expanded={open} onClick={() => setOpen(!open)}><MessageCircle size={21}/>{translateUi(open ? 'Close help' : 'Need help?')}</button></div>;
}
