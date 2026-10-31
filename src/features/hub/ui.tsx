import { translateUi, useSiteLanguage, formatDate } from '../../i18n/language';
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search, BarChart3, type LucideIcon } from "lucide-react";
export function Heading({ eyebrow, title, description, action, }: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    useSiteLanguage();
    return (<div className="hub-heading">
      <div>
        {translateUi(eyebrow && <p className="hub-eyebrow">{translateUi(eyebrow)}</p>)}
        <h1>{translateUi(title)}</h1>
        {translateUi(description && <p>{translateUi(description)}</p>)}
      </div>
      {translateUi(action)}
    </div>);
}
export function Panel({ children, className = "", }: {
    children: ReactNode;
    className?: string;
}) {
    useSiteLanguage();
    return <section className={`hub-panel ${className}`}>{translateUi(children)}</section>;
}
export function Tag({ children }: {
    children: ReactNode;
}) {
    useSiteLanguage();
    return <span className="hub-tag">{translateUi(children)}</span>;
}
export function Empty({ children }: {
    children: ReactNode;
}) {
    useSiteLanguage();
    return <div className="hub-empty">{translateUi(children)}</div>;
}
export function Progress({ value, label = "Progress", }: {
    value: number;
    label?: string;
}) {
    useSiteLanguage();
    return (<div className="hub-progress">
      <div>
        <span>{translateUi(label)}</span>
        <strong>{translateUi(value)}{translateUi("%")}</strong>
      </div>
      <progress aria-label={translateUi(label)} max={100} value={value}/>
    </div>);
}
export function Field({ label, children, }: {
    label: string;
    children: ReactNode;
}) {
    useSiteLanguage();
    return (<label className="hub-field">
      <span>{translateUi(label)}</span>
      {translateUi(children)}
    </label>);
}
export function SearchBox({ value, onChange, placeholder = "Search", }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    useSiteLanguage();
    return (<label className="hub-search">
      <Search size={18}/>
      <input aria-label={translateUi(placeholder)} placeholder={translateUi(placeholder)} value={value} onChange={(e) => onChange(e.target.value)}/>
    </label>);
}
export function Stats({ items, }: {
    items: {
        label: string;
        value: string | number;
        icon?: LucideIcon;
    }[];
}) {
    useSiteLanguage();
    return (<div className="hub-stats">
      {translateUi(items.map((x) => {
            const Icon = x.icon ?? BarChart3;
            return (<div key={x.label}>
          <Icon className="hub-stat-icon" aria-hidden="true"/>
          <strong>{translateUi(x.value)}</strong>
          <span>{translateUi(x.label)}</span>
        </div>);
        }))}
    </div>);
}
export function TextLink({ to, children, }: {
    to: string;
    children: ReactNode;
}) {
    useSiteLanguage();
    return (<Link className="hub-text-link" to={to}>
      {translateUi(children)}
      <ArrowUpRight size={16}/>
    </Link>);
}
export function downloadText(name: string, text: string, type = "text/plain") {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadCSV(name: string, rows: (string | number)[][]) {
    downloadText(name, rows
        .map((r) => r
        .map((v) => '"' +
        String(v)
            .replace(/^[=+@-]/, "'$&")
            .replace(/"/g, '""') +
        '"')
        .join(","))
        .join("\r\n"), "text/csv");
}
/** "Good morning, Grace" in the reader's language, by the time of day in Kigali. */
export function greeting(name: string) {
    const hour = Number(new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Kigali' }));
    const first = name.trim().split(/\s+/)[0] || name;
    return translateUi(hour < 12 ? 'Good morning, {p0}' : hour < 18 ? 'Good afternoon, {p0}' : 'Good evening, {p0}', { p0: first });
}
/** The quiet line under a dashboard greeting: what this page is, then today's date. */
export function dashboardSubtitle(...parts: (string | false | null | undefined)[]) {
    return [...parts.filter(Boolean).map(p => translateUi(p as string)), formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })].join(' \u00B7 ');
}

