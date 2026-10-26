import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export function createServer({contentFile=process.env.CONTENT_FILE||fileURLToPath(new URL('./announcement.json',import.meta.url)),platformUrl=process.env.PLATFORM_URL,origin=process.env.PUBLIC_SITE_ORIGIN||'http://localhost:5174'}={}){
 return http.createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.headers.origin===origin)res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Vary','Origin');
  const url=new URL(req.url,'http://localhost');
  if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});return res.end(JSON.stringify({error:'Method not allowed'}));}
  if(url.pathname==='/healthz')return res.end(JSON.stringify({status:'ok'}));
  if(url.pathname!=='/v1/announcement'){res.writeHead(404);return res.end(JSON.stringify({error:'Not found'}));}
  try{let data;if(platformUrl){const upstream=await fetch(new URL('/public/announcement',platformUrl),{signal:AbortSignal.timeout(5000)});if(!upstream.ok)throw Error('Unavailable');data=await upstream.json();}else data=JSON.parse(await readFile(contentFile,'utf8'));
   const fields=['title','date','location','href','linkLabel'];
   if(typeof data.enabled!=='boolean'||fields.some(k=>typeof data[k]!=='string'))throw Error('Invalid content');
   const safe=/^\/(?!\/)/.test(data.href)&&!/[\\\s]/.test(data.href)||/^https:\/\//.test(data.href);
   const active=data.enabled&&!data.sample&&/^\d{4}-\d{2}-\d{2}$/.test(data.date)&&data.date>=new Date().toISOString().slice(0,10)&&safe;
   res.setHeader('Cache-Control','public, max-age=60');
   res.end(JSON.stringify({enabled:!!active,...Object.fromEntries(fields.map(k=>[k,data[k]])),sample:false}));
  }catch{res.writeHead(503);res.end(JSON.stringify({error:'Content unavailable'}));}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))createServer().listen(Number(process.env.PORT||8080),'0.0.0.0');
