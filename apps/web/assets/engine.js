import {roles} from './data.js';
export const permissions = {
 owner:['dashboard','inbox','approvals','people','work','chat','connect','logs','strategy','hr-import','hr-review','claim-review','business-review','announce'],
 manager:['dashboard','inbox','approvals','people','work','chat','logs','strategy','hr-review','business-review','announce'],
 hr:['dashboard','approvals','people','work','chat','logs','strategy','hr-import','hr-review','announce'],
 finance:['dashboard','approvals','people','work','chat','connect','logs','strategy','claim-review'],
 employee:['dashboard','people','work','chat','logs','strategy'],
 support:['dashboard','inbox','people','work','chat','logs','strategy']
};
export function can(s,p){return !!s.session && (permissions[s.session.role]||[]).includes(p);}
export function requirePermission(s,p){if(!can(s,p)) throw Error('当前职位没有这项操作权限。');}
export function staffId(s){return roles[s.session?.role]?.staff;}
export function ownOrTeam(s,id){return can(s,'business-review') || id===staffId(s);}
export function visibleTasks(s){return s.tasks.filter(t=>ownOrTeam(s,t.assignee));}
export function visibleRequests(s,kind){const scope=kind==='claims'?'claim-review':'hr-review';return s[kind].filter(x=>can(s,scope)||x.staff===staffId(s));}
export function visibleLogs(s){return s.logs.filter(l=>s.session?.role==='owner'|| l.staff===staffId(s) || (l.visibility==='operations'&&can(s,'business-review')) || (l.visibility==='hr'&&can(s,'hr-import')) || (l.visibility==='finance'&&can(s,'claim-review')));}
export function addLog(s,type,title,detail,visibility='operations',subject=staffId(s)){
 s.logs.unshift({id:crypto.randomUUID(),time:new Date().toISOString(),type,title,detail,visibility,actor:s.session?.name||'系统',staff:subject});
}
export function planInquiry(s,id){
 requirePermission(s,'inbox');const q=s.inquiries.find(q=>q.id===id);if(!q)throw Error('找不到客户请求');
 if(!['new','review'].includes(q.status))throw Error('该请求已处理，不能重复分析。');
 const missing=Math.max(0,q.qty-s.stock);
 const unavailable=s.leave.filter(l=>l.status==='approved'&&l.from<=q.due&&l.to>=q.due).map(l=>l.staff);
 const candidates=s.staff.filter(e=>e.skill==='印刷'&&e.capacity>0&&!unavailable.includes(e.id)).sort((a,b)=>b.capacity-a.capacity);
 q.plan={missing,unavailable,assignee:candidates[0]?.id||null,reason:missing?`现货 ${s.stock} 个，需求 ${q.qty} 个，缺 ${missing} 个。`:'库存充足。',decision:missing?'先补货，交期需人工确认':'可进入排期审批',at:new Date().toISOString()};q.status='review';
 addLog(s,'analysis','已生成订单建议',`${q.id} · ${q.plan.reason} 仅生成建议，未向客户发送。`);return q.plan;
}
export function approveInquiry(s,id){
 requirePermission(s,'business-review');const q=s.inquiries.find(q=>q.id===id);
 if(!q||q.status!=='review'||!q.plan)throw Error('请先分析该请求；已审批请求不能重复执行。');
 // Re-evaluate mutable business data at approval time.
 planInquiry(s,id); if(!q.plan.assignee)throw Error('没有可用制作人员，请先安排人员。');
 q.status='approved';s.tasks.push({id:'T-'+crypto.randomUUID().slice(0,6),title:`${q.customer} · ${q.qty} 个定制杯${q.plan.missing?'（等待补货）':''}`,customer:q.customer,project:`${q.customer} 客户订单`,assignee:q.plan.assignee,due:q.due,status:q.plan.missing?'受阻':'待开始',blocked:q.plan.missing?`缺货 ${q.plan.missing} 个；补货后再承诺交期`:''});
 addLog(s,'approval','订单方案已审批并创建任务',`${q.id} · 负责人 ${s.staff.find(e=>e.id===q.plan.assignee).name} · 尚未对外发送或支付`);
}
export function reviewRequest(s,kind,id,approved){
 if(!['leave','claims','ot'].includes(kind))throw Error('未知申请类型');requirePermission(s,kind==='claims'?'claim-review':'hr-review');
 const req=s[kind].find(x=>x.id===id);if(!req||req.status!=='pending')throw Error('申请不存在或已处理。');
 if(req.staff===staffId(s))throw Error('不能审批自己的申请，请交由另一位有权限的人员。');
 if(approved&&kind==='leave') {const used=s.leave.filter(l=>l.staff===req.staff&&l.status==='approved').reduce((n,l)=>n+l.days,0);if(used+req.days>14)throw Error('演示年假余额不足，请调整天数。');}
 req.status=approved?'approved':'rejected';addLog(s,'approval',`${kind==='claims'?'报销':kind==='ot'?'加班':'休假'}${approved?'已批准':'已驳回'}`,req.id,kind==='claims'?'finance':'hr',req.staff);
}
export function analyzeMessage(text){
 const external=/(报价|quote|refund|退款|付款|pay|order|订单|定制|杯)/i.test(text);
 return {intent:external?'订单／交易咨询':'一般服务咨询',route:external?'客户服务 → 主管审批':'客户服务',reply:external?'已收到您的需求。我们会先核对库存、排期与报价，再由负责人确认回复。':'谢谢您的留言。我们的客服会查看详情并为您跟进。',note:'规则引擎演示：不编造价格、付款状态或交期；真实 AI 服务未配置。'};
}
export function parseCSV(text){
 let rows=[],row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell.trim());cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('CSV 引号未闭合');row.push(cell.trim());if(row.some(Boolean))rows.push(row);
 const heads=(rows.shift()||[]).map(h=>h.replace(/^\uFEFF/,''));if(!['name','team','skill','capacity'].every(h=>heads.includes(h)))throw Error('请使用模板字段：name,team,skill,capacity');
 if(!rows.length)throw Error('表格没有员工记录');if(rows.length>200)throw Error('演示最多分析 200 行');
 return rows.map((r,i)=>{const v=Object.fromEntries(heads.map((h,j)=>[h,r[j]||'']));if(!v.name||!v.team||!v.skill||!v.capacity||!Number.isFinite(+v.capacity)||+v.capacity<0||+v.capacity>24)throw Error(`第 ${i+2} 行资料不完整或 capacity 不在 0–24 小时范围`);return {...v,capacity:+v.capacity};});
}
export function monthlySummary(s){const logs=visibleLogs(s);const month=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit'}).format(new Date());const current=logs.filter(l=>{const d=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit'}).format(new Date(l.time));return d===month;});return {month,count:current.length,approvals:current.filter(l=>l.type==='approval').length,errors:current.filter(l=>l.type==='error').length,analyses:current.filter(l=>l.type==='analysis').length};}
