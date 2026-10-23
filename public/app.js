const app = document.querySelector('#app');
const toastEl = document.querySelector('#toast');
const roleNames = { registrar: '登记员', reviewer: '授权审核人', receiver: '接收人', admin: '配置负责人' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = value => value ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Kuala_Lumpur', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) + ' MYT' : '—';
const statusClass = value => ({ 待审核: 'review', 待交接: 'handoff', 已交接: 'done', 异常: 'error', 退回: 'return' })[value] || '';
const badge = value => `<span class="badge ${statusClass(value)}">${esc(value)}</span>`;
let state, companyId, userId, demoAccounts = [], authGeneration = 0;
let filter = '待我处理', search = '', selectedSample = 'A', toastTimer, busy = false, completion = null;
const userName = uid => state.users.find(u => u.id === uid)?.name || uid || '未指定';
const parcel = () => state.parcels.find(p => p.id === decodeURIComponent(location.hash.slice(8)));
const route = () => location.hash.startsWith('#parcel/') ? 'detail' : (location.hash === '#main' ? 'overview' : (location.hash.slice(1) || 'overview'));
function toast(message, error = false) { clearTimeout(toastTimer); toastEl.textContent = message; toastEl.className = `show${error ? ' error' : ''}`; toastTimer = setTimeout(() => { toastEl.className = ''; }, error ? 8500 : 4500); }
async function api(path, data) {
  const generation = authGeneration;
  const response = await fetch(path, { method: data ? 'POST' : 'GET', credentials: 'same-origin', headers: data ? { 'Content-Type': 'application/json' } : {}, ...(data ? { body: JSON.stringify(data) } : {}) });
  const result = await response.json();
  if (generation !== authGeneration) throw new Error('账号会话已变化，请重试。');
  if (!response.ok) {
    const error = new Error(result.error || result.message || '请求失败'); error.data = result; error.status = response.status;
    if (response.status === 401 && !path.includes('/auth/login')) { state = null; authGeneration++; renderLogin(path === '/api/state' ? '' : error.message); }
    throw error;
  }
  return result;
}
async function refresh(animate = false) { const result = await api('/api/state'); state = result; companyId = state.company.id; userId = state.user.id; render(animate); }
function go(value) { if (location.hash === `#${value}`) render(true); else location.hash = value; }
function icon(name) {
  const paths = { tasks: '<path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01"/>', add: '<path d="M12 5v14M5 12h14"/>', user: '<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>', box: '<path d="m3 7 9-5 9 5v10l-9 5-9-5V7Z"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5"/>', logout: '<path d="M9 4H4v16h5M14 8l4 4-4 4M8 12h10"/>', arrow: '<path d="m9 5 7 7-7 7"/>' };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.tasks}</svg>`;
}
function render(animate = false) {
  if (!state) return renderLogin();
  const r = route();
  const nav = [['overview', 'tasks', '我的任务'], ...(state.user.role === 'registrar' ? [['intake', 'add', '登记']] : []), ['account', 'user', '我的']];
  document.body.className = 'personal-app';
  app.innerHTML = `<div class="personal-shell"><header class="personal-header"><a class="personal-brand" href="#overview">${icon('box')}<span>ParcelRelay</span></a><a class="account-shortcut" href="#account" aria-label="我的账号 ${esc(state.user.name)}"><span>${esc(state.user.name)}</span><span class="mini-avatar">${esc(state.user.name.slice(-1))}</span></a></header>
  <main id="main" class="personal-main page-screen ${animate ? 'route-enter' : ''}">${r === 'overview' || r === 'records' ? overview() : r === 'intake' ? intake() : r === 'detail' ? detail() : r === 'rules' ? (state.user.role === 'admin' ? rules() : '<div class="empty"><strong>此页面需要企业配置权限</strong><a href="#overview">返回我的任务</a></div>') : r === 'guide' ? guide() : accountPage()}</main>
  <nav class="bottom-nav" aria-label="主导航">${nav.map(([key, glyph, label]) => `<a href="#${key}" class="${r === key || (key === 'overview' && ['detail', 'records'].includes(r)) || (key === 'account' && ['rules', 'guide'].includes(r)) ? 'active' : ''}" ${r === key ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span></a>`).join('')}</nav></div>`;
}
function renderLogin(message = '') {
  document.body.className = 'personal-app signed-out';
  app.innerHTML = `<main id="main" class="login-shell route-enter"><a href="#login" class="personal-brand">${icon('box')}<span>ParcelRelay</span></a><div class="login-heading"><span class="login-kicker">YOUR WORK, IN HAND.</span><h1>每一次交接，<br>从你的任务开始。</h1><p>登录自己的账号，查看待办并接续工作。</p></div><form id="login-form" class="login-form">${message ? `<p class="form-error" role="alert">${esc(message)}</p>` : ''}<div class="field"><label for="login-name">账号</label><input id="login-name" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="48" placeholder="输入企业分配的账号"></div><div class="field"><label for="login-password">密码</label><input id="login-password" name="password" type="password" autocomplete="current-password" required maxlength="128" placeholder="输入你的密码"></div><button class="btn login-submit">登录，查看我的任务 ${icon('arrow')}</button><p class="login-help">账号由企业配置负责人创建。</p></form>
  <details class="demo-account-help"><summary>试用合成账号</summary><p>以下账号仅用于这份合成数据演示。每个账号独立登录；改密后初始密码失效。</p><div>${demoAccounts.map(a => `<div class="demo-login-row"><strong>${esc(a.name)}<small>${esc(a.role)}</small></strong><span><code>${esc(a.username)}</code><small>${esc(a.password)}</small></span></div>`).join('')}</div></details><footer class="login-footer">PARCELRELAY <span>·</span> 合成数据演示</footer></main>`;
}
function accountPage() {
  return `<div class="account-page">${heading('个人空间', '我的', '账号身份与当前工作空间。')}<section class="profile-card"><div class="profile-avatar">${esc(state.user.name.slice(-1))}</div><div><h2>${esc(state.user.name)}</h2><p>${roleNames[state.user.role]} · ${esc(state.company.name)}</p><small>账号 ${esc(state.account.username)}</small></div></section>
  <div class="profile-links"><a href="#records">我参与的记录 ${icon('arrow')}</a>${state.user.role === 'admin' ? `<a href="#rules">企业授权与规则 ${icon('arrow')}</a>` : ''}<a href="#guide">演示与验收说明 ${icon('arrow')}</a></div>
  <details class="settings-section"><summary>修改密码<span>更新个人登录凭据</span></summary><div class="settings-body"><form id="password-form" class="focus-form"><div class="field"><label for="current-password">当前密码</label><input id="current-password" name="currentPassword" type="password" autocomplete="current-password" required maxlength="128"></div><div class="field"><label for="new-password">新密码（12–128 位）</label><input id="new-password" name="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div><button class="btn">更新密码</button></form></div></details>
  ${state.user.role === 'admin' ? `<details class="settings-section"><summary>成员账号<span>创建与查看</span></summary><div class="settings-body"><p>新账号只获得岗位身份；业务接收和审核权限需要独立配置。</p><div class="member-list">${(state.accounts || []).map(a => `<div><span>${esc(userName(a.userId))}</span><code>${esc(a.username)}</code></div>`).join('')}</div><form id="account-create-form" class="focus-form"><div class="form-grid">${inputField('member-name', '成员姓名 *', '', true, 40)}${inputField('member-username', '登录账号 *', '', true, 48)}<div class="field"><label for="member-role">岗位</label><select id="member-role" name="role">${Object.entries(roleNames).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></div><div class="field"><label for="member-password">初始密码（至少 12 位）</label><input id="member-password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div></div><button class="btn">创建成员账号</button></form></div></details>` : ''}
  <button class="logout-button" data-action="logout">${icon('logout')}退出当前账号</button><p class="account-footnote">当前使用合成业务数据。账号登录与任务归属由服务端校验。</p></div>`;
}
function heading(kicker, title, subtitle, action = '') { return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`; }
function canRelease(p) { return !!p.canRelease; }
function canReplan(p) { return !!p.business && ['异常', '待审核'].includes(p.status) && (p.creatorId === userId || p.business.reviewers.includes(userId)); }
function isMyTask(p) { return !!p.task; }
function phase(p) {
  if (p.status === '已交接') return 5;
  if (p.status === '待核对' || p.status === '退回') return 1;
  if (p.status === '待审核' || p.status === '异常') return 2;
  return p.release ? 4 : 3;
}
function taskLabel(p) {
  if (p.status === '已交接') return '查看交接结果';
  if (p.status === '异常') return isMyTask(p) ? '处理异常' : '查看处理进度';
  return ['登记到件', '核对业务', '审核分派', '确认交出', '核对接收'][phase(p)] || '查看进度';
}
function nextAction(p) {
  if (p.status === '已交接') return `${userName(p.proof?.receiverId)}已接收`;
  if (p.status === '异常') return p.exception?.kind || '需要人工处理';
  if (phase(p) === 1) return '登记员核对业务归属';
  if (phase(p) === 2) return `${(p.business?.reviewers || []).map(userName).join('、')}审核分派`;
  if (phase(p) === 3) return '交出方确认后，再由接收人核对';
  return `${userName(p.plan?.assigneeId)}核对并接收`;
}
function overview() {
  const myTasks = state.parcels.filter(isMyTask);
  const shown = state.parcels.filter(p => ((filter === '待我处理' ? isMyTask(p) : filter === '跟进中' ? p.status !== '已交接' && !isMyTask(p) : filter === '已完成' ? p.status === '已交接' : p.status === filter))
    && `${p.tracking} ${p.recipient} ${p.businessId || ''} ${p.reference}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(isMyTask(b)) - Number(isMyTask(a)) || b.createdAt.localeCompare(a.createdAt));
  return `<div class="worklist-page">${heading('MY TASKS', `你好，${esc(state.user.name)}。`, `有 ${myTasks.length} 项任务等待你处理。`, state.user.role === 'registrar' ? '<a class="btn" href="#intake">＋ 登记新收件</a>' : '<button class="text-action" data-action="refresh">刷新记录 ↻</button>')}
    <section class="panel task-list"><div class="list-controls"><div class="list-tabs" role="group" aria-label="我的任务范围">${['待我处理', '跟进中', '已完成'].map(s => `<button class="list-tab ${filter === s ? 'active' : ''}" data-filter="${s}" aria-pressed="${filter === s}">${s}<span>${state.parcels.filter(p => s === '待我处理' ? isMyTask(p) : s === '跟进中' ? p.status !== '已交接' && !isMyTask(p) : p.status === '已交接').length}</span></button>`).join('')}</div><input id="search" type="search" aria-label="搜索收件" placeholder="搜索收件或业务编号" value="${esc(search)}"></div>
    ${shown.length ? `<div class="receipt-list">${shown.map(p => `<article class="receipt-row"><div class="receipt-symbol" aria-hidden="true">${p.status === '已交接' ? '✓' : p.status === '异常' ? '!' : '▱'}</div><div class="receipt-name"><a href="#parcel/${p.id}">${esc(p.tracking)}</a><p>${esc(p.type)}<span>·</span>${esc(p.recipient)}</p></div><div class="receipt-stage">${badge(p.status)}<small>${esc(nextAction(p))}</small></div><a href="#parcel/${p.id}" class="${isMyTask(p) ? 'btn small' : 'btn ghost small'}" aria-label="${esc(taskLabel(p))} ${esc(p.tracking)}">${isMyTask(p) ? esc(taskLabel(p)) : p.status === '已交接' ? '查看结果' : '查看进度'} →</a></article>`).join('')}</div>` : `<div class="empty"><span class="empty-mark" aria-hidden="true">${filter === '待我处理' ? '✓' : '▱'}</span><strong>${filter === '待我处理' && !search ? '当前没有需要你处理的收件' : '没有找到收件'}</strong><p>${filter === '待我处理' ? '你的任务会在需要你处理时出现，可在「跟进中」查看已流转的记录。' : '试试其他范围或收件编号。'}</p>${filter !== '跟进中' ? '<button class="btn ghost small" data-filter="跟进中">查看跟进中的记录</button>' : ''}</div>`}
    </section><div class="list-bottom"><p>每次只处理你负责的步骤，完成后流转给下一位同事。</p><details class="list-more"><summary>更多选项</summary><button class="text-action" data-action="export">导出当前身份可见记录</button><a href="#guide">查看演示验收说明</a></details></div></div>`;
}
const samples = {
  A: { label: '采购物资 · 正常闭环', desc: '原负责人休假，推荐在岗授权备用人。', type: '采购物资', reference: 'PO-2026-001', source: '合成供应商 · 云帆设备', recipient: '黄安 / 采购', note: '案例 A：两台显示器到件，按采购单核对并交给授权备用人。' },
  B: { label: '保密合同 · 无人可接收', desc: '仅指定授权审核人可见；普通人员不可领取。', type: '保密文件', reference: 'CT-2026-001', source: '合成合作方', recipient: '温岚', note: '案例 B：已申报为保密；原负责人和备用人均不在岗。' },
  C: { label: '相似项目 · 归属歧义', desc: '两个晨光项目，需要补充准确业务编号。', type: '客户资料', reference: '晨光', source: '合成客户 · 晨光', recipient: '项目组', note: '案例 C：请人工确认是品牌项目还是网站项目，不可仅凭名称自动关联。' },
  D: { label: '批准后撤权 · 旧批准失效', desc: '先批准，再撤销备用人接收授权并尝试领取。', type: '采购物资', reference: 'PO-2026-001', source: '合成供应商 · 云帆设备', recipient: '黄安 / 采购', note: '案例 D：批准后由配置负责人撤销李宁接收授权；领取时应拦截。' },
  E: { label: '实物不符 · 暂停交接', desc: '型号或数量不一致，报告异常并保留记录。', type: '采购物资', reference: 'PO-2026-001', source: '合成供应商 · 云帆设备', recipient: '黄安 / 采购', note: '案例 E：验收时发现仅到一台显示器，采购单要求两台；请报告异常。' },
};
function intake() {
  const sample = companyId === 'orion' ? samples[selectedSample] : { type: '客户资料', reference: 'AC-2026-001', source: '合成客户 · 青禾', recipient: '乔文', note: '接收资料不代表已经审阅内容。' };
  return `<div class="intake-focus">${heading('第 1 步 / 登记', '这次收到了什么？', '先记录到件信息，保存后再核对业务归属。')}
    ${state.user.role !== 'registrar' ? '<div class="notice">当前账号没有到件登记权限。</div>' : ''}
    <section class="panel intake-card"><details class="sample-picker"><summary>试用合成案例 <span>点击填充</span></summary><div class="sample-list">${companyId === 'orion' ? Object.entries(samples).map(([key, s]) => `<button class="sample ${selectedSample === key ? 'selected' : ''}" data-sample="${key}"><span class="sample-letter">${key}</span><span><strong>${s.label}</strong><small>${s.desc}</small></span></button>`).join('') : '<p>已填入青杉企业的合成客户资料。</p>'}</div></details>
    <form id="intake-form" class="intake-fields"><div class="form-grid">
    ${inputField('tracking', '收件编号 *', `DEMO-${companyId === 'orion' ? selectedSample : 'AC'}-${Date.now().toString().slice(-6)}`, true, 60)}
    <div class="field"><label for="type">收件类型 *</label><select id="type" name="type">${['采购物资', '客户资料', '保密文件', '工作用品'].map(t => `<option ${sample.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    ${inputField('source', '来源 / 寄件方 *', sample.source, true, 100)}${inputField('recipient', '外包装收件人 *', sample.recipient, true, 100)}
    <div class="field full"><label for="reference">业务编号或名称</label><input id="reference" name="reference" value="${esc(sample.reference)}" maxlength="100"><span class="hint">保密件需填写完整业务编号。</span></div></div>
    <details class="optional-fields"><summary>补充备注或期望处理时间 <span>可选</span></summary><div class="stack"><div class="field"><label for="note">必要备注</label><textarea id="note" name="note" maxlength="500">${esc(sample.note)}</textarea></div><div class="field"><label for="deadline">期望处理时间（MYT）</label><input id="deadline" name="deadline" type="datetime-local"><span class="hint">期望时间不代表承诺期限。</span></div></div></details>
    <label class="check demo-check"><input name="synthetic" type="checkbox" required>我确认以上均为合成信息，不包含真实合同、员工或客户资料。</label>
    <div class="step-submit"><span>下一步：核对业务归属</span><button class="btn" ${state.user.role !== 'registrar' ? 'disabled' : ''}>保存，继续核对 →</button></div></form></section></div>`;
}
function inputField(name, label, value, required = false, max = 100) { return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" value="${esc(value)}" maxlength="${max}" ${required ? 'required' : ''}></div>`; }
function history(events) {
  return events.length ? `<ol class="timeline">${events.map(e => `<li><time>${fmt(e.at)}</time><strong>${esc(e.action)} ${e.result === '拦截' ? '<span class="badge error">已拦截</span>' : ''}</strong><p>${esc(e.actorName)} · ${roleNames[e.role]} / ${esc(e.before)} → ${esc(e.after)}${e.planVersion ? ` / 方案 v${e.planVersion}` : ''}</p><p>${esc(e.reason)}</p><div class="log-id">${esc(e.id)}</div></li>`).join('')}</ol>` : '<p class="muted">暂无活动记录。</p>';
}
function stepper(p) {
  const n = phase(p);
  const labels = ['登记', '核对业务', '授权审核', '确认交出', '核对接收'];
  return `<ol class="journey-steps" aria-label="交接流程">${labels.map((title, i) => `<li class="${i < n ? 'complete' : i === n ? 'current' : ''}" ${i === n ? 'aria-current="step"' : ''}><span class="step-circle">${i < n ? '✓' : i + 1}</span><span class="step-title">${title}</span>${i === n ? '<small>当前步骤</small>' : ''}</li>`).join('')}</ol>`;
}
function businessSummary(p) {
  const b = p.business;
  return b ? `<div class="item-summary"><span class="summary-icon" aria-hidden="true">▱</span><div><strong>${esc(b.model)} <span>× ${b.quantity}</span></strong><small>${esc(b.name)} · ${esc(b.id)}</small></div></div>` : '';
}
function switchTask(ids, verb) {
  const target = ids.find(uid => state.users.some(u => u.id === uid));
  return `<div class="role-handoff"><p class="handoff-caption">${target ? `接下来由 <strong>${esc(userName(target))}</strong> ${verb}` : '等待指定负责人处理'}</p><p class="wait-note">对方登录自己的账号后，会在任务列表中看到这一步。</p><a class="btn" href="#overview">返回我的任务 →</a></div>`;
}
function reasonField(id, label = '处理理由 *', placeholder = '说明这次决定的原因') {
  return `<div class="field"><label for="${id}">${label}</label><textarea id="${id}" name="reason" maxlength="500" required placeholder="${placeholder}" rows="2"></textarea></div>`;
}
function outcomeNote(p) {
  if (!completion || completion.id !== p.id || completion.status !== p.status) return '';
  return `<div class="completion-note" role="status"><span aria-hidden="true">✓</span>${esc(completion.message)}</div>`;
}
function detail() {
  const p = parcel();
  if (!p) return `${heading('', '此收件不可见', '当前账号无权查看此收件，请返回自己的任务。')}<a class="btn" href="#overview">返回我的任务</a>`;
  const events = state.events.filter(e => e.parcelId === p.id);
  const n = phase(p);
  const owner = n === 1 ? '登记员' : n === 2 ? (p.business?.reviewers || []).map(userName).join('、') : n === 3 ? userName(p.senderId) : userName(p.plan?.assigneeId);
  return `<div class="journey-page"><a class="back" href="#overview">← 我的任务</a><div class="receipt-heading"><div><h1>${esc(p.tracking)}</h1><p>${esc(p.type)}<span>·</span>${esc(p.recipient)}</p></div>${badge(p.status)}</div>
    ${stepper(p)}${outcomeNote(p)}
    <section class="panel journey-focus" aria-label="当前步骤">${p.status === '已交接' ? completeTask(p) : `<div class="task-eyebrow"><span>${p.status === '异常' ? '需要处理 / 流程已暂停' : `第 ${n + 1} 步 / 共 5 步`}</span><span>${esc(owner)}负责</span></div>${currentTask(p)}`}</section>
    <div class="receipt-extras"><details class="extra-panel"><summary>收件资料<span>来源、备注与编辑</span></summary><div class="extra-body">${receiptInfo(p)}${p.canEdit ? editForm(p) : ''}</div></details>
    ${p.plan ? `<details class="extra-panel"><summary>业务关联与分派依据<span>推荐理由、审核记录</span></summary><div class="extra-body">${planInfo(p)}</div></details>` : ''}
    <details class="extra-panel"><summary>操作记录<span>${events.length} 条 · MYT</span></summary><div class="extra-body">${history(events)}</div></details></div></div>`;
}
function taskHeading(title, text) { return `<div class="task-heading"><h2 tabindex="-1">${title}</h2><p>${text}</p></div>`; }
function currentTask(p) {
  if (p.status === '异常') return exceptionTask(p);
  const n = phase(p);
  if (n === 1) {
    if (!p.canLink) return taskHeading('等待核对业务归属', '此步骤需要登记员或该业务指定审核人确认。') + switchTask(p.business?.reviewers || state.users.filter(u => u.role === 'registrar').map(u => u.id), '核对业务');
    const found = state.businesses.filter(b => b.type === p.type && p.reference && (b.id.toLowerCase() === p.reference.toLowerCase() || b.name.includes(p.reference)));
    const exact = found.find(b => b.id.toLowerCase() === p.reference.toLowerCase());
    return taskHeading('这件收件属于哪项业务？', p.status === '退回' ? `已退回：${esc(p.exception?.reason || '请补充资料后重新核对')}` : '确认业务编号和到件信息一致，再生成分派方案。') +
      `<form data-parcel-action="link" class="focus-form">${found.length ? `<div class="match-list" aria-label="可见业务候选">${found.map(b => `<div class="match-card"><div><strong>${esc(b.name)}</strong><small>${esc(b.id)} · ${esc(b.model)} × ${b.quantity}</small></div><span class="badge ${exact?.id === b.id ? 'handoff' : 'review'}">${exact?.id === b.id ? '编号一致' : '待确认'}</span></div>`).join('')}</div>` : '<div class="inline-note">尚无可见的匹配业务，请确认完整业务编号。</div>'}
      ${found.length > 1 && !exact ? '<p class="form-warning">有多个相似项目，请补充准确编号。</p>' : ''}
      ${inputField('businessId', '完整业务编号 *', exact?.id || '', true, 100)}<label class="check"><input name="confirmed" type="checkbox" required>编号、收件类型和到件信息一致。</label>
      <div class="step-submit"><span>下一步：授权审核人确认分派</span><button class="btn">确认业务，进入审核 →</button></div></form>`;
  }
  if (n === 2) {
    if (!p.canReview) return taskHeading('业务已确认，等待授权审核', '分派方案已生成。由指定审核人决定后，才能交出。') + businessSummary(p) + `<div class="one-line-plan"><span>推荐接收人</span><strong>${esc(userName(p.plan?.assigneeId))}</strong></div>` + switchTask(p.business?.reviewers || [], '审核分派');
    return taskHeading('是否同意这次分派？', '确认推荐接收人与授权范围，再明确批准。') + businessSummary(p) + `<div class="recommended-person"><span class="person-avatar">${esc(userName(p.plan?.assigneeId).slice(-1))}</span><div><span class="field-label">推荐接收人</span><strong>${esc(userName(p.plan?.assigneeId))}</strong><p>${esc(p.plan?.reason)}</p></div><span class="badge handoff">已授权 · 在岗</span></div>
      <form data-parcel-action="review" class="focus-form"><input type="hidden" name="decision" value="approve"><input type="hidden" name="assigneeId" value="${esc(p.plan.assigneeId)}">${reasonField('review-reason', '批准理由 *', '例如：已核对采购单，同意授权备用人接收')}<div class="step-submit"><span>批准后：交出方确认交出</span><button class="btn">批准分派，进入交出 →</button></div></form>${alternateReview(p)}${exceptionOption(p)}`;
  }
  if (n === 3) {
    const canAct = canRelease(p);
    const message = p.approval ? `${esc(userName(p.approval.by))}已批准交给${esc(userName(p.plan.assigneeId))}。` : '';
    return taskHeading(canAct ? '将收件交给获批准的接收人' : '等待交出方确认', `${message}交出方先确认，接收人再核对。`) + businessSummary(p) + `<div class="handoff-pair"><div><small>交出方</small><strong>${esc(userName(p.senderId))}</strong></div><span aria-hidden="true">→</span><div><small>获批准接收人</small><strong>${esc(userName(p.plan.assigneeId))}</strong></div></div>` +
      (canAct ? `<form data-parcel-action="release" class="focus-form"><label class="check"><input name="confirmed" type="checkbox" required>我已核对收件，并向${esc(userName(p.plan.assigneeId))}当面交出。</label><div class="step-submit"><span>下一步：${esc(userName(p.plan.assigneeId))}核对接收</span><button class="btn">确认交出，交给接收人 →</button></div></form>${exceptionOption(p)}` : switchTask([p.senderId], '确认交出'));
  }
  if (!p.canReceive) return taskHeading('已确认交出，等待接收人核对', `${esc(userName(p.release.by))}已于 ${fmt(p.release.at)} 确认交出。`) + businessSummary(p) + switchTask([p.plan.assigneeId], '核对接收');
  return taskHeading('物品核对无误后，确认接收', `交出方：${esc(userName(p.release.by))}。如果实物不符，请先报告异常。`) + businessSummary(p) +
    `<form data-parcel-action="handoff" class="focus-form"><div class="receive-checklist">${[['model', '型号一致', p.business.model], ['quantity', '数量一致', `共 ${p.business.quantity} 件`], ['condition', '状况无异常', '检查物品外观与完整性'], ['sender', '已由交出方当面交出', userName(p.release.by)], ['receiver', '本人已实际接收', state.user.name]].map(([key, label, hint]) => `<label class="receive-check"><input name="${key}" type="checkbox" required><span>${esc(label)}<small>${esc(hint)}</small></span></label>`).join('')}</div><details class="optional-fields"><summary>添加交接备注<span>可选</span></summary><label class="field"><span>交接备注</span><textarea name="note" maxlength="500" rows="2"></textarea></label></details><div class="step-submit"><span>确认后：保存交接证明与结果</span><button class="btn">确认接收，完成交接 ✓</button></div></form>${exceptionOption(p)}`;
}
function alternateReview(p, onlyException = false) {
  if (!p.canReview) return '';
  return `<details class="secondary-task"><summary>${onlyException ? '选择其他处置方式' : '需要改派、退回或暂存？'}</summary><form data-parcel-action="review" class="focus-form"><div class="field"><label for="decision">处理方式</label><select name="decision" id="decision">${!onlyException ? '<option value="approve">在已有授权范围内改派</option>' : ''}<option value="hold">暂存，保持暂停</option><option value="escalate">申请指定授权人介入</option><option value="return">退回补充资料</option></select></div>${!onlyException ? `<div class="field alternate-assignee"><label for="assigneeId">获授权接收人</label><select id="assigneeId" name="assigneeId">${state.users.filter(u => u.available && u.role === 'receiver' && p.business.authorized.includes(u.id)).map(u => `<option value="${u.id}" ${u.id === p.plan.assigneeId ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>` : ''}${reasonField('other-review-reason')}<button class="btn secondary">记录处理决定</button></form></details>`;
}
function replanOption(p, expanded = false) {
  if (!canReplan(p)) return '';
  const form = `<form data-parcel-action="replan" class="focus-form">${reasonField('replan-reason', '已修正的情况 *', '说明实物、资料或人员授权条件如何恢复')}<div class="step-submit"><span>需要重新审核，才能继续交接</span><button class="btn">重新检查，生成新方案 →</button></div></form>`;
  return expanded ? form : `<details class="secondary-task"><summary>条件已恢复，重新检查</summary>${form}</details>`;
}
function exceptionTask(p) {
  const kind = p.exception?.kind;
  const held = ['已批准暂存', '等待指定授权人介入'].includes(kind);
  const mismatch = kind === '实物或资料不符';
  const info = `<div class="exception-focus"><span class="exception-sign" aria-hidden="true">!</span><div><strong>${esc(kind || '需要人工处理')}</strong><p>${esc(p.exception?.reason || p.plan?.reason || '请先核对情况。')}</p></div></div>`;
  if (mismatch) return taskHeading('先解决异常，再继续交接', '本次交接已暂停，原批准不再有效。') + businessSummary(p) + info + (canReplan(p) ? replanOption(p, true) + alternateReview(p, true) : switchTask(p.business?.reviewers || [], '处理异常'));
  if (held) return taskHeading(kind === '已批准暂存' ? '已暂存，等待条件恢复' : '已提交升级，等待指定授权人', '当前保持暂停；条件恢复后，重新检查并审核。') + info + replanOption(p) + alternateReview(p, true);
  if (!p.canReview) return taskHeading('当前无法继续交接', '需要指定审核人决定暂存、升级或退回。') + info + switchTask(p.business?.reviewers || [], '处理异常') + replanOption(p);
  return taskHeading('没有可用的授权接收人', '先决定如何保管收件，系统不会自动扩大权限。') + businessSummary(p) + info + `<form data-parcel-action="review" class="focus-form"><input type="hidden" name="decision" value="hold">${reasonField('hold-reason', '暂存理由 *', '说明暂存安排及等待条件')}<div class="step-submit"><span>保持暂停，等待授权接收人</span><button class="btn">确认暂存</button></div></form>` + alternateReview(p, true) + replanOption(p);
}
function exceptionOption(p) {
  if (!['待审核', '待交接'].includes(p.status) || !(p.canReceive || p.business?.reviewers.includes(userId) || state.user.role === 'registrar')) return '';
  return `<details class="secondary-task exception-option"><summary>实物或资料不符？暂停并报告</summary><form data-parcel-action="exception" class="focus-form">${reasonField('exception-reason', '异常原因 *', '例如：应到两台，实到一台')}<button class="btn danger">记录异常，暂停交接</button></form></details>`;
}
function completeTask(p) {
  return `<div class="complete-heading"><span class="complete-icon" aria-hidden="true">✓</span><div><h2 tabindex="-1">交接完成</h2><p>已由${esc(userName(p.proof.receiverId))}确认接收。</p></div></div>${businessSummary(p)}<dl class="proof-summary"><div><dt>交出方</dt><dd>${esc(userName(p.proof.senderId))}</dd></div><div><dt>接收方</dt><dd>${esc(userName(p.proof.receiverId))}</dd></div><div><dt>完成时间</dt><dd>${fmt(p.proof.at)}</dd></div></dl><div class="proof-checks">✓ 型号、数量、状况已核对<br>✓ 交出方与接收方均已确认</div>${p.proof.note ? `<p class="proof-note">备注：${esc(p.proof.note)}</p>` : ''}<div class="step-submit"><span>交接证明已保存，关联业务仍为进行中。</span><a class="btn" href="#overview">返回我的任务 →</a></div>`;
}
function receiptInfo(p) {
  return `<dl class="kv"><div><dt>来源</dt><dd>${esc(p.source)}</dd></div><div><dt>外包装收件人</dt><dd>${esc(p.recipient)}</dd></div><div><dt>登记业务线索</dt><dd>${esc(p.reference || '未提供')}</dd></div><div><dt>期望处理时间</dt><dd>${p.deadline ? `${esc(p.deadline.replace('T', ' '))} MYT（仅为期望）` : '未设置'}</dd></div><div class="full"><dt>必要备注</dt><dd>${esc(p.note || '无')}</dd></div><div><dt>登记时间</dt><dd>${fmt(p.createdAt)}</dd></div><div><dt>内部编号 / 资料版本</dt><dd>${esc(p.id)} / ${p.revision}</dd></div></dl>`;
}
function planInfo(p) {
  return `<div class="business-card"><strong>${esc(p.business?.id)} · ${esc(p.business?.name)}</strong><p>方案 v${p.plan.version}；业务编号经明确确认，收件类型一致。</p><p>${esc(p.plan.reason)}</p></div><div class="people">${p.plan.people.map(u => `<div class="person-row"><div>${esc(u.name)}<small>${esc(u.reason)}</small></div><span class="badge ${u.available && u.authorized ? 'handoff' : 'error'}">${u.authorized ? (u.available ? '在岗 · 有授权' : '不在岗') : '无接收授权'}</span></div>`).join('')}</div><p class="hint">以上为方案生成时的快照，执行时会重新复核。</p>${p.approval ? `<div class="approval-record"><strong>${esc(userName(p.approval.by))}已批准 · v${p.approval.version}</strong><p>${esc(p.approval.reason)}</p><small>${fmt(p.approval.at)}</small></div>` : ''}`;
}
function switchButtons() { return '<span class="hint">请联系企业配置负责人。</span>'; }
function editForm(p) { return `<section class="panel"><div class="panel-body"><details><summary>编辑资料或补充备注</summary><p class="hint">无关备注保留批准；来源、收件人或业务线索变化，会使原批准失效并回到待核对。</p><form data-parcel-action="edit" class="stack" style="gap:12px;margin-top:14px">${inputField('source', '来源', p.source, true, 100)}${inputField('recipient', '外包装收件人', p.recipient, true, 100)}${inputField('reference', '业务编号或名称', p.reference, false, 100)}<div class="field"><label for="edit-note">备注</label><textarea id="edit-note" name="note" maxlength="500">${esc(p.note)}</textarea></div><div class="field"><label for="edit-reason">修改理由 *</label><textarea id="edit-reason" name="reason" required maxlength="500"></textarea></div><button class="btn secondary">保存资料并重新校验</button></form></details></div></section>`; }
function rules() {
  const admin = state.user.role === 'admin';
  return `<div class="settings-page">${heading('企业设置', '规则与授权', esc(state.company.name))}
  <details class="settings-section" open><summary>业务与接收授权<span>${state.businesses.length} 项可见业务</span></summary><div class="settings-body table-scroll"><table><thead><tr><th>业务</th><th>获授权接收人</th><th>指定审核人</th><th>核对物品</th></tr></thead><tbody>${state.businesses.map(b => `<tr><td><strong>${esc(b.id)}</strong><small>${esc(b.name)}</small></td><td>${esc(b.authorized.map(userName).join('、') || '暂无')}</td><td>${esc(b.reviewers.map(userName).join('、'))}</td><td>${esc(b.model)} × ${b.quantity}</td></tr>`).join('')}</tbody></table></div></details>
  ${admin ? `<details class="settings-section"><summary>更改接收授权<span>独立记录变更</span></summary><div class="settings-body"><p class="hint">改派不会扩大权限。公开业务的接收授权在这里单独变更。</p><form id="authorization-form" class="focus-form settings-form"><div class="form-grid"><div class="field"><label for="config-business">业务</label><select id="config-business" name="businessId">${state.businesses.filter(b => b.type !== '保密文件').map(b => `<option value="${b.id}">${esc(b.id)} / ${esc(b.name)}</option>`).join('')}</select></div><div class="field"><label for="config-user">接收人</label><select id="config-user" name="userId">${state.users.filter(u => u.role === 'receiver').map(u => `<option value="${u.id}" ${u.id === 'nina' ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div><div class="field full"><label for="config-authorized">变更为</label><select id="config-authorized" name="authorized"><option value="false">撤销接收授权</option><option value="true">授权生效</option></select></div></div>${reasonField('auth-reason', '授权变更理由 *')}<button class="btn">记录授权变更</button></form></div></details>` : `<div class="settings-access"><p>配置变更由指定负责人处理。</p>${switchButtons([companyId === 'orion' ? 'admin' : 'ops'])}</div>`}
  ${admin ? `<details class="settings-section"><summary>登记与审核权限<span>为新成员配置业务</span></summary><div class="settings-body"><form id="business-access-form" class="focus-form"><div class="field"><label for="access-business">业务</label><select id="access-business" name="businessId">${state.businesses.filter(b => b.type !== '保密文件').map(b => `<option value="${b.id}">${esc(b.id)} / ${esc(b.name)}</option>`).join('')}</select></div><div class="field"><label for="access-user">成员</label><select id="access-user" name="userId">${state.users.filter(u => ['registrar', 'reviewer'].includes(u.role)).map(u => `<option value="${u.id}">${esc(u.name)} / ${roleNames[u.role]}</option>`).join('')}</select></div><div class="field"><label for="access-kind">权限</label><select id="access-kind" name="access"><option value="read">业务查看与登记关联</option><option value="review">授权审核（仅审核岗位）</option></select></div><div class="field"><label for="access-granted">变更为</label><select id="access-granted" name="granted"><option value="true">权限生效</option><option value="false">撤销权限</option></select></div>${reasonField('access-reason', '权限变更理由 *')}<button class="btn">记录业务权限变更</button></form></div></details>` : ''}
  <details class="settings-section"><summary>人员在岗状态<span>${state.users.length} 位合成人员</span></summary><div class="settings-body"><div class="people">${state.users.map(u => `<div class="person-row"><div>${esc(u.name)}<small>${roleNames[u.role]}</small></div><span class="badge ${u.available ? 'handoff' : 'error'}">${u.available ? '在岗' : '不在岗'}</span></div>`).join('')}</div>
    ${admin ? `<details class="secondary-task"><summary>变更人员状态</summary><form id="availability-form" class="focus-form"><div class="form-grid"><div class="field"><label for="availability-user">人员</label><select id="availability-user" name="userId">${state.users.map(u => `<option value="${u.id}">${esc(u.name)} / ${u.available ? '在岗' : '不在岗'}</option>`).join('')}</select></div><div class="field"><label for="availability-value">变更为</label><select id="availability-value" name="available"><option value="false">不在岗</option><option value="true">在岗</option></select></div></div>${reasonField('availability-reason', '人员状态变更理由 *')}<button class="btn secondary">记录人员状态变更</button></form></details>` : ''}</div></details>
  <details class="settings-section"><summary>交接规则<span>查看完成条件与限制</span></summary><div class="settings-body">${[
    ['准确关联', '先确认业务编号与类型，再生成方案。相似名称不能自动确定归属。'],
    ['明确审核', '所有分派由业务指定审核人批准，改派只能选择已有授权且在岗的人。'],
    ['双方确认', '交出方先确认，再由获批准的接收人核对型号、数量、状况与实际接收。'],
    ['执行前复核', '关键资料、授权和相关人员状态变化，会使旧批准失效。无关备注保留批准。'],
    ['没有允许路径就暂停', '保密件无授权人时，只能暂存、申请指定授权人介入或退回。申请不等于获准。'],
  ].map(([title, desc]) => `<div class="rule-item"><strong>${title}</strong><p>${desc}</p></div>`).join('')}</div></details>
  ${admin ? `<details class="settings-section"><summary>配置变更记录<span>${state.events.filter(e => !e.parcelId).length} 条</span></summary><div class="settings-body">${history(state.events.filter(e => !e.parcelId))}</div></details>` : ''}</div>`;
}
function guide() {
  return `<div class="guide-page">${heading('演示与验收', '从一条收件开始。', '先走完正常流程，再按需验证异常。')}
  <details class="settings-section" open><summary>A / 完成一次采购交接<span>正常流程</span></summary><div class="settings-body"><ol class="acceptance-steps">
  <li><span>1</span><div><strong>登记员核对业务</strong><p>请林悦登录并打开一条采购收件，确认 <code>PO-2026-001</code>。方案应推荐在岗且有授权的李宁。</p></div></li>
  <li><span>2</span><div><strong>授权审核人批准</strong><p>请陈美登录自己的账号，写明理由并批准分派。</p></div></li>
  <li><span>3</span><div><strong>交出方先确认</strong><p>林悦登录自己的账号，核对收件后确认当面交出。</p></div></li>
  <li><span>4</span><div><strong>接收人核对并接收</strong><p>按提示请李宁登录，核对显示器 M27 × 2、状况和实际接收，保存交接结果。</p></div></li>
  </ol><div class="acceptance-result">应看到：交接完成、双方姓名和时间。刷新后仍保留；关联业务仍为进行中。</div><a class="btn" href="#overview">打开我的任务 →</a><p class="hint guide-hint">已经处理过的收件不能重复领取。可在登记页填充案例 A，新建一条唯一编号的收件。</p></div></details>
  <details class="settings-section"><summary>B / 保密件无人可接收<span>权限与暂存</span></summary><div class="settings-body"><ol class="guide-list"><li>请周晨登录，打开保密件并确认 <code>CT-2026-001</code>。</li><li>温岚和何皓均不在岗，不能分给普通员工。</li><li>填写理由确认暂存，或展开其他方式升级/退回。流程应保持暂停。</li><li>林悦、陈美或李宁的列表中不应出现受限收件元数据。</li></ol></div></details>
  <details class="settings-section"><summary>C / 相似业务不能自动选定<span>归属歧义</span></summary><div class="settings-body"><p>请林悦登录并打开晨光客户资料，会看到品牌项目与网站项目两个候选。补充完整编号 <code>CLIENT-101</code> 或 <code>CLIENT-102</code> 并明确确认后才能继续。</p></div></details>
  <details class="settings-section"><summary>D / 批准后撤销授权<span>执行前拦截</span></summary><div class="settings-body"><ol class="guide-list"><li>新建案例 D，完成核对、审核与交出确认，暂不接收。</li><li>请许岑登录，在企业规则中展开「更改接收授权」，撤销 PO-2026-001 / 李宁授权并写明理由。</li><li>请李宁登录尝试接收，应被拦截，旧批准失效并留下原因。</li><li>恢复授权后，仍需重新生成方案、审核与确认交出。验收后请恢复李宁权限，方便继续演示。</li></ol></div></details>
  <details class="settings-section"><summary>E / 实物不符必须暂停<span>异常与漏核对</span></summary><div class="settings-body"><p>新建案例 E，批准后打开「实物或资料不符？暂停并报告」，填写「应到两台，实到一台」。应暂停交接，清除旧批准，要求记录修正情况并重新审核。任何必要证明项缺失都不能完成。</p></div></details>
  <details class="settings-section"><summary>演示范围与数据说明<span>已实现与未实现</span></summary><div class="settings-body"><ul class="guide-list"><li>人员、企业和业务均为合成数据。当前已启用账号密码与服务端会话，业务资料仍为合成数据。</li><li>记录保存在本机 SQLite；日志可由本机拥有者修改，不声称防篡改。</li><li>Orbyte 数据为团队接口假设；未连接真实 Orbyte、AI、WhatsApp 或外部通知。</li><li>内部交接不代表合同审核或后续业务办结。</li><li>没有真实访谈、用户对照实验或商业收益测量；Replit 线上运行尚未验证。</li></ul><button class="btn secondary small" data-action="export">导出当前身份可见记录</button></div></details>
  <details class="settings-section"><summary>记录你的验收观察<span>可用性与业务验证</span></summary><div class="settings-body"><p>记录使用者背景、案例、完成时间、求助次数和失败原因。对比聊天＋表格时，使用同等难度的不同案例并交换顺序。自动测试通过不代表市场需求或收益已被验证。仓库 docs 文件夹提供原始记录模板。</p></div></details></div>`;
}

app.addEventListener('change', async e => {
  try {
    if (e.target.id === 'decision') { const field = e.target.form.querySelector('.alternate-assignee'); if (field) field.hidden = e.target.value !== 'approve'; }
    if (e.target.id === 'status-filter') { filter = e.target.value; render(); }
  } catch (error) { toast(error.message, true); }
});
app.addEventListener('input', e => {
  if (e.target.id === 'search') { const pos = e.target.selectionStart; search = e.target.value; render(); const input = document.querySelector('#search'); input.focus(); input.setSelectionRange(pos, pos); }
});
app.addEventListener('click', async e => {
  const target = e.target.closest('button');
  if (!target) return;
  try {
    if (target.dataset.filter) { filter = target.dataset.filter; render(true); }
    if (target.dataset.sample) { selectedSample = target.dataset.sample; render(); }
    if (target.dataset.action === 'logout') { await api('/api/auth/logout', {}); authGeneration++; state = null; completion = null; search = ''; location.hash = 'login'; renderLogin(); return; }
    if (target.dataset.action === 'refresh') { await refresh(); toast('已读取最新记录。'); }
    if (target.dataset.action === 'export') {
      const result = await api('/api/export');
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `parcelrelay-${companyId}-${userId}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); toast('已导出当前身份可见记录。');
    }
  } catch (error) { toast(error.message, true); }
});
app.addEventListener('submit', async e => {
  e.preventDefault();
  if (busy) return;
  const form = e.target;
  const values = Object.fromEntries(new FormData(form));
  if (['login-form', 'password-form'].includes(form.id)) {
    busy = true; const button = form.querySelector('button'); button.disabled = true;
    form.querySelector('.form-error')?.remove();
    try {
      if (form.id === 'login-form') {
        const result = await api('/api/auth/login', values); authGeneration++; state = result; companyId = state.company.id; userId = state.user.id;
        filter = '待我处理'; completion = null; search = ''; location.hash = 'overview'; render(true); window.scrollTo(0, 0);
      } else { const result = await api('/api/auth/password', values); form.reset(); toast(result.message); }
    } catch (error) { const hint = document.createElement('p'); hint.className = 'form-error'; hint.setAttribute('role', 'alert'); hint.textContent = error.message; form.prepend(hint); button.disabled = false; }
    finally { busy = false; if (button.isConnected) button.disabled = false; }
    return;
  }
  let path, data, message, actedId, action;
  if (form.id === 'account-create-form') { path = '/api/accounts'; data = { username: values['member-username'], name: values['member-name'], role: values.role, password: values.password }; message = '成员账号已创建，业务权限需单独配置。'; }
  else if (form.id === 'intake-form') { path = '/api/parcels'; data = values; message = '登记成功。'; }
  else if (form.id === 'business-access-form') { path = '/api/config'; data = { ...values, kind: 'business-access', granted: values.granted === 'true' }; message = '业务权限已独立配置并记录。'; }
  else if (form.id === 'authorization-form' || form.id === 'availability-form') {
    path = '/api/config'; data = { ...values, kind: form.id === 'authorization-form' ? 'authorization' : 'availability', authorized: values.authorized === 'true', available: values.available === 'true' }; message = '配置已记录。旧批准执行时将重新检查条件。';
  } else if (form.dataset.parcelAction) {
    const p = parcel(); action = form.dataset.parcelAction; actedId = p.id;
    path = `/api/parcels/${p.id}/${action}`;
    data = { ...values, etag: p.etag || 0, version: p.plan?.version, confirmed: values.confirmed === 'on' };
    if (action === 'handoff') data.checks = Object.fromEntries(['model', 'quantity', 'condition', 'sender', 'receiver'].map(key => [key, values[key] === 'on']));
    message = ({ link: '业务归属已确认，方案已生成。', review: '审核决定已记录。', release: '交出方确认已保存，请接收人核对。', handoff: '内部交接完成，证明与日志已保存。', exception: '异常已记录，交接已暂停。', replan: '已按当前条件生成新方案，需要重新审核。', edit: '资料已保存，关键变化已重新校验。' })[action];
  } else return;
  busy = true;
  form.querySelectorAll('button').forEach(b => { b.disabled = true; });
  try {
    const result = await api(path, data); state = result;
    if (actedId) { const updated = state.parcels.find(p => p.id === actedId); if (updated) completion = { id: actedId, status: updated.status, message: ({ link: '业务已确认，分派方案已生成。', review: updated.status === '待交接' ? '分派已批准，接下来确认交出。' : '处理决定已保存。', release: '交出已确认，接下来由接收人核对。', handoff: '全部步骤已完成，交接证明已保存。', exception: '异常已记录，交接已暂停。', replan: '新方案已生成，需要重新审核。', edit: '资料修改已保存。' })[action] }; }
    if (result.created) {
      message = result.created.message;
      if (result.created.visible) { const created = state.parcels.find(p => p.id === result.created.id); completion = { id: created.id, status: created.status, message: '到件已登记，接下来核对业务归属。' }; go(`parcel/${result.created.id}`); } else go('overview');
    }
    render(true); window.scrollTo(0, 0); document.querySelector('.task-heading h2, .complete-heading h2')?.focus({ preventScroll: true }); if (!actedId && !result.created?.visible) toast(message);
  } catch (error) {
    if (error.data?.parcels) { state = error.data; completion = null; render(); window.scrollTo(0, 0); document.querySelector('.task-heading h2')?.focus({ preventScroll: true }); }
    else if (error.data?.error && /已被更新|已过期|版本已变化/.test(error.message)) { await refresh(); }
    else { form.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
    const inline = document.createElement('p'); inline.className = 'form-error'; inline.setAttribute('role', 'alert'); inline.textContent = error.message;
    form.querySelector('.form-error')?.remove();
    if (form.isConnected) { form.prepend(inline); inline.scrollIntoView({ block: 'nearest' }); }
    if (!form.isConnected) toast(error.message, true);
  } finally { busy = false; }
});
window.addEventListener('hashchange', () => {
  if (route() === 'records') filter = '跟进中';
  else if (route() === 'overview') filter = '待我处理';
  render(true); window.scrollTo(0, 0);
});
async function backgroundRefresh() {
  if (!state || busy || document.visibilityState !== 'visible' || !['overview', 'records'].includes(route()) || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  try { await refresh(); } catch { /* 过期会话已转至登录页；临时网络问题保留当前画面 */ }
}
setInterval(backgroundRefresh, 15000);
window.addEventListener('focus', backgroundRefresh);
document.addEventListener('visibilitychange', backgroundRefresh);
async function start() {
  try {
    if (route() === 'records') filter = '跟进中';
    const result = await fetch('/api/demo-accounts'); demoAccounts = (await result.json()).accounts || [];
    await refresh();
    if (route() === 'login') go('overview');
  } catch (error) {
    if (error.status === 401) renderLogin();
    else { state = null; renderLogin('暂时无法连接，请确认服务正在运行后重试。'); }
  }
}
start();
