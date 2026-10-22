import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const file of ['apps/web/assets/app.js','apps/web/assets/data.js','apps/web/assets/engine.js'])execFileSync(process.execPath,['--check',file]);
const html=readFileSync('apps/web/index.html','utf8');
for(const file of ['assets/style.css','assets/app.js'])if(!html.includes(file)||!existsSync('apps/web/'+file))throw Error('Missing website asset: '+file);
const contract=JSON.parse(readFileSync('contracts/openapi.json','utf8'));
if(!contract.paths||Object.keys(contract.paths).length<6)throw Error('Missing integration contracts');
console.log('Static site, modules and integration contract checks passed.');
