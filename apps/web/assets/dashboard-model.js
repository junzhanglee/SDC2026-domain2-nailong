import {can,staffId,visibleTasks,visibleRequests} from './engine.js?v=20261023-customer3';

export function malaysiaDate(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const value=type=>parts.find(part=>part.type===type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
function validDate(value) {
  return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
}
function timing(due,today) {
  if(!validDate(due))return {due:null,overdue:false,soon:false};
  const days=(Date.parse(due)-Date.parse(today))/86400000;
  return {due,overdue:days<0,soon:days>=0&&days<3};
}
export function dashboardData(s,now=new Date()) {
  const today=malaysiaDate(now),own=staffId(s),items=[];
  if(!can(s,'dashboard'))return {today,items,projects:[],counts:{approval:0,soon:0,overdue:0,blocked:0}};
  const person=id=>s.staff.find(staff=>staff.id===id)?.name||'未指定';
  const tasks=visibleTasks(s),active=tasks.filter(task=>task.status!=='已完成');
  const projectFor=task=>{
    const exact=s.projects.find(project=>project.name===task.project||project.id===task.projectId);
    const matches=s.projects.filter(project=>project.customer===task.customer);
    const project=exact||(!task.project&&matches.length===1?matches[0]:null);
    return {key:project?.id||`task-project:${task.project||task.customer||task.id}`,name:project?.name||task.project||task.customer||'未归类项目'};
  };
  for(const task of active) {
    const blocked=task.status==='受阻'||!!task.blocked?.trim(),project=projectFor(task),dates=timing(task.due,today);
    items.push({id:`task:${task.id}`,kind:'task',ref:task.id,title:task.title,owner:person(task.assignee),ownerId:task.assignee,projectKey:project.key,projectName:project.name,...dates,dueLabel:'截止',blocked,approval:false,
      detail:blocked?(task.blocked||'任务标记为受阻，需确认原因。'):'',
      next:blocked?(can(s,'business-review')?'确认阻碍原因，协调负责人处理。':'联系管理者确认阻碍，解除后继续执行。'):task.status==='待开始'?'确认需求后开始执行，并记录处理进展。':'核对交付结果，确认无误后标记完成。',
      action:blocked?'处理阻碍':task.status==='待开始'?'开始处理':'标记完成',operation:blocked?'detail':'task',status:task.status});
  }
  if(can(s,'business-review'))for(const q of s.inquiries.filter(q=>q.status==='review'&&(!q.reviewer||q.reviewer===own||s.session.role==='owner'))) {
    items.push({id:`order:${q.id}`,kind:'order',ref:q.id,title:`${q.customer} · 客户请求 ${q.id}`,owner:person(q.reviewer||own),...timing(q.due,today),dueLabel:'期望交付',blocked:false,approval:true,
      next:'核对库存和人员建议，决定是否批准。',detail:q.plan?.reason||'方案信息不完整，请先核对客户需求。',action:'审核方案',operation:'detail'});
  }
  for(const kind of ['leave','claims','ot']) {
    if(!can(s,kind==='claims'?'claim-review':'hr-review'))continue;
    for(const request of visibleRequests(s,kind).filter(request=>request.status==='pending'&&request.staff!==own)) {
      const label={leave:'休假',claims:'报销',ot:'加班'}[kind];
      const context=kind==='leave'?`${request.from} 至 ${request.to} · ${request.days} 天`:kind==='claims'?`RM ${Number(request.amount).toFixed(2)} · ${request.merchant}`:`${request.date} · ${request.hours} 小时`;
      items.push({id:`request:${kind}:${request.id}`,kind:'request',requestKind:kind,ref:request.id,title:`${person(request.staff)} · ${label}申请`,owner:person(own),...timing(request.due,today),dueLabel:'截止',blocked:false,approval:true,
        next:`核对${label}依据及政策，批准或驳回。`,detail:context,action:'审批申请',operation:'detail'});
    }
  }
  if(can(s,'customer-support')) {
    for(const customer of s.customers||[]) {
      const messages=(s.customerMessages||[]).filter(message=>message.customerId===customer.id);
      const latest=messages.at(-1);
      if(latest?.from==='customer')items.push({id:`customer:${customer.id}`,kind:'customer',ref:customer.id,title:`${customer.name} · 客户待回复`,owner:person(own),due:null,dueLabel:'截止',overdue:false,soon:false,blocked:false,approval:false,next:'阅读客户消息并回复，确认需求后建立请求。',detail:latest.text,action:'回复客户',operation:'detail'});
    }
    for(const q of s.inquiries.filter(q=>['new','manual'].includes(q.status)&&(!q.assignee||q.assignee===own)))items.push({id:`inquiry:${q.id}`,kind:'inquiry',ref:q.id,title:`${q.customer} · 需求待整理`,owner:person(q.assignee||own),...timing(q.due,today),dueLabel:'期望交付',blocked:false,approval:false,next:'确认数量与日期，核对信息后交接审批。',detail:q.text,action:'查看客户请求',operation:'detail'});
  }
  const rank=item=>item.overdue?0:item.blocked?1:item.approval?2:['customer','inquiry'].includes(item.kind)?3:item.soon?4:5;
  items.sort((a,b)=>rank(a)-rank(b)||(a.due||'9999').localeCompare(b.due||'9999')||a.title.localeCompare(b.title));
  const projects=[];
  for(const task of active) {
    const project=projectFor(task);
    if(projects.some(item=>item.key===project.key))continue;
    const related=tasks.filter(item=>projectFor(item).key===project.key),pending=related.filter(item=>item.status!=='已完成');
    projects.push({...project,total:related.length,active:pending.length,owners:[...new Set(pending.map(item=>person(item.assignee)))],due:pending.map(item=>item.due).filter(validDate).sort()[0]||null});
  }
  projects.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  return {today,items,projects,counts:{approval:items.filter(item=>item.approval).length,soon:items.filter(item=>item.soon).length,overdue:items.filter(item=>item.overdue).length,blocked:items.filter(item=>item.blocked).length}};
}
export function filterDashboardItems(data,filter='all',project='') {
  const flag={approval:'approval',soon:'soon',overdue:'overdue',blocked:'blocked'}[filter];
  return data.items.filter(item=>(!flag||item[flag])&&(!project||item.projectKey===project));
}
