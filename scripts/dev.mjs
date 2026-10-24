import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.js';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('drizzle/0000_ai_usage.sql','utf8'));
const DB={prepare(sql){return {bind(...args){return {async first(){return sqlite.prepare(sql).get(...args);}};}};}};
const server=createServer(async(req,res)=>{try{let body='';for await(const chunk of req){body+=chunk;if(body.length>12000){res.writeHead(413);res.end();return;}}const headers=new Headers(req.headers);headers.delete('oai-authenticated-user-id');headers.set('oai-authenticated-user-id','local-preview');const url='http://127.0.0.1:4173'+req.url;const request=new Request(url,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body})});const response=await worker.fetch(request,{OPENAI_API_KEY:process.env.OPENAI_API_KEY,DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Preview failed');}});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173 (local preview identity only; never deploy this server)'));
