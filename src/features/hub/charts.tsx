import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useId, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, type TooltipProps } from 'recharts';
import { Panel } from './ui';
// One chart language for every dashboard. Colours are the validated categorical order (blue, orange, aqua, yellow),
// assigned by position and never cycled; anything past four folds into a gray "Other". Text always uses ink colours.
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
const OTHER = '#9aa4b2', ACCENT = SERIES[0], GRID = '#eef1f4', MUTED = '#667085', SPARK = '#c3cbd6';
/** One measure from monthly rows, for sparklines. */
export const series = (rows: Record<string, number | string>[] | undefined, key: string) => (rows ?? []).map((r) => Number(r[key]) || 0);
export const compact = (n: number) => (Math.abs(n) >= 10000 ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : n.toLocaleString('en'));
const monthLabel = (m: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString('en-GB', { month: 'short' });
const monthLong = (m: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
/** A tiny 12-point trend: earlier months in gray, the current month as an accent dot. */
function Sparkline({ values }: {
    values: number[];
}) {
    useSiteLanguage();
    if (values.length < 2)
        return null;
    const w = 96, h = 28, max = Math.max(...values, 1);
    const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 3 - (v / max) * (h - 6)] as const);
    const [lx, ly] = pts[pts.length - 1];
    return (<svg className="dv-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={SPARK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lx} cy={ly} r={4} fill={ACCENT} stroke="#fff" strokeWidth={2}/>
    </svg>);
}
/** Stat tile: label, value, optional change against the previous 30 days, optional sparkline. */
export function KpiTile({ label, value, icon: Icon, spark, change, upIsGood = true, note }: {
    label: string;
    value: number | string;
    icon: LucideIcon;
    spark?: number[];
    change?: {
        current: number;
        previous: number;
    };
    upIsGood?: boolean;
    note?: string;
}) {
    useSiteLanguage();
    let delta: ReactNode = null;
    if (change) {
        const diff = change.current - change.previous;
        const pct = change.previous ? Math.round((diff / change.previous) * 100) : null;
        const good = diff === 0 ? null : (diff > 0) === upIsGood;
        const Arrow = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
        delta = (<span className={`dv-delta ${good === null ? '' : good ? 'good' : 'bad'}`}>
        <Arrow size={13} aria-hidden="true"/>
        {translateUi(pct === null ? (change.current ? `${compact(change.current)} new` : 'No change') : `${diff > 0 ? '+' : ''}${pct}%`)}
        <small>{translateUi("last 30 days")}</small>
      </span>);
    }
    return (<div className="dv-tile">
      <div className="dv-tile-head"><span className="dv-tile-icon"><Icon size={17}/></span><span>{translateUi(label)}</span></div>
      <div className="dv-tile-body">
        <strong>{translateUi(typeof value === 'number' ? compact(value) : value)}</strong>
        {translateUi(spark && <Sparkline values={spark}/>)}
      </div>
      {translateUi(delta ?? (note && <span className="dv-delta"><small>{translateUi(note)}</small></span>))}
    </div>);
}
function ChartTooltip({ active, payload, label, unit }: TooltipProps<number, string> & {
    unit: string;
}) {
    useSiteLanguage();
    if (!active || !payload?.length)
        return null;
    return (<div className="dv-tooltip">
      <span>{translateUi(monthLong(String(label)))}</span>
      {translateUi(payload.map((p) => <strong key={String(p.dataKey)}><i style={{ background: p.color }}/>{translateUi(compact(Number(p.value)))} {translateUi(unit)}</strong>))}
    </div>);
}
/** Change over the last 12 months for one measure: a line with a light wash, or columns for counts that add up. */
export function TrendCard({ title, data, dataKey, unit, columns = false, action }: {
    title: string;
    data: Record<string, number | string>[];
    dataKey: string;
    unit: string;
    columns?: boolean;
    action?: ReactNode;
}) {
    useSiteLanguage();
    const gradient = useId().replace(/:/g, '');
    const values = data.map((d) => Number(d[dataKey]) || 0);
    const total = values.reduce((a, b) => a + b, 0);
    const latest = values[values.length - 1] ?? 0;
    const axis = { stroke: GRID, tick: { fill: MUTED, fontSize: 11 }, tickLine: false };
    return (<Panel className="dv-card">
      <header className="dv-card-head">
        <div><h2>{translateUi(title)}</h2><p><strong>{translateUi(compact(total))}</strong> {translateUi(unit)}{translateUi(" in the last 12 months \u00B7 ")}<strong>{translateUi(compact(latest))}</strong>{translateUi(" this month")}</p></div>
        {translateUi(action)}
      </header>
      {translateUi(total === 0 ? <p className="pv-empty">{translateUi("Nothing recorded in the last 12 months yet. This chart fills in as activity is recorded.")}</p> : (<div className="dv-plot" role="img" aria-label={translateUi(`${title}: ${data.map((d) => `${monthLong(String(d.month))} ${d[dataKey]}`).join(', ')}`)}>
          <ResponsiveContainer width="100%" height={220}>
            {translateUi(columns ? (<BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID}/>
                <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} axisLine={false} interval="preserveStartEnd"/>
                <YAxis allowDecimals={false} {...axis} axisLine={false} width={44} tickFormatter={compact}/>
                <Tooltip cursor={{ fill: '#f2f6fb' }} content={<ChartTooltip unit={unit}/>}/>
                <Bar dataKey={dataKey} fill={ACCENT} maxBarSize={24} radius={[4, 4, 0, 0]}/>
              </BarChart>) : (<AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ACCENT} stopOpacity={0.14}/><stop offset="100%" stopColor={ACCENT} stopOpacity={0.02}/></linearGradient></defs>
                <CartesianGrid vertical={false} stroke={GRID}/>
                <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} axisLine={false} interval="preserveStartEnd"/>
                <YAxis allowDecimals={false} {...axis} axisLine={false} width={44} tickFormatter={compact}/>
                <Tooltip cursor={{ stroke: '#98a2b3', strokeWidth: 1 }} content={<ChartTooltip unit={unit}/>}/>
                <Area type="monotone" dataKey={dataKey} stroke={ACCENT} strokeWidth={2} fill={`url(#${gradient})`} dot={false} activeDot={{ r: 5, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}/>
              </AreaChart>))}
          </ResponsiveContainer>
        </div>))}
      <table className="sr-only"><caption>{translateUi(title)}</caption><thead><tr><th>{translateUi("Month")}</th><th>{translateUi(unit)}</th></tr></thead><tbody>{translateUi(data.map((d) => <tr key={String(d.month)}><td>{translateUi(monthLong(String(d.month)))}</td><td>{translateUi(d[dataKey])}</td></tr>))}</tbody></table>
    </Panel>);
}
/** Part of a whole: one stacked bar (largest first, up to four colours, the rest as "Other") with a labelled legend. */
export function ShareCard({ title, rows, unit, empty }: {
    title: string;
    rows: {
        name: string;
        value: number;
    }[];
    unit: string;
    empty: string;
}) {
    useSiteLanguage();
    const sorted = [...rows].filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
    const shown = sorted.length > 4 ? [...sorted.slice(0, 3), { name: 'Other', value: sorted.slice(3).reduce((n, r) => n + r.value, 0) }] : sorted;
    const total = shown.reduce((n, r) => n + r.value, 0);
    const color = (i: number, name: string) => (name === 'Other' ? OTHER : SERIES[i]);
    return (<Panel className="dv-card">
      <header className="dv-card-head"><div><h2>{translateUi(title)}</h2><p><strong>{translateUi(compact(total))}</strong> {translateUi(unit)}{translateUi(" in total")}</p></div></header>
      {translateUi(!total ? <p className="pv-empty">{translateUi(empty)}</p> : <>
        <div className="dv-share" role="img" aria-label={translateUi(shown.map((r) => `${r.name}: ${r.value} ${unit}`).join(', '))}>
          {translateUi(shown.map((r, i) => <span key={r.name} style={{ flexGrow: r.value, background: color(i, r.name) }} title={translateUi(`${r.name}: ${compact(r.value)} ${unit} (${Math.round((r.value / total) * 100)}%)`)}/>))}
        </div>
        <ul className="dv-legend">
          {translateUi(shown.map((r, i) => <li key={r.name}><i style={{ background: color(i, r.name) }}/><span>{translateUi(r.name)}</span><strong>{translateUi(compact(r.value))}</strong><small>{translateUi(Math.round((r.value / total) * 100))}{translateUi("%")}</small></li>))}
        </ul>
      </>)}
    </Panel>);
}
/** A ranked list with bars: one hue, longest first, the value written at the end of each bar. */
export function RankCard({ title, rows, unit, empty, caption }: {
    title: string;
    rows: {
        name: string;
        value: number;
        detail?: string;
    }[];
    unit: string;
    empty: string;
    caption?: string;
}) {
    useSiteLanguage();
    const sorted = [...rows].sort((a, b) => b.value - a.value).slice(0, 8);
    const max = Math.max(...sorted.map((r) => r.value), 1);
    return (<Panel className="dv-card">
      <header className="dv-card-head"><div><h2>{translateUi(title)}</h2>{translateUi(caption && <p>{translateUi(caption)}</p>)}</div></header>
      {translateUi(!sorted.length || !sorted.some((r) => r.value) ? <p className="pv-empty">{translateUi(empty)}</p> : (<ol className="dv-rank">
          {translateUi(sorted.map((r) => (<li key={r.name} title={translateUi(`${r.name}: ${r.value.toLocaleString('en')} ${unit}${r.detail ? ` · ${r.detail}` : ''}`)}>
              <div className="dv-rank-label"><span>{translateUi(r.name)}</span><strong>{translateUi(compact(r.value))} <small>{translateUi(unit)}</small></strong></div>
              <div className="dv-rank-track"><span style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}/></div>
              {translateUi(r.detail && <small className="dv-rank-detail">{translateUi(r.detail)}</small>)}
            </li>)))}
        </ol>))}
    </Panel>);
}
