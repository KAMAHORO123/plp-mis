import { useState, type ReactNode } from 'react';
import { Empty } from './ui';
export function RecordTable<T extends {id:string}>({title,rows,columns,searchText}:{title:string;rows:T[];columns:{label:string;render:(row:T)=>ReactNode}[];searchText:(row:T)=>string}) {
 const [query,setQuery]=useState(''),[page,setPage]=useState(1);
 const filtered=rows.filter(r=>searchText(r).toLowerCase().includes(query.toLowerCase()));
 const pages=Math.max(1,Math.ceil(filtered.length/8)),current=Math.min(page,pages);
 return <div><div className="ws-table-tools"><input aria-label={`Search ${title}`} value={query} placeholder={`Search ${title.toLowerCase()}`} onChange={e=>{setQuery(e.target.value);setPage(1);}}/><span>{filtered.length} {filtered.length===1?'record':'records'}</span></div><div className="ws-table-wrap"><table className="ws-table"><thead><tr>{columns.map(c=><th key={c.label}>{c.label}</th>)}</tr></thead><tbody>{filtered.slice((current-1)*8,current*8).map(row=><tr key={row.id}>{columns.map(c=><td key={c.label}>{c.render(row)}</td>)}</tr>)}</tbody></table></div>{!filtered.length&&<Empty>No matching records.</Empty>}<div className="ws-pagination"><button disabled={current===1} onClick={()=>setPage(current-1)}>← Previous</button><span>Page {current} of {pages}</span><button disabled={current>=pages} onClick={()=>setPage(current+1)}>Next →</button></div></div>;
}
