import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { translateUi } from '../../i18n/language';
import '@/styles/dark-auto.css';
import './theme.css';
const KEY = 'plp-theme';
function preferredTheme(): 'dark' | 'light' {
  try { const saved = localStorage.getItem(KEY); if (saved === 'dark' || saved === 'light') return saved; } catch { /* Use system preference. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
// Applied as soon as the app loads, so every page (sign-in included) opens in the reader's theme.
if (typeof document !== 'undefined') applyTheme(preferredTheme());
export function ThemeToggle() {
  const [theme, setTheme] = useState(preferredTheme);
  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => {
    const sync = () => setTheme(preferredTheme());
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    window.addEventListener('storage', sync);
    media.addEventListener('change', sync);
    return () => { window.removeEventListener('storage', sync); media.removeEventListener('change', sync); };
  }, []);
  return <button type="button" className="plp-theme-toggle" aria-label={translateUi(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')} title={translateUi(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')} onClick={() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem(KEY, next); } catch { /* Session preference still works. */ }
  }}>{theme === 'dark' ? <Moon size={18} strokeWidth={1.75}/> : <Sun size={18} strokeWidth={1.75}/>}</button>;
}
