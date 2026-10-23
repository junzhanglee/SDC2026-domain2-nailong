import {roles} from './data.js';
import {can,requirePermission,staffId} from './engine.js?v=20261023-customer3';
import {migrateCustomerService,customerAccount,visibleCustomerMessages,customerRequestSummaries,visibleHandoffs} from './customer-service.js?v=20261023-customer3';

export function createCustomerUI({getState,esc,icon,btn,badge,heading,modal}) {
  let activeCustomer='c1';
  const stamp=value=>new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Kuala_Lumpur',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
  const stateText=q=>q.status==='approved'?'已安排内部处理，交期由客服确认':q.status==='review'?'客服已建单，等待负责人确认':'客服跟进中';
  function loginForm(){
    const s=getState();migrateCustomerService(s);
    return `<form class="login-form" id="customer-login-form"><div class="eyebrow">NEXUS CUSTOMER</div><h2>与客服，直接联系。</h2><p class="intro">发送需求、跟进回复，查看自己的请求进度。</p><div class="field"><label for="customer-account">客户账户（演示）</label><select id="customer-account" name="customerId">${s.customers.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label for="customer-contact">你的称呼</label><input id="customer-contact" name="name" required maxlength="40" placeholder="客服该如何称呼你？" autocomplete="name"></div><button class="btn login-submit" type="submit">进入客户账户 ${icon('arrow')}</button><p class="footer-note">客户入口独立于员工工作空间，仅展示当前客户的对话和请求。当前为固定客户身份演示，尚未接入密码验证与跨设备消息；请勿填写真实敏感资料。</p></form>`;
  }
  function conversation(customerId,isCustomer){
    const messages=visibleCustomerMessages(getState(),customerId);
    return `<div class="customer-messages" role="log" aria-label="客户与客服消息记录" tabindex="0">${messages.map(m=>{
      const mine=isCustomer?m.from==='customer':m.from==='support';
      const linked=getState().inquiries.find(q=>q.sourceMessageId===m.id);
      return `<div class="customer-message ${mine?'mine':''}"><div class="bubble"><small>${esc(m.by)} · ${m.from==='support'?'客服':'客户'} · ${stamp(m.createdAt)}</small>${esc(m.text)}</div>${!isCustomer&&m.from==='customer'?`<div class="customer-message-action">${linked?badge('已建立 '+linked.id,'gray'):btn('根据此消息建立请求','customer-to-inquiry','small secondary',`data-message="${esc(m.id)}" data-customer="${esc(customerId)}"`)}</div>`:''}</div>`;
    }).join('')||`<div class="empty">${isCustomer?'告诉客服你的需求，所有后续回复都在这里。':'暂无客户消息。客户发送消息后会进入此对话。'}</div>`}</div><form id="customer-message-form" data-customer="${esc(customerId)}"><div class="field"><label for="customer-message-input">${isCustomer?'发送给客服':'回复客户'}</label><textarea id="customer-message-input" name="text" required maxlength="2000" placeholder="${isCustomer?'请描述产品、数量、期望日期或需要帮助的问题……':'输入将展示给这位客户的回复……'}"></textarea></div><div class="actions"><button class="btn" type="submit">发送${icon('arrow')}</button><small>站内演示消息 · 同源标签页同步</small></div></form>`;
  }
  function portal(){
    const s=getState(),customer=customerAccount(s),requests=customerRequestSummaries(s);
    return `<div class="customer-portal"><header class="topbar customer-header"><div class="brand"><i class="brand-mark"></i>Nexus</div><div class="actions"><span class="tag blue">客户账户</span>${btn('退出','logout','small secondary')}</div></header><main id="main-content" class="customer-content" tabindex="-1">${heading('YOUR REQUEST, CONNECTED',`${esc(customer.name)}，欢迎回来。`,'这里是你的专属客服窗口。消息由客服跟进，确认需求后交给团队处理。')}<div class="customer-portal-grid"><section class="card"><div class="card-head"><h2>与客服 Nur 对话</h2>${badge('客户服务','blue')}</div>${conversation(customer.id,true)}</section><aside><section class="card"><div class="card-head"><h2>我的请求</h2>${badge(requests.length+' 项','gray')}</div>${requests.map(q=>`<article class="customer-request"><b>${esc(q.id)}</b><p>${esc(q.text)}</p><small>需求数量 ${q.qty} · 期望日期 ${esc(q.due)}</small><p>${badge(stateText(q),q.status==='approved'?'':'orange')}</p></article>`).join('')||'<p class="muted">你还没有已建立的请求。发送需求后，由客服确认信息并建单。</p>'}</section><div class="notice">流程：你发送需求 → 客服整理 → 负责人确认 → 员工处理。期望日期不代表已承诺交付。</div><p class="footer-note">这是浏览器内演示；换设备或浏览器不会自动同步账户与消息。</p></aside></div></main></div>`;
  }
  function supportPanel(){
    const s=getState();requirePermission(s,'customer-support');migrateCustomerService(s);
    if(!s.customers.some(c=>c.id===activeCustomer))activeCustomer=s.customers[0]?.id;
    return `<section class="card support-customer-panel"><div class="card-head"><div><h2>客户对话</h2><p class="footer-note">确认客户消息，再整理为交给员工和管理者的请求。</p></div>${badge('客服专属','blue')}</div><div class="tabbar" aria-label="选择客户">${s.customers.map(c=>`<button data-action="customer-thread" data-customer="${esc(c.id)}" class="${activeCustomer===c.id?'active':''}" aria-pressed="${activeCustomer===c.id}">${esc(c.name)}</button>`).join('')}</div>${activeCustomer?conversation(activeCustomer,false):''}</section>`;
  }
  function compose(customerId='',messageId=''){
    const s=getState();requirePermission(s,'create-inquiry');migrateCustomerService(s);
    if(!customerId)customerId=activeCustomer;
    const message=messageId?visibleCustomerMessages(s,customerId).find(m=>m.id===messageId&&m.from==='customer'):null;
    if(messageId&&!message)throw Error('来源消息不可用。');
    const due=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
    modal('客服 · 建立客户请求',`<form id="inquiry-form"><input type="hidden" name="sourceMessageId" value="${esc(messageId)}"><div class="field"><label for="inq-customer">客户账户</label>${message?`<input type="hidden" name="customerId" value="${esc(customerId)}"><input id="inq-customer" value="${esc(s.customers.find(c=>c.id===customerId)?.name)}" readonly>`:`<select id="inq-customer" name="customerId" required>${s.customers.map(c=>`<option value="${esc(c.id)}" ${c.id===customerId?'selected':''}>${esc(c.name)}</option>`).join('')}</select>`}</div><div class="field"><label for="inq-text">客服确认的需求</label><textarea id="inq-text" name="text" required maxlength="1500">${esc(message?.text||'')}</textarea></div><div class="form-grid"><div class="field"><label for="inq-qty">定制杯数量</label><input id="inq-qty" name="qty" type="number" min="1" max="100000" step="1" required value="100"></div><div class="field"><label for="inq-due">期望交付日期</label><input id="inq-due" name="due" type="date" required value="${due}"></div><div class="field"><label for="inq-assignee">建议执行员工</label><select id="inq-assignee" name="assignee"><option value="">按休假与产能自动建议</option>${s.staff.filter(e=>e.skill==='印刷').map(e=>`<option value="${e.id}">${esc(e.name)} · ${esc(e.role)}</option>`).join('')}</select></div><div class="field"><label for="inq-reviewer">审批负责人</label><select id="inq-reviewer" name="reviewer" required><option value="${roles.manager.staff}">Aisha · 管理者</option><option value="${roles.owner.staff}">Li Wei · 企业主</option></select></div></div><div class="notice">建立后会核对库存和人员，将请求交给指定负责人审批，并让建议执行员工看到待确认交接。负责人批准后才创建任务。本原型订单核对范围为定制杯，不自动发送报价或承诺交期。</div><button class="btn" type="submit">建立请求并交接 ${icon('arrow')}</button></form>`);
  }
  function handoffs(){
    const s=getState(),requests=visibleHandoffs(s);
    if(!requests.length)return '';
    return `<section class="card"><div class="card-head"><h2>客服交接 · 待确认请求</h2>${badge(requests.length+' 项','orange')}</div>${requests.map(q=>`<div class="row"><div><h3>${esc(q.customer)} · ${esc(q.id)}</h3><p>${esc(q.text)}<br>数量 ${q.qty} · 期望日期 ${esc(q.due)}<br>建议执行：${esc(s.staff.find(e=>e.id===q.plan.assignee)?.name)} · 审批：${esc(s.staff.find(e=>e.id===q.reviewer)?.name||'管理者')}</p></div><div class="row-end">${badge('等待负责人确认','orange')}${can(s,'business-review')?btn('前往审批','nav','small secondary','data-page="approvals"'):''}</div></div>`).join('')}<p class="footer-note">这是待确认交接，不是已生效任务。负责人确认后进入任务看板。</p></section>`;
  }
  return {loginForm,portal,supportPanel,compose,handoffs,setCustomer(id){activeCustomer=id;}};
}
