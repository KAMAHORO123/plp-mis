import { useState, type ReactNode } from 'react';
import { Empty } from './ui';
export function RecordTable<T extends {id:string}>({title,rows,columns,searchText,pageSize=8}:{title:string;rows:T[];columns:{label:string;render:(row:T)=>ReactNode}[];searchText:(row:T)=>string;pageSize?:number}) {
 const [query,setQuery]=useState(''),[page,setPage]=useState(1);
 const filtered=rows.filter(r=>searchText(r).toLowerCase().includes(query.toLowerCase()));
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize)),current=Math.min(page,pages);
 return <div><div className="ws-table-tools"><input aria-label={`Search ${title}`} value={query} placeholder={`Search ${title.toLowerCase()}`} onChange={e=>{setQuery(e.target.value);setPage(1);}}/><span>{filtered.length} {filtered.length===1?'record':'records'}</span></div><div className="ws-table-wrap"><table className="ws-table"><thead><tr>{columns.map(c=><th key={c.label}>{c.label}</th>)}</tr></thead><tbody>{filtered.slice((current-1)*pageSize,current*pageSize).map(row=><tr key={row.id}>{columns.map(c=><td key={c.label}>{c.render(row)}</td>)}</tr>)}</tbody></table></div>{!filtered.length&&<Empty>No matching records.</Empty>}<div className="ws-pagination"><button disabled={current===1} onClick={()=>setPage(current-1)}>← Previous</button><span>Page {current} of {pages}</span><button disabled={current>=pages} onClick={()=>setPage(current+1)}>Next →</button></div></div>;
}

/** Splits a list into pages so popups never need to scroll. */
export function usePaged<T>(items:T[],size=6){
 const [page,setPage]=useState(1);
 const pages=Math.max(1,Math.ceil(items.length/size)),current=Math.min(page,pages);
 return {page:current,pages,setPage,items:items.slice((current-1)*size,current*size),inPage:(index:number)=>Math.floor(index/size)+1===current};
}
export function Pager({page,pages,setPage}:{page:number;pages:number;setPage:(n:number)=>void}){
 if(pages<2)return null;
 return <div className="ws-pagination"><button type="button" disabled={page===1} onClick={()=>setPage(page-1)}>← Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page>=pages} onClick={()=>setPage(page+1)}>Next →</button></div>;
}
