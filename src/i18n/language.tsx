import { useEffect, useRef, useSyncExternalStore } from 'react';
import { translations } from './translations';
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
  if (!params && (locale === 'en' || !translations[key])) return value;
  let result = locale === 'en' ? key : translations[key]?.[locale] ?? key;
  if (params) result = result.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
  return (value.slice(0, value.length - value.trimStart().length) + result + value.slice(value.trimEnd().length)) as T;
}
export function useSiteLanguage() {
  return useSyncExternalStore(subscribe, getSiteLanguage, () => 'en' as SiteLanguage);
}
export function LanguageDocument() {
  const selected = useSiteLanguage();
  useEffect(() => { document.documentElement.lang = selected; }, [selected]);
  return null;
}
export function LanguageSwitcher() {
  const selected = useSiteLanguage();
  return <label className="plp-language-switcher"><span className="plp-language-label">{translateUi('Language')}</span><select aria-label="Language / Ururimi / Langue" value={selected} onChange={event => setSiteLanguage(event.target.value as SiteLanguage)}><option value="en" lang="en">English</option><option value="rw" lang="rw">Kinyarwanda</option><option value="fr" lang="fr">Français</option></select></label>;
}
export const dateLocale = () => ({ en: 'en-GB', rw: 'rw-RW', fr: 'fr-FR' }[language]);

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
