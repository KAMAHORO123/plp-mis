import { useEffect, useRef, useSyncExternalStore } from 'react';
import { translations } from './translations';
import { templates } from './templates';
import './language.css';

export type SiteLanguage = 'en' | 'rw' | 'fr';
const KEY = 'plp-language';
const valid = (value: unknown): value is SiteLanguage => value === 'en' || value === 'rw' || value === 'fr';
function initialLanguage(): SiteLanguage {
  try {
    const query = new URLSearchParams(window.location.search).get('lang');
    if (valid(query)) { localStorage.setItem(KEY, query); return query; }
    const saved = localStorage.getItem(KEY);
    if (valid(saved)) return saved;
  } catch { /* Storage may be disabled. The in-memory preference still works. */ }
  return 'en';
}
let language: SiteLanguage = initialLanguage();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getSiteLanguage = () => language;
export function setSiteLanguage(next: SiteLanguage) {
  if (!valid(next)) return;
  language = next;
  try { localStorage.setItem(KEY, next); } catch { /* Keep the preference for this session. */ }
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  listeners.forEach(listener => listener());
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === KEY && valid(event.newValue)) { language = event.newValue; document.documentElement.lang = language; listeners.forEach(listener => listener()); }
});

/** Translate only display values. IDs, form values, routes and stored records stay unchanged. */
export function translateUi<T>(value: T, params?: Record<string, unknown>, locale: SiteLanguage = language): T {
  if (Array.isArray(value)) return value.map(item => translateUi(item, undefined, locale)) as T;
  if (typeof value !== 'string') return value;
  const key = value.trim().replace(/\s+/g, ' ');
  if (!params && (locale === 'en' || !/[A-Za-z]{2}/.test(key))) return value;
  let result = locale === 'en' ? key : translations[key]?.[locale] ?? (params ? key : composed(key, locale));
  if (result === undefined) {
    // Development only: remember text with no translation so it can be added to the catalogue.
    if (import.meta.env.DEV) ((window as unknown as { __plpMissing?: Set<string> }).__plpMissing ??= new Set()).add(key);
    return value;
  }
  if (params) result = result.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
  return (value.slice(0, value.length - value.trimStart().length) + result + value.slice(value.trimEnd().length)) as T;
}

// ---- Sentences built at runtime ------------------------------------------------------------------
// Text such as "8 days left", "Kevin will participate" or "Meeting: 15 activities (22%)" is matched
// against templates; the pieces inside (types, months, units) are translated too, names stay as they are.
const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthsLongEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Counts like "3 Activities" (only used when the unit word is known; see composedIn).
const generic = [{ en: '{n} {unit}', rw: '{unit}: {n}', fr: '{n} {unit}' }];
const compiled = [...templates, ...generic]
  .map(t => {
    const names: string[] = [];
    const pattern = t.en.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{(\w+)\\?\}/g, (_m, name: string) => {
      names.push(name);
      return /^(n|m|a|b|p|year|letter)$/.test(name) ? (name === 'letter' ? '([A-Z])' : '(\\d[\\d,.]*)') : '((?:(?!, |; ).)+?)';
    });
    return { ...t, names, regex: new RegExp(`^${pattern}$`), literal: t.en.replace(/\{\w+\}/g, '').length };
  })
  .sort((a, b) => b.literal - a.literal);
const cache: Record<SiteLanguage, Map<string, string | undefined>> = { en: new Map(), rw: new Map(), fr: new Map() };
/** A date fragment like "24 Oct", "Oct 2025", "November 2025" or "24 Oct 2026" in the reader's language. */
function dateText(text: string) {
  const m = text.match(/^(?:(\d{1,2}) )?([A-Z][a-z]{2,8})\.?(?: (\d{4}))?$/);
  if (!m || (!m[1] && !m[3])) return undefined;
  const index = monthsEn.indexOf(m[2].slice(0, 3));
  if (index < 0 || (m[2].length > 4 && monthsLongEn[index] !== m[2] && m[2] !== 'Sept')) return undefined;
  const date = new Date(Number(m[3] ?? 2000), index, Number(m[1] ?? 15), 12);
  // French short months end in a full stop ("oct."); drop it so surrounding punctuation is not doubled.
  return formatDate(date, { ...(m[1] ? { day: 'numeric' } : {}), month: m[2].length > 4 ? 'long' : 'short', ...(m[3] ? { year: 'numeric' } : {}) }).replace(/\.$/, '');
}
/** Translate one piece of a composed sentence: catalogue (also lower-case words), dates, then templates. */
function piece(text: string, locale: 'rw' | 'fr', depth: number): string {
  if (!/[A-Za-z]{2}/.test(text)) return text;
  const exact = translations[text]?.[locale];
  if (exact) return exact;
  const upper = text[0].toUpperCase() + text.slice(1);
  if (upper !== text && translations[upper]?.[locale]) { const t = translations[upper][locale]; return t[0].toLowerCase() + t.slice(1); }
  return dateText(text) ?? (depth < 3 ? composed(text, locale, depth + 1) : undefined) ?? text;
}
function composed(key: string, locale: SiteLanguage, depth = 0): string | undefined {
  if (locale === 'en') return key;
  return composedIn(key, locale, depth);
}
function composedIn(key: string, locale: 'rw' | 'fr', depth: number): string | undefined {
  const known = cache[locale];
  if (known.has(key)) return known.get(key);
  // Separators at either end (e.g. "· 4 hours a month") are kept as they are.
  const edge = key.match(/^([·•\-–—:]\s*)?(.*?)(\s*[·•:])?$/)!;
  if ((edge[1] || edge[3]) && edge[2]) {
    const inner = composedIn(edge[2], locale, depth) ?? translations[edge[2]]?.[locale];
    const value = inner === undefined ? undefined : (edge[1] ?? '') + inner + (edge[3] ?? '');
    known.set(key, value);
    return value;
  }
  let result: string | undefined;
  for (const t of compiled) {
    const match = t.regex.exec(key);
    if (!match) continue;
    const values = Object.fromEntries(t.names.map((name, i) => [name, piece(match[i + 1], locale, depth)]));
    // A template that is only placeholders must translate at least one word, or it would just reorder English.
    if (!/[A-Za-z]/.test(t.en.replace(/\{\w+\}/g, '')) && t.names.every((name, i) => values[name] === match[i + 1])) continue;
    result = t[locale].replace(/\{(\w+)\}/g, (m, name: string) => values[name] ?? m);
    break;
  }
  result ??= dateText(key);
  // Lists and summaries joined with " · ", "; " or ", " are translated piece by piece.
  for (const separator of [' · ', '; ', ', ']) {
    if (result !== undefined || !key.includes(separator)) continue;
    const parts = key.split(separator);
    const translated = parts.map(part => piece(part, locale, depth));
    // Only treat commas as a list when every piece is known; otherwise it is an ordinary sentence.
    if (translated.some((t, i) => t !== parts[i]) && (separator !== ', ' || translated.every((t, i) => t !== parts[i] || !/[a-z]{3}/.test(parts[i]))))
      result = translated.join(separator);
  }
  known.set(key, result);
  return result;
}

export function useSiteLanguage() {
  return useSyncExternalStore(subscribe, getSiteLanguage, () => 'en' as SiteLanguage);
}
export function LanguageDocument() {
  const selected = useSiteLanguage();
  useEffect(() => { document.documentElement.lang = selected; }, [selected]);
  return null;
}
/**
 * Language picker. `compact` shows a globe and the short code (EN, RW, FR) so the public navigation keeps its
 * links in every language; the list that opens still names each language in full.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const selected = useSiteLanguage();
  const select = <select aria-label="Language / Ururimi / Langue" value={selected} onChange={event => setSiteLanguage(event.target.value as SiteLanguage)}><option value="en" lang="en">English</option><option value="rw" lang="rw">Kinyarwanda</option><option value="fr" lang="fr">Français</option></select>;
  return <label className={`plp-language-switcher${compact ? ' is-compact' : ''}`}><span className="plp-language-label">{translateUi('Language')}</span>
    {compact && <span className="plp-language-code" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg><span className="plp-language-code-text">{selected.toUpperCase()}</span></span>}
    {select}</label>;
}
export const dateLocale = () => ({ en: 'en-GB', rw: 'rw-RW', fr: 'fr-FR' }[language]);
const rwMonths = ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena', 'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza'];
/**
 * Dates in the reader's language. Browsers rarely ship Kinyarwanda month names, so they are built in.
 * Accepts a Date, an ISO string or a YYYY-MM-DD / YYYY-MM value (read as a local date).
 */
export function formatDate(value: Date | string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = typeof value === 'string' ? new Date(/^\d{4}-\d{2}(-\d{2})?$/.test(value) ? `${value.length === 7 ? value + '-15' : value}T12:00:00` : value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  if (language !== 'rw') return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', options).replace(/\bSept\b/, 'Sep');
  const month = options.month ? (options.month === 'long' ? rwMonths[date.getMonth()] : rwMonths[date.getMonth()].slice(0, 3)) : '';
  return [options.day ? date.getDate() : '', month, options.year ? date.getFullYear() : ''].filter(Boolean).join(' ');
}


/**
 * Collapses the public header's links into the menu button whenever they do not fit,
 * whatever the language or screen size. Returns a ref for the <header>.
 */
export function useHeaderFit<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const selected = useSiteLanguage();
  useEffect(() => {
    const header = ref.current;
    if (!header || typeof ResizeObserver === 'undefined') return;
    const fit = () => {
      header.classList.remove('is-nav-collapsed', 'is-actions-tight');
      if (header.scrollWidth > header.clientWidth + 1) header.classList.add('is-nav-collapsed');
      if (header.scrollWidth > header.clientWidth + 1) header.classList.add('is-actions-tight');
    };
    const observer = new ResizeObserver(fit);
    observer.observe(header);
    void document.fonts?.ready.then(fit);
    fit();
    return () => observer.disconnect();
  }, [selected]);
  return ref;
}
