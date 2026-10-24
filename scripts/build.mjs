import './check.mjs';
import {readFileSync,readdirSync,mkdirSync,writeFileSync,rmSync,cpSync} from 'node:fs';
import {extname} from 'node:path';
const assets={};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
function collect(dir,prefix=''){for(const item of readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+item.name,key=prefix+'/'+item.name;if(item.isDirectory())collect(path,key);else {const type=types[extname(item.name)];if(!type)throw Error('Unsupported web asset: '+path);assets[key]={type,body:readFileSync(path,'utf8')};}}}
collect('apps/web');
rmSync('dist',{recursive:true,force:true});mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
const worker=readFileSync('worker/index.js','utf8').replace('const ASSET_MAP = {};',()=> 'const ASSET_MAP = '+JSON.stringify(assets)+';');
writeFileSync('dist/server/index.js',worker);cpSync('.openai/hosting.json','dist/.openai/hosting.json');
const module=await import('../dist/server/index.js?build='+Date.now());if(typeof module.default?.fetch!=='function')throw Error('Worker must export default.fetch');
console.log('Prepared Worker with '+Object.keys(assets).length+' embedded assets; no local environment files included.');
