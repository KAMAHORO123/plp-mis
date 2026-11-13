// Custom form controls that replace the browser's native date pickers, dropdowns and file inputs, which look
// different on every device. Each is a drop-in for the native element it replaces:
// - the same `name` is submitted with the form, in the same format (YYYY-MM-DD, YYYY-MM-DDTHH:mm, HH:mm, option value);
// - `required`, `min` and `max` still block submission with the browser's own message;
// - `onChange` receives an event-like object, so existing `e => set(e.target.value)` handlers keep working;
// - uncontrolled fields (defaultValue) follow `form.reset()`.
import { translateUi, useSiteLanguage, formatDate } from '../../i18n/language';
import * as Popover from "@radix-ui/react-popover";
import * as RSelect from "@radix-ui/react-select";
import { Children, isValidElement, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Upload, X } from "lucide-react";
import "./form-controls.css";

type ChangeEvent = { target: { name?: string; value: string }; currentTarget: { name?: string; value: string } };
const changeEvent = (name: string | undefined, value: string): ChangeEvent => ({ target: { name, value }, currentTarget: { name, value } });

/** Keeps internal state for uncontrolled fields, follows controlled ones, and resets with the form. */
function useFieldValue(value: string | undefined, defaultValue: string | undefined) {
    const [inner, setInner] = useState(defaultValue ?? "");
    const ref = useRef<HTMLInputElement>(null);
    const initial = useRef(defaultValue ?? "");
    initial.current = defaultValue ?? "";
    useEffect(() => {
        const form = ref.current?.form;
        if (!form) return;
        const reset = () => setInner(initial.current);
        form.addEventListener("reset", reset);
        return () => form.removeEventListener("reset", reset);
    }, []);
    // After a pick, tell the form the value changed, as typing would (forms that listen for input keep working).
    const notify = useRef(false);
    const current = value ?? inner;
    useEffect(() => {
        if (!notify.current || !ref.current) return;
        notify.current = false;
        ref.current.dispatchEvent(new Event("input", { bubbles: true }));
    }, [current]);
    return { current, set: setInner, controlled: value !== undefined, ref, picked: () => { notify.current = true; } };
}

/**
 * The input the form actually reads. It is invisible but fills the control, so a "required" message from the browser
 * points at the right place; it carries the name and value for FormData.
 */
function FormValue({ inputRef, name, value, required, disabled }: { inputRef: React.Ref<HTMLInputElement>; name?: string; value: string; required?: boolean; disabled?: boolean }) {
    return <input ref={inputRef} className="fc-value" name={name} value={value} required={required} disabled={disabled} tabIndex={-1} aria-hidden="true" onChange={() => undefined}/>;
}

// ---- Dates and times ------------------------------------------------------------------------------------------
const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = (v: string | undefined) => { const m = v?.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const weekdays = { en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], fr: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"], rw: ["Mbe", "Kab", "Gtu", "Kan", "Gnu", "Gnd", "Cyu"] };

type DateInputProps = {
    type?: "date" | "datetime-local" | "time";
    name?: string; value?: string; defaultValue?: string; min?: string; max?: string;
    required?: boolean; disabled?: boolean; placeholder?: string; className?: string; id?: string;
    onChange?: (event: ChangeEvent) => void;
    "aria-label"?: string;
};

/** A date, date-and-time or time picker in the site's style, in the reader's language. */
export function DateInput({ type = "date", name, value, defaultValue, min, max, required, disabled, placeholder, className = "", id, onChange, ...rest }: DateInputProps) {
    const lang = useSiteLanguage();
    const field = useFieldValue(value, defaultValue);
    const [open, setOpen] = useState(false);
    const v = field.current;
    const datePart = type === "time" ? "" : v.slice(0, 10);
    const timePart = type === "time" ? v.slice(0, 5) : type === "datetime-local" ? v.slice(11, 16) : "";
    const commit = (next: string) => {
        field.picked();
        if (!field.controlled) field.set(next);
        onChange?.(changeEvent(name, next));
    };
    const label = !v ? "" : type === "time" ? timePart
        : type === "datetime-local" ? `${formatDate(datePart, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${timePart || "--:--"}`
            : formatDate(datePart, { weekday: "short", day: "numeric", month: "long", year: "numeric" });
    const Icon = type === "time" ? Clock3 : CalendarDays;
    return <span className={`fc-field ${className}`}>
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" id={id} className="fc-trigger" disabled={disabled} aria-label={rest["aria-label"]} aria-haspopup="dialog">
          <Icon size={17} aria-hidden="true" className="fc-trigger-icon"/>
          <span className={v ? "fc-trigger-text" : "fc-trigger-text is-placeholder"}>{v ? label : translateUi(placeholder ?? (type === "time" ? "Choose a time" : type === "datetime-local" ? "Choose a date and time" : "Choose a date"))}</span>
          <ChevronDown size={16} aria-hidden="true" className="fc-trigger-chevron"/>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="fc-popover" sideOffset={8} align="start" collisionPadding={12}>
          {type !== "time" && <Calendar lang={lang} value={datePart} min={min?.slice(0, 10)} max={max?.slice(0, 10)} onPick={(day) => {
                if (type === "date") { commit(day); setOpen(false); }
                else commit(`${day}T${timePart || "09:00"}`);
            }}/>}
          {type !== "date" && <TimePicker value={timePart} onPick={(time, minutePicked) => {
                if (type === "time") { commit(time); if (minutePicked) setOpen(false); }
                else commit(`${datePart || isoDay(new Date())}T${time}`);
            }}/>}
          <div className="fc-popover-foot">
            {!required && v ? <button type="button" className="fc-link" onClick={() => { commit(""); setOpen(false); }}>{translateUi("Clear")}</button> : <span/>}
            {type === "date" && <button type="button" className="fc-link" onClick={() => { commit(isoDay(new Date())); setOpen(false); }}>{translateUi("Today")}</button>}
            {type !== "date" && <button type="button" className="fc-done" onClick={() => setOpen(false)}>{translateUi("Done")}</button>}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    <FormValue inputRef={field.ref} name={name} value={v} required={required} disabled={disabled}/>
  </span>;
}

/** Month grid with year and month jumps, so birth dates are as quick to pick as next week. */
function Calendar({ lang, value, min, max, onPick }: { lang: string; value: string; min?: string; max?: string; onPick: (day: string) => void }) {
    const selected = parseDay(value);
    const today = new Date();
    const start = selected ?? parseDay(max && max < isoDay(today) ? max : undefined) ?? today;
    const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth(), mode: "days" as "days" | "months" | "years" });
    const minDay = min ?? "", maxDay = max ?? "";
    const allowed = (day: string) => (!minDay || day >= minDay) && (!maxDay || day <= maxDay);
    const cells = useMemo(() => {
        const first = new Date(view.year, view.month, 1);
        const offset = (first.getDay() + 6) % 7;
        return Array.from({ length: 42 }, (_, i) => new Date(view.year, view.month, i - offset + 1));
    }, [view.year, view.month]);
    const shift = (step: number) => setView((s) => {
        if (s.mode === "years") return { ...s, year: s.year + step * 12 };
        if (s.mode === "months") return { ...s, year: s.year + step };
        const d = new Date(s.year, s.month + step, 1);
        return { ...s, year: d.getFullYear(), month: d.getMonth() };
    });
    const firstYear = view.year - (view.year % 12);
    const title = view.mode === "years" ? `${firstYear} – ${firstYear + 11}` : view.mode === "months" ? String(view.year) : formatDate(new Date(view.year, view.month, 15), { month: "long", year: "numeric" });
    return <div className="fc-calendar">
    <div className="fc-cal-head">
      <button type="button" className="fc-nav" aria-label={translateUi("Previous")} onClick={() => shift(-1)}><ChevronLeft size={18}/></button>
      <button type="button" className="fc-cal-title" onClick={() => setView((s) => ({ ...s, mode: s.mode === "days" ? "years" : s.mode === "years" ? "months" : "days" }))} aria-label={translateUi("Choose month and year")}>{title}<ChevronDown size={14} aria-hidden="true"/></button>
      <button type="button" className="fc-nav" aria-label={translateUi("Next")} onClick={() => shift(1)}><ChevronRight size={18}/></button>
    </div>
    {view.mode === "years" && <div className="fc-cal-grid is-wide">{Array.from({ length: 12 }, (_, i) => firstYear + i).map((y) => (
        <button type="button" key={y} className={`fc-cell${selected?.getFullYear() === y ? " is-selected" : ""}${today.getFullYear() === y ? " is-today" : ""}`} disabled={(!!maxDay && `${y}-01-01` > maxDay) || (!!minDay && `${y}-12-31` < minDay)} onClick={() => setView({ year: y, month: view.month, mode: "months" })}>{y}</button>))}
      </div>}
    {view.mode === "months" && <div className="fc-cal-grid is-wide">{Array.from({ length: 12 }, (_, m) => (
        <button type="button" key={m} className={`fc-cell${selected && selected.getFullYear() === view.year && selected.getMonth() === m ? " is-selected" : ""}`} disabled={(!!maxDay && isoDay(new Date(view.year, m, 1)) > maxDay) || (!!minDay && isoDay(new Date(view.year, m + 1, 0)) < minDay)} onClick={() => setView({ year: view.year, month: m, mode: "days" })}>{formatDate(new Date(view.year, m, 15), { month: "short" })}</button>))}
      </div>}
    {view.mode === "days" && <>
        <div className="fc-cal-week" aria-hidden="true">{(weekdays[lang as keyof typeof weekdays] ?? weekdays.en).map((d) => <span key={d}>{d}</span>)}</div>
        <div className="fc-cal-grid">{cells.map((d) => {
            const day = isoDay(d);
            const outside = d.getMonth() !== view.month;
            return <button type="button" key={day} disabled={!allowed(day)} aria-pressed={value === day} aria-label={formatDate(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              className={`fc-cell${outside ? " is-outside" : ""}${value === day ? " is-selected" : ""}${day === isoDay(today) ? " is-today" : ""}`} onClick={() => onPick(day)}>{d.getDate()}</button>;
        })}</div>
      </>}
  </div>;
}

/** Hours and minutes as two short scrolling columns (every 5 minutes, plus the current value). */
function TimePicker({ value, onPick }: { value: string; onPick: (time: string, minutePicked: boolean) => void }) {
    const [h, m] = value ? value.split(":") : ["", ""];
    const hours = Array.from({ length: 24 }, (_, i) => pad(i));
    const minutes = [...new Set([...Array.from({ length: 12 }, (_, i) => pad(i * 5)), ...(m ? [m] : [])])].sort();
    const hourRef = useRef<HTMLDivElement>(null), minuteRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        for (const ref of [hourRef, minuteRef]) ref.current?.querySelector<HTMLElement>(".is-selected")?.scrollIntoView({ block: "center" });
    }, []);
    return <div className="fc-time">
    <div className="fc-time-col" ref={hourRef} role="listbox" aria-label={translateUi("Hour")}>{hours.map((x) => <button type="button" key={x} role="option" aria-selected={x === h} className={`fc-cell${x === h ? " is-selected" : ""}`} onClick={() => onPick(`${x}:${m || "00"}`, false)}>{x}</button>)}</div>
    <span className="fc-time-sep" aria-hidden="true">:</span>
    <div className="fc-time-col" ref={minuteRef} role="listbox" aria-label={translateUi("Minute")}>{minutes.map((x) => <button type="button" key={x} role="option" aria-selected={x === m} className={`fc-cell${x === m ? " is-selected" : ""}`} onClick={() => onPick(`${h || "09"}:${x}`, true)}>{x}</button>)}</div>
  </div>;
}

// ---- Dropdowns --------------------------------------------------------------------------------------------------
type OptionInfo = { value: string; label: ReactNode; disabled?: boolean };
const EMPTY = "__fc_empty__";
/** Reads <option> children (also inside arrays and fragments), as a native <select> would. */
function readOptions(children: ReactNode): OptionInfo[] {
    const list: OptionInfo[] = [];
    Children.forEach(children, (child) => {
        if (!isValidElement(child)) return;
        const el = child as ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>;
        if (el.type === "option") list.push({ value: String(el.props.value ?? (typeof el.props.children === "string" ? el.props.children : "")), label: el.props.children, disabled: el.props.disabled });
        else if (el.props?.children) list.push(...readOptions(el.props.children));
    });
    return list;
}

type SelectProps = {
    name?: string; value?: string | number; defaultValue?: string | number; required?: boolean; disabled?: boolean;
    className?: string; id?: string; children?: ReactNode; onChange?: (event: ChangeEvent) => void;
    "aria-label"?: string; title?: string;
};

/** A dropdown in the site's style; give it <option> children exactly like a native <select>. */
export function Select({ name, value, defaultValue, required, disabled, className = "", id, children, onChange, title, ...rest }: SelectProps) {
    useSiteLanguage();
    const options = readOptions(children);
    const field = useFieldValue(value === undefined ? undefined : String(value), defaultValue === undefined ? (options.find((o) => !o.disabled)?.value ?? "") : String(defaultValue));
    const current = field.current;
    const chosen = options.find((o) => o.value === current);
    const placeholder = options.find((o) => o.value === "");
    return <span className={`fc-field ${className}`}>
    <RSelect.Root value={current === "" ? EMPTY : current} disabled={disabled} onValueChange={(next) => {
        const real = next === EMPTY ? "" : next;
        field.picked();
        if (!field.controlled) field.set(real);
        onChange?.(changeEvent(name, real));
      }}>
      <RSelect.Trigger id={id} className="fc-trigger" aria-label={rest["aria-label"]} title={title}>
        <span className={`fc-trigger-text${chosen && !(chosen.value === "" && chosen.disabled) ? "" : " is-placeholder"}`}>{chosen ? chosen.label : placeholder?.label ?? ""}</span>
        <RSelect.Icon asChild><ChevronDown size={16} className="fc-trigger-chevron"/></RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content className="fc-popover fc-menu" position="popper" sideOffset={6} collisionPadding={12}>
          <RSelect.Viewport className="fc-menu-list">
            {options.map((o) => <RSelect.Item key={o.value || EMPTY} value={o.value === "" ? EMPTY : o.value} disabled={o.disabled} className="fc-option">
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
                <RSelect.ItemIndicator className="fc-option-check"><Check size={15}/></RSelect.ItemIndicator>
              </RSelect.Item>)}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
    <FormValue inputRef={field.ref} name={name} value={current} required={required} disabled={disabled}/>
  </span>;
}

// ---- Files ------------------------------------------------------------------------------------------------------
type FileInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { hint?: string; type?: "file" };
const describeAccept = (accept?: string) => accept ? [...new Set(accept.split(",").map((a) => a.trim().replace(/^\./, "").replace(/^application\//, "").replace(/^image\//, "").replace(/^video\//, "").replace("jpeg", "jpg").toUpperCase()))].join(", ") : "";

/** A file picker that shows what was chosen. The real file input stays in the form, so uploads work as before. */
export function FileInput({ hint, className = "", onChange, multiple, accept, type: _type, ...props }: FileInputProps) {
    useSiteLanguage();
    const [files, setFiles] = useState<string[]>([]);
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const form = ref.current?.form;
        if (!form) return;
        const reset = () => setFiles([]);
        form.addEventListener("reset", reset);
        return () => form.removeEventListener("reset", reset);
    }, []);
    const types = describeAccept(accept);
    return <label className={`fc-file${files.length ? " has-files" : ""}${props.disabled ? " is-disabled" : ""} ${className}`}>
    <input {...props} ref={ref} type="file" multiple={multiple} accept={accept} className="fc-file-input" onChange={(e) => { setFiles([...(e.target.files ?? [])].map((f) => f.name)); onChange?.(e); }}/>
    <span className="fc-file-icon" aria-hidden="true"><Upload size={18}/></span>
    <span className="fc-file-text">
      {files.length ? <strong>{files.length === 1 ? files[0] : translateUi("{p0} files chosen", { p0: files.length })}</strong> : <strong>{translateUi(multiple ? "Choose files" : "Choose a file")}</strong>}
      <small>{files.length > 1 ? files.join(", ") : hint ? translateUi(hint) : types || translateUi("Click to browse")}</small>
    </span>
    {files.length > 0 && <button type="button" className="fc-file-clear" aria-label={translateUi("Remove the chosen file")} onClick={(e) => { e.preventDefault(); if (ref.current) { ref.current.value = ""; ref.current.dispatchEvent(new Event("change", { bubbles: true })); } setFiles([]); }}><X size={15}/></button>}
    <span className="fc-file-button" aria-hidden="true">{translateUi(files.length ? "Change" : "Browse")}</span>
  </label>;
}
