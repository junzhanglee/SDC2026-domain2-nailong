import {validLanguage} from './i18n.js';
import {roles} from './data.js';
import {can,requirePermission,staffId,addLog} from './engine.js';
export function currentProfile(s){const id=staffId(s),staff=s.staff.find(e=>e.id===id);return {displayName:s.session?.name||staff?.name||'',email:staff?.email||'',phone:'',bio:'',avatar:'',language:'zh-CN',chatBadges:true,compact:false,reducedMotion:false,reduceTransparency:false,...s.profiles?.[id]};}
export function companySettings(s){return {name:'Kita Studio',industry:s.industry||'印刷与定制礼品',state:s.state||'Selangor',email:'',phone:'',address:'',...s.company};}
export function policy(s){return {annualLeaveDays:14,claimLimit:200,overtimeHours:4,...s.policies};}
function emailValid(v){return !v||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
export function saveProfile(s,fields){
 requirePermission(s,'profile');const displayName=String(fields.displayName||'').trim(),email=String(fields.email||'').trim(),phone=String(fields.phone||'').trim(),bio=String(fields.bio||'').trim();
 if(!displayName||displayName.length>40||!emailValid(email)||email.length>120||phone.length>30||bio.length>300)throw Error('请检查姓名、邮箱与资料长度。');
 const id=staffId(s);s.profiles??={};s.profiles[id]={...currentProfile(s),displayName,email,phone,bio};s.session.name=displayName;
 const staff=s.staff.find(e=>e.id===id);if(staff){staff.name=displayName;staff.email=email;}
 addLog(s,'request','个人资料已更新','更新本人公开工作资料','private-profile');return s.profiles[id];
}
export function saveAvatar(s,avatar){requirePermission(s,'profile');if(avatar&&(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(avatar)||avatar.length>700000))throw Error('请选择较小的 PNG、JPG 或 WebP 图片。');s.profiles??={};s.profiles[staffId(s)]={...currentProfile(s),avatar};}
export function savePersonalPreferences(s,fields){requirePermission(s,'settings');s.profiles??={};const p=currentProfile(s);for(const key of ['chatBadges','compact','reducedMotion','reduceTransparency'])p[key]=fields[key]===true||fields[key]==='on';s.profiles[staffId(s)]=p;}
export function saveCompanySettings(s,fields){
 requirePermission(s,'manage-connectors');const next={};for(const k of ['name','industry','state','email','phone','address'])next[k]=String(fields[k]||'').trim();
 if(!next.name||next.name.length>80||!next.industry||next.industry.length>80||!['Selangor','Kuala Lumpur','Johor','Penang','Perak','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perlis','Sabah','Sarawak','Terengganu','Putrajaya','Labuan'].includes(next.state)||!emailValid(next.email)||next.email.length>120||next.phone.length>30||next.address.length>300)throw Error('请检查企业资料。');
 s.company=next;s.industry=next.industry;s.state=next.state;addLog(s,'request','企业资料已更新',next.name);return next;
}
export function savePolicies(s,fields){
 requirePermission(s,'manage-connectors');const next={annualLeaveDays:Number(fields.annualLeaveDays),claimLimit:Number(fields.claimLimit),overtimeHours:Number(fields.overtimeHours)};
 if(Object.values(fields).some(v=>typeof v==='string'&&!v.trim())||!Number.isInteger(next.annualLeaveDays)||next.annualLeaveDays<0||next.annualLeaveDays>365||!Number.isFinite(next.claimLimit)||next.claimLimit<0||next.claimLimit>100000||!Number.isFinite(next.overtimeHours)||next.overtimeHours<.5||next.overtimeHours>12)throw Error('请检查额度：年假 0–365 天、报销 0–100000 RM、加班提醒 0.5–12 小时。');
 s.policies=next;addLog(s,'request','业务审批规则已更新',`年假 ${next.annualLeaveDays} 天；报销提醒 RM ${next.claimLimit}；加班提醒 ${next.overtimeHours} 小时`);return next;
}
export function personalExport(s){requirePermission(s,'profile');const own=staffId(s);return {exportedAt:new Date().toISOString(),profile:currentProfile(s),staffId:own,role:roles[s.session.role].label,requests:{leave:s.leave.filter(x=>x.staff===own),claims:s.claims.filter(x=>x.staff===own),ot:s.ot.filter(x=>x.staff===own)},daily:s.daily.filter(x=>x.staff===own)};}
export function canManageSettings(s){return can(s,'manage-connectors');}

export function saveLanguage(s,language){requirePermission(s,'settings');if(!validLanguage(language))throw Error('请输入有效的界面语言。');s.profiles??={};s.profiles[staffId(s)]={...currentProfile(s),language};}
