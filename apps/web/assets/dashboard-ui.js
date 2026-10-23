import {roles} from './data.js';
import {can,staffId,visibleTasks,directRoom} from './engine.js?v=20261023-customer3';
import {dashboardData,filterDashboardItems} from './dashboard-model.js?v=20261023-home2';

export function createDashboardUI({getState,esc,btn,modal,requestRow,navigate,openCustomer}) {
  let selected='all',project='';
  const labels={all:'全部事项',approval:'待我审批',soon:'3日内到期',overdue:'已逾期',blocked:'有阻碍'};
  function render() {
    const s=getState(),data=dashboardData(s),rows=filterDashboardItems(data,selected,project);
    const projectName=data.projects.find(item=>item.key===project)?.name;
    const metrics=[['approval','待审批'],['soon','即将到期'],['overdue','逾期'],['blocked','阻塞']];
    return `<div class="dashboard-home"><header class="dashboard-heading"><h1 tabindex="-1">工作概览 <span title="${esc(s.session.name)}">${esc(s.session.name)}，你好。</span></h1>${can(s,'create-inquiry')?btn('新建客户请求','new-inquiry','small secondary'):''}</header><div class="dashboard-metrics" role="group" aria-label="筛选工作事项">${metrics.map(([key,label])=>`<button data-action="dashboard-filter" data-filter="${key}" class="dashboard-metric ${selected===key?'selected':''} ${data.counts[key]&&['overdue','blocked'].includes(key)?'has-'+key:''}" aria-pressed="${selected===key}"><span>${label}</span><strong>${data.counts[key]}</strong></button>`).join('')}</div><p class="dashboard-scope">按当前职位可见范围统计 · MYT ${data.today} · 即将到期指今天及后两天，不含逾期和已完成。</p><div class="dashboard-layout"><section class="dashboard-panel dashboard-todos" aria-labelledby="dashboard-todos-title"><div class="dashboard-section-head"><h2 id="dashboard-todos-title">需要我处理 <span>${rows.length}</span></h2><button data-action="dashboard-filter" data-filter="all" class="dashboard-reset" ${selected==='all'&&!project?'hidden':''}>显示全部</button></div><p class="dashboard-list-caption">${projectName?esc(projectName):selected==='all'?'逾期、阻塞和待确认事项优先。':esc(labels[selected])}${selected==='all'?'':' · '+(selected==='approval'?'不包含本人申请和其他负责人专属审批。':'按实际日期与状态筛选。')}</p><div class="dashboard-list" aria-live="polite">${rows.length?rows.map(row).join(''):`<div class="dashboard-empty"><strong>${selected==='all'&&!project?'暂时没有需要处理的事项':'当前筛选下没有事项'}</strong><p>${selected==='all'&&!project?'新任务或待审批申请到达后，会显示在这里。':'可以显示全部事项，或选择其他指标。'}</p></div>`}</div></section><aside class="dashboard-panel dashboard-projects" aria-labelledby="dashboard-projects-title"><div class="dashboard-section-head"><h2 id="dashboard-projects-title">当前项目 <span>${data.projects.length}</span></h2></div>${data.projects.length?`<div class="dashboard-project-list">${data.projects.map(p=>`<article class="dashboard-project"><h3>${esc(p.name)}</h3><p>待完成 <b>${p.active}</b> / 共 ${p.total} 项工作</p><dl><div><dt>负责人</dt><dd>${esc(p.owners.join('、'))}</dd></div><div><dt>最近截止</dt><dd>${p.due?`<time datetime="${p.due}">${p.due}</time>`:'未设置'}</dd></div></dl><button class="dashboard-project-link" data-action="dashboard-project" data-project="${esc(p.key)}" aria-pressed="${project===p.key}">查看该项目事项 →</button></article>`).join('')}</div>`:'<div class="dashboard-empty"><p>暂无与你相关的进行中项目。</p></div>'}</aside></div></div>`;
  }
  function row(item) {
    const flags=[item.overdue?'<span class="dashboard-flag overdue">已逾期</span>':'',item.blocked?'<span class="dashboard-flag blocked">有阻碍</span>':'',item.approval?'<span class="dashboard-flag">待我审批</span>':'',!item.overdue&&item.soon?'<span class="dashboard-flag">3日内到期</span>':''].join('');
    const action=item.operation==='task'?btn(item.action,'task','small',`data-id="${esc(item.ref)}"`):btn(item.action,'dashboard-item','small',`data-id="${esc(item.id)}"`);
    return `<article class="dashboard-item ${item.overdue?'is-overdue':item.blocked?'is-blocked':''}" data-item="${esc(item.id)}"><div class="dashboard-item-content"><div class="dashboard-item-title"><h3>${esc(item.title)}</h3><div class="dashboard-flags">${flags}</div></div><p class="dashboard-next">${esc(item.next)}</p>${item.detail?`<p class="dashboard-item-context" title="${esc(item.detail)}">${esc(item.detail)}</p>`:''}<dl class="dashboard-item-meta"><div><dt>${item.dueLabel}</dt><dd>${item.due?`<time datetime="${item.due}">${item.due}</time>`:'未设置截止时间'}</dd></div><div><dt>负责人</dt><dd>${esc(item.owner)}</dd></div></dl></div><div class="dashboard-item-actions">${action}</div></article>`;
  }
  function openItem(id) {
    const s=getState(),item=dashboardData(s).items.find(item=>item.id===id);
    if(!item)throw Error('事项已处理或当前无权查看，请刷新列表。');
    if(item.kind==='customer'){openCustomer(item.ref);return;}
    if(item.kind==='inquiry'){navigate('inbox');return;}
    if(item.kind==='request') {
      const request=s[item.requestKind].find(request=>request.id===item.ref);
      modal('审批申请',requestRow(request,item.requestKind,true));return;
    }
    if(item.kind==='order') {
      const q=s.inquiries.find(q=>q.id===item.ref);
      modal('确认客户方案',`<h3>${esc(q.customer)} · ${esc(q.id)}</h3><p>${esc(q.text)}</p><div class="notice">${esc(q.plan?.reason||'尚无完整建议')}<br>期望交付：${esc(q.due||'未设置')}<br>建议执行：${esc(s.staff.find(person=>person.id===q.plan?.assignee)?.name||'暂无可用人员')}</div><p class="muted">批准时会重新核对库存和人员。期望日期不代表已承诺交付。</p><div class="actions">${q.plan?btn('批准方案并创建任务','approve-order','',`data-id="${esc(q.id)}"`):''}${btn('查看客户请求','nav','secondary','data-page="inbox"')}</div>`);return;
    }
    const task=visibleTasks(s).find(task=>task.id===item.ref),own=staffId(s),manager=can(s,'business-review');
    const recipient=manager&&task.assignee!==own?task.assignee:roles.manager.staff;
    const contact=recipient!==own&&s.staff.some(person=>person.id===recipient)?btn(manager&&recipient===task.assignee?'联系执行人':'联系管理者','room','secondary',`data-room="${directRoom(own,recipient)}"`):'';
    modal('处理工作阻碍',`<h3>${esc(task.title)}</h3><p class="dashboard-detail-reason">${esc(task.blocked||'任务标记为受阻，请先确认具体原因。')}</p><p class="muted">截止：${esc(task.due||'未设置')} · 负责人：${esc(item.owner)}</p><div class="actions">${manager&&task.status==='受阻'?btn('确认阻碍已解除','dashboard-unblock','',`data-id="${esc(task.id)}"`):''}${contact}${btn('查看项目','nav','secondary','data-page="work"')}</div>`);
  }
  return {render,openItem,setFilter(value){if(!Object.hasOwn(labels,value))throw Error('未知筛选条件');selected=value;project='';},setProject(value){if(!dashboardData(getState()).projects.some(p=>p.key===value))throw Error('项目不可见');selected='all';project=value;}};
}
