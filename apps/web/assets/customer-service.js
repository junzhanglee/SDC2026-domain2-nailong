import {roles} from './data.js';
import {can,requirePermission,staffId,addLog,planInquiry} from './engine.js?v=20261023-customer3';

export function migrateCustomerService(s) {
  s.customers ??= [
    {id:'c1',name:'Bunga Café',contact:'Bunga'},
    {id:'c2',name:'Kedai Kita',contact:'Kita'}
  ];
  s.customerMessages ??= [];
}
export function customerAccount(s) {
  migrateCustomerService(s);
  const customer=s.session?.role==='customer' && s.customers.find(c=>c.id===s.session.customerId);
  if(!customer) throw Error('请先通过客户入口登录。');
  return customer;
}
function requireConversation(s,customerId) {
  migrateCustomerService(s);
  const customer=s.customers.find(c=>c.id===customerId);
  if(!customer) throw Error('客户不存在。');
  if(s.session?.role==='customer') {
    if(customerAccount(s).id!==customerId) throw Error('不能查看其他客户的对话。');
  } else requirePermission(s,'customer-support');
  return customer;
}
export function visibleCustomerMessages(s,customerId) {
  requireConversation(s,customerId);
  return s.customerMessages.filter(m=>m.customerId===customerId);
}
export function sendCustomerMessage(s,customerId,text) {
  const customer=requireConversation(s,customerId);
  text=String(text??'').trim();
  if(!text||text.length>2000) throw Error('消息请输入 1–2000 个字符。');
  const from=s.session.role==='customer'?'customer':'support';
  const message={id:crypto.randomUUID(),customerId,from,by:s.session.name,text,createdAt:new Date().toISOString()};
  s.customerMessages.push(message);
  // Keep customer messages out of internal group chat and public broadcasts.
  addLog(s,'request',from==='customer'?'客户发来消息':'客服回复客户',customer.name+' · 站内客户会话','customer-service',roles.support.staff);
  return message;
}
export function customerRequestSummaries(s) {
  const customer=customerAccount(s);
  return s.inquiries.filter(q=>q.customerId===customer.id).map(q=>({id:q.id,text:q.text,qty:q.qty,due:q.due,status:q.status}));
}
export function visibleHandoffs(s) {
  if(!can(s,'work')) return [];
  return s.inquiries.filter(q=>q.plan&&q.status==='review'&&(can(s,'business-review')||q.plan.assignee===staffId(s)));
}
export function createSupportInquiry(s,fields) {
  requirePermission(s,'create-inquiry');
  if(s.session.role!=='support') throw Error('只有客服可以新建客户请求。');
  migrateCustomerService(s);
  const customerId=String(fields.customerId||''),customer=s.customers.find(c=>c.id===customerId);
  const text=String(fields.text||'').trim(),qty=Number(fields.qty),due=String(fields.due||'');
  const reviewer=String(fields.reviewer||''),requestedAssignee=String(fields.assignee||'');
  if(!customer) throw Error('请选择客户账户。');
  if(!text||text.length>1500) throw Error('请填写 1–1500 字的客户需求。');
  if(!Number.isInteger(qty)||qty<1||qty>100000) throw Error('数量必须为 1–100000 的整数。');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(due)||!Number.isFinite(Date.parse(due))||new Date(due).toISOString().slice(0,10)!==due) throw Error('请填写有效交付日期。');
  if(![roles.owner.staff,roles.manager.staff].includes(reviewer)) throw Error('请选择企业主或管理者审批。');
  if(requestedAssignee&&!s.staff.some(e=>e.id===requestedAssignee&&e.skill==='印刷'&&e.capacity>0)) throw Error('请选择有效的执行员工。');
  const sourceMessageId=String(fields.sourceMessageId||'');
  if(sourceMessageId) {
    const source=s.customerMessages.find(m=>m.id===sourceMessageId&&m.customerId===customerId&&m.from==='customer');
    if(!source) throw Error('来源消息与客户不匹配。');
    if(s.inquiries.some(q=>q.sourceMessageId===sourceMessageId)) throw Error('这条客户消息已建立请求，请跟进已有请求。');
  }
  const q={id:'Q-'+crypto.randomUUID().slice(0,8),customerId,customer:customer.name,text,qty,due,reviewer,requestedAssignee,sourceMessageId,createdBy:staffId(s),status:'new',assignee:staffId(s),source:'客服整理 · 客户账户',plan:null};
  // Plan against a temporary list: invalid handoffs must not leave partial requests/logs.
  const draft={...s,inquiries:[q],logs:[]};
  planInquiry(draft,q.id);
  if(!q.plan.assignee) throw Error('该交付日没有可用执行人员。请调整日期或选择其他员工。');
  s.inquiries.unshift(q);
  addLog(s,'request','客服建立请求并交接',`${q.id} · ${customer.name} · 审批 ${reviewer} · 建议员工 ${q.plan.assignee}`,'operations');
  return q;
}
