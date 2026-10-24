import {copy,languages} from './locales.js';
export {languages};
const KEY='nexus-interface-language';
export function validLanguage(value){return Object.hasOwn(languages,value);}
let language='zh-CN';
try{const saved=globalThis.localStorage?.getItem(KEY);if(validLanguage(saved))language=saved;}catch{}
export function getLanguage(){return language;}
export function setLanguage(value){
  language=validLanguage(value)?value:'zh-CN';
  try{globalThis.localStorage?.setItem(KEY,language);}catch{}
  if(globalThis.document)document.documentElement.lang=language;
}
const patterns=[
  [/^\/ 共 (\d+) 项工作$/,(_,n)=>({en:`/ ${n} total tasks`,ms:`/ ${n} jumlah tugas`})],
  [/^(.+)，你好。$/,(_,name)=>({en:`Hello, ${name}.`,ms:`Helo, ${name}.`})],
  [/^(.+)，欢迎回来。$/,(_,name)=>({en:`Welcome back, ${name}.`,ms:`Selamat kembali, ${name}.`})],
  [/^(\d+) 位成员$/,(_,n)=>({en:`${n} members`,ms:`${n} ahli`})],
  [/^(\d+) 位同事$/,(_,n)=>({en:`${n} colleagues`,ms:`${n} rakan sekerja`})],
  [/^(\d+) 项待处理$/,(_,n)=>({en:`${n} pending`,ms:`${n} menunggu`})],
  [/^(\d+) 项$/,(_,n)=>({en:`${n} items`,ms:`${n} perkara`})],
  [/^(\d+) 条$/,(_,n)=>({en:`${n} records`,ms:`${n} rekod`})],
  [/^员工编号 (.+)$/,(_,n)=>({en:`Staff ID ${n}`,ms:`ID pekerja ${n}`})],
  [/^按当前职位可见范围统计 · MYT (.+) · 即将到期指今天及后两天，不含逾期和已完成。$/,(_,date)=>({en:`Visible to your role · MYT ${date} · Due soon includes today and the next two days; excludes overdue and completed items.`,ms:`Mengikut peranan anda · MYT ${date} · Hampir tarikh akhir meliputi hari ini dan dua hari berikutnya; tidak termasuk perkara lewat dan selesai.`})],
  [/^发消息给 (.+)……$/,(_,name)=>({en:`Message ${name}…`,ms:`Mesej ${name}…`})],
  [/^全员共享频道 · (\d+) 位成员$/,(_,n)=>({en:`Shared channel · ${n} members`,ms:`Saluran bersama · ${n} ahli`})],
  [/^和 (.+) 打个招呼$/,(_,name)=>({en:`Say hello to ${name}`,ms:`Ucap helo kepada ${name}`})],
  [/^核对(休假|报销|加班)依据及政策，批准或驳回。$/,(_,kind)=>({en:`Check ${copy[kind].en.toLowerCase()} details and policy, then approve or reject.`,ms:`Semak maklumat dan dasar ${copy[kind].ms.toLowerCase()}, kemudian luluskan atau tolak.`})],
  [/^可见活动记录 (\d+) 条。导出范围不等同于企业全部资料。$/,(_,n)=>({en:`${n} visible activity records. This export does not include all company data.`,ms:`${n} rekod aktiviti boleh dilihat. Eksport ini tidak merangkumi semua data syarikat.`})]
];
export function translate(value,locale=language){
  if(locale==='zh-CN'||!validLanguage(locale))return value;
  const source=String(value),key=source.trim();let translated=copy[key]?.[locale];
  if(!translated){for(const [pattern,format] of patterns){const match=key.match(pattern);if(match){translated=format(...match)[locale];break;}}}
  if(!translated&&key.includes(' · '))translated=key.split(' · ').map(part=>copy[part]?.[locale]||part).join(' · ');
  if(!translated&&key.startsWith('# '))translated='# '+(copy[key.slice(2)]?.[locale]||key.slice(2));
  return translated?source.slice(0,source.indexOf(key))+translated+source.slice(source.indexOf(key)+key.length):value;
}
// Preserve original copy so switching languages is reversible, including open dialogs.
const texts=new WeakMap(),attributes=new WeakMap();
const protectedContent='[data-i18n-skip],textarea,script,style,code,.code,.bubble,.broadcast-full-text,.broadcast-banner-title,.message-preview>span,.dashboard-item-title h3,.dashboard-project h3,.dashboard-item-context,.log-detail,.user-button b,.account-menu-summary h2,.profile-summary h2,.customer-request p';
export function translateUI(root=document.body){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    if(node.parentElement?.closest(protectedContent))continue;
    const previous=texts.get(node),source=previous&&node.nodeValue===previous.last?previous.source:node.nodeValue;
    const next=translate(source);texts.set(node,{source,last:next});if(node.nodeValue!==next)node.nodeValue=next;
  }
  for(const el of root.querySelectorAll('[placeholder],[aria-label],[title],option')){
    if(el.closest('[data-i18n-skip]'))continue;
    const saved=attributes.get(el)||{};
    for(const key of ['placeholder','aria-label','title']){
      const value=el.getAttribute(key);if(value===null)continue;
      const source=saved[key]&&value===saved[key].last?saved[key].source:value;
      const next=translate(source);saved[key]={source,last:next};if(next!==value)el.setAttribute(key,next);
    }
    attributes.set(el,saved);
  }
  document.title=language==='zh-CN'?'Nexus · 让生意顺起来':language==='ms'?'Nexus · Ruang kerja anda':'Nexus · Your workspace';
}
export function startTranslations(){
  setLanguage(language);
  // Explicit option values protect business identifiers when the visible label changes.
  const prepareOptions=()=>{for(const option of document.querySelectorAll('option:not([value])'))option.setAttribute('value',option.textContent);};
  prepareOptions();translateUI();
  const observer=new MutationObserver(()=>{prepareOptions();translateUI();});
  observer.observe(document.body,{childList:true,subtree:true});
  return observer;
}
