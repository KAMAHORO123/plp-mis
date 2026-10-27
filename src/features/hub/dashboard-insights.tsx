import { translateUi, useSiteLanguage, formatDate } from '../../i18n/language';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Panel } from './ui';
type DatedRecord = {
    date: string;
    completed?: boolean;
};
/** A trailing year of actual records, including empty months. */
export function MonthlyActivity({ records, title, primary, secondary }: {
    records: DatedRecord[];
    title: string;
    primary: string;
    secondary: string;
}) {
    useSiteLanguage();
    const now = new Date();
    const data = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const rows = records.filter(r => r.date.startsWith(key));
        return { month: formatDate(date, { month: 'short' }), year: date.getFullYear(), total: rows.length, completed: rows.filter(r => r.completed).length };
    });
    return <Panel><div className="ws-panel-title"><div><h2>{translateUi(title)}</h2><p className="hub-caption">{translateUi("Monthly totals \u00B7 Last 12 months")}</p></div></div><div className="ws-insight-legend"><span><i />{translateUi(primary)}</span><span><i />{translateUi(secondary)}</span></div><div role="img" aria-label={translateUi(data.map(d => `${d.month} ${d.year}: ${d.total} ${primary}, ${d.completed} ${secondary}`).join('; '))}><ResponsiveContainer width="100%" height={220}><AreaChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf1f5"/><XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis width={30} allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip /><Area type="monotone" dataKey="total" name={primary} stroke="#1c73bb" fill="#1c73bb" fillOpacity={.05} strokeWidth={2} isAnimationActive={false}/><Area type="monotone" dataKey="completed" name={secondary} stroke="#8dbce5" fill="#8dbce5" fillOpacity={.08} strokeWidth={2} isAnimationActive={false}/></AreaChart></ResponsiveContainer></div></Panel>;
}
