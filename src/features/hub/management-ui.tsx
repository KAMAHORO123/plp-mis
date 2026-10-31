import { downloadCSV } from "./ui";
import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useState, type ReactNode } from 'react';
import { Empty } from './ui';
import { SlidersHorizontal } from 'lucide-react';
/** A choice of rows, e.g. "Status: Pending". The first option of every filter is "All". */
export type TableFilter<T> = {
    label: string;
    options: {
        label: string;
        test: (row: T) => boolean;
    }[];
};
/** An action applied to every selected row at once, e.g. approving a batch. */
export type BulkAction<T> = {
    label: string;
    tone?: 'danger';
    run: (rows: T[]) => Promise<unknown> | unknown;
};
export function RecordTable<T extends {
    id: string;
}>({ title, rows, columns, searchText, pageSize = 8, filters = [], bulkActions = [], selectable = () => true, csv }: {
    title: string;
    rows: T[];
    columns: {
        label: string;
        render: (row: T) => ReactNode;
    }[];
    searchText: (row: T) => string;
    pageSize?: number;
    filters?: TableFilter<T>[];
    /** Adds "Export CSV" for the rows currently matching the search and filters. */
    csv?: { name: string; columns: [string, (row: T) => string | number | null | undefined][] };
    bulkActions?: BulkAction<T>[];
    /** Rows that bulk actions may touch, such as only the pending ones. */
    selectable?: (row: T) => boolean;
}) {
    useSiteLanguage();
    const [query, setQuery] = useState(''), [page, setPage] = useState(1), [chosen, setChosen] = useState<Record<string,string>>({});
    const [limit, setLimit] = useState(pageSize), [order, setOrder] = useState('default');
    const [selected, setSelected] = useState<Set<string>>(new Set()), [running, setRunning] = useState(false);
    // Phones show the search box only; filters and sorting open on request.
    const [toolsOpen, setToolsOpen] = useState(false);
    const filtered = rows.filter(r => searchText(r).toLowerCase().includes(query.toLowerCase()) && filters.every(f => !chosen[f.label] || f.options.find(o=>o.label===chosen[f.label])?.test(r)));
    if (order !== 'default') filtered.sort((a,b) => searchText(a).localeCompare(searchText(b)) * (order === 'az' ? 1 : -1));
    const pages = Math.max(1, Math.ceil(filtered.length / limit)), current = Math.min(page, pages);
    // The checkbox column only appears when at least one row can be acted on.
    const bulk = bulkActions.length > 0 && rows.some(selectable), eligible = filtered.filter(selectable);
    // Selection follows the current filters: rows hidden by a filter are never acted on.
    const picked = eligible.filter(r => selected.has(r.id));
    const allPicked = eligible.length > 0 && picked.length === eligible.length;
    const toggle = (id: string) => setSelected(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const run = async (action: BulkAction<T>) => { setRunning(true); try { await action.run(picked); setSelected(new Set()); } finally { setRunning(false); } };
    const cols = bulk ? [{ label: '', render: (row: T) => selectable(row) ? <input type="checkbox" className="ws-check" checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label={translateUi("Select row")}/> : null }, ...columns] : columns;
    if (!rows.length)
        return <Empty>{translateUi("Nothing here yet.")}</Empty>;
    const activeFilters = Object.values(chosen).filter(Boolean).length;
    // A handful of rows needs no search or filters.
    const showTools = rows.length > 5 || !!query || activeFilters > 0;
    return <div>{showTools && <div className={`ws-table-tools${toolsOpen ? ' is-open' : ''}`}><input aria-label={translateUi("Search {p0}", { p0: translateUi(title) })} value={query} placeholder={translateUi("Search {p0}", { p0: translateUi(title.toLowerCase()) })} onChange={e => { setQuery(e.target.value); setPage(1); }}/>{translateUi(filters.map(f => <select key={f.label} className="ws-filter" aria-label={translateUi(f.label)} value={chosen[f.label] ?? ''} onChange={e => { const v = e.target.value; setChosen(c => ({...c,[f.label]:v})); setPage(1); }}><option value="">{translateUi(f.label)}{translateUi(": all")}</option>{translateUi(f.options.map(o => <option key={o.label} value={o.label}>{translateUi(o.label)}</option>))}</select>))}<select aria-label={translateUi('Sort records')} value={order} onChange={e=>{setOrder(e.target.value);setPage(1);}}><option value="default">{translateUi('Default order')}</option><option value="az">{translateUi('A to Z')}</option><option value="za">{translateUi('Z to A')}</option></select><select aria-label={translateUi('Rows per page')} value={limit} onChange={e=>{setLimit(Number(e.target.value));setPage(1);}}>{[...new Set([pageSize,10,25,50])].sort((a,b)=>a-b).map(n=><option key={n} value={n}>{n} {translateUi('per page')}</option>)}</select>{csv&&<button type="button" className="hub-text-button" onClick={()=>downloadCSV(`${csv.name}-${new Date().toISOString().slice(0,10)}.csv`,[csv.columns.map(([label])=>label),...filtered.map(r=>csv.columns.map(([,get])=>get(r)??''))])}>{translateUi('Export CSV')}</button>}{(query||Object.values(chosen).some(Boolean))&&<button type="button" className="hub-text-button" onClick={()=>{setQuery('');setChosen({});setPage(1);}}>{translateUi('Clear filters')}</button>}<span>{translateUi(filtered.length)} {translateUi(filtered.length === 1 ? 'record' : 'records')}</span><button type="button" className="ws-tools-toggle" aria-expanded={toolsOpen} onClick={() => setToolsOpen(o => !o)}><SlidersHorizontal size={16} aria-hidden="true"/>{translateUi("Filters")}{activeFilters > 0 && <b>{activeFilters}</b>}</button></div>}
    {translateUi(bulk && eligible.length > 0 && <div className={`ws-bulk-bar${picked.length ? ' is-active' : ''}`}><label className="ws-bulk-all"><input type="checkbox" className="ws-check" checked={allPicked} ref={el => { if (el) el.indeterminate = picked.length > 0 && !allPicked; }} onChange={() => setSelected(allPicked ? new Set() : new Set(eligible.map(r => r.id)))}/>{translateUi(picked.length ? `${picked.length} selected` : `Select all ${eligible.length}`)}</label>{translateUi(picked.length > 0 && <div className="ws-bulk-actions">{translateUi(bulkActions.map(a => <button key={a.label} type="button" className={`hub-button${a.tone === 'danger' ? ' danger' : ''}`} disabled={running} onClick={() => void run(a)}>{translateUi(running ? 'Working…' : a.label)}</button>))}<button type="button" className="hub-text-button" disabled={running} onClick={() => setSelected(new Set())}>{translateUi("Clear")}</button></div>)}</div>)}
    {filtered.length > 0 && <div className="ws-table-wrap"><table className="ws-table"><thead><tr>{translateUi(cols.map((c, i) => <th key={c.label || i} className={bulk && i === 0 ? 'ws-check-cell' : undefined}>{translateUi(c.label)}</th>))}</tr></thead><tbody>{translateUi(filtered.slice((current - 1) * limit, current * limit).map(row => <tr key={row.id} className={selected.has(row.id) ? 'is-selected' : undefined}>{translateUi(cols.map((c, i) => <td key={c.label || i} className={bulk && i === 0 ? 'ws-check-cell' : undefined}>{translateUi(c.render(row))}</td>))}</tr>))}</tbody></table></div>}{translateUi(!filtered.length && <Empty>{translateUi("No matching records.")}</Empty>)}{pages > 1 && <div className="ws-pagination"><button disabled={current === 1} onClick={() => setPage(current - 1)}>{translateUi("\u2190 Previous")}</button><span>{translateUi("Page ")}{translateUi(current)}{translateUi(" of ")}{translateUi(pages)}</span><button disabled={current >= pages} onClick={() => setPage(current + 1)}>{translateUi("Next \u2192")}</button></div>}</div>;
}
/** Splits a list into pages so popups never need to scroll. */
export function usePaged<T>(items: T[], size = 6, resetKey?: string) {
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [resetKey]);
    const pages = Math.max(1, Math.ceil(items.length / size)), current = Math.min(page, pages);
    return { page: current, pages, setPage, items: items.slice((current - 1) * size, current * size), inPage: (index: number) => Math.floor(index / size) + 1 === current };
}
export function Pager({ page, pages, setPage }: {
    page: number;
    pages: number;
    setPage: (n: number) => void;
}) {
    useSiteLanguage();
    if (pages < 2)
        return null;
    return <div className="ws-pagination"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>{translateUi("\u2190 Previous")}</button><span>{translateUi("Page ")}{translateUi(page)}{translateUi(" of ")}{translateUi(pages)}</span><button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>{translateUi("Next \u2192")}</button></div>;
}
