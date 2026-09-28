import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search } from "lucide-react";
export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="hub-heading">
      <div>
        {eyebrow && <p className="hub-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`hub-panel ${className}`}>{children}</section>;
}
export function Tag({ children }: { children: ReactNode }) {
  return <span className="hub-tag">{children}</span>;
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="hub-empty">{children}</div>;
}
export function Progress({
  value,
  label = "Progress",
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="hub-progress">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <progress aria-label={label} max={100} value={value} />
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="hub-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="hub-search">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function Stats({
  items,
}: {
  items: { label: string; value: string | number }[];
}) {
  return (
    <div className="hub-stats">
      {items.map((x) => (
        <div key={x.label}>
          <strong>{x.value}</strong>
          <span>{x.label}</span>
        </div>
      ))}
    </div>
  );
}
export function TextLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="hub-text-link" to={to}>
      {children}
      <ArrowUpRight size={16} />
    </Link>
  );
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
  downloadText(
    name,
    rows
      .map((r) =>
        r
          .map(
            (v) =>
              '"' +
              String(v)
                .replace(/^[=+@-]/, "'$&")
                .replace(/"/g, '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n"),
    "text/csv",
  );
}
