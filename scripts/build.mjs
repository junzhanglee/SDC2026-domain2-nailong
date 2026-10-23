import './check.mjs';
import {cpSync,mkdirSync} from 'node:fs';
mkdirSync('dist',{recursive:true});
cpSync('apps/web/index.html','dist/index.html');
cpSync('apps/web/assets','dist/assets',{recursive:true});
console.log('Prepared dist/ for static hosting.');
