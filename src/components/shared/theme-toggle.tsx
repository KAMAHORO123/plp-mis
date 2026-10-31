import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { translateUi } from '../../i18n/language';
import '@/styles/dark-auto.css';
import './theme.css';
const KEY = 'plp-theme';
function preferredTheme(): 'dark' | 'light' {
  // Light unless the reader has chosen dark with the toggle.
  try { if (localStorage.getItem(KEY) === 'dark') return 'dark'; } catch { /* Light by default. */ }
  return 'light';
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
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return <button type="button" className="plp-theme-toggle" aria-label={translateUi(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')} title={translateUi(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')} onClick={() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem(KEY, next); } catch { /* Session preference still works. */ }
  }}>{theme === 'dark' ? <Moon size={18} strokeWidth={1.75}/> : <Sun size={18} strokeWidth={1.75}/>}</button>;
}
