const app = document.querySelector('#app');
const toastEl = document.querySelector('#toast');
const roleNames = { registrar: '登记员', reviewer: '授权审核人', receiver: '接收人', admin: '配置负责人' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = value => value ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Kuala_Lumpur', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) + ' MYT' : '—';
const statusClass = value => ({ 待审核: 'review', 待交接: 'handoff', 已交接: 'done', 异常: 'error', 退回: 'return' })[value] || '';
const badge = value => `<span class="badge ${statusClass(value)}">${esc(value)}</span>`;
let boot, state, companyId = localStorage.getItem('pr-company') || 'orion', userId = localStorage.getItem('pr-user') || 'lin';
let filter = '全部', search = '', selectedSample = 'A', toastTimer, busy = false;
const userName = uid => state.users.find(u => u.id === uid)?.name || uid || '未指定';
const parcel = () => state.parcels.find(p => p.id === decodeURIComponent(location.hash.slice(8)));
const route = () => location.hash.startsWith('#parcel/') ? 'detail' : (location.hash === '#main' ? 'overview' : (location.hash.slice(1) || 'overview'));
function toast(message, error = false) { clearTimeout(toastTimer); toastEl.textContent = message; toastEl.className = `show${error ? ' error' : ''}`; toastTimer = setTimeout(() => { toastEl.className = ''; }, error ? 10000 : 6500); }
async function api(path, data) {
  const scope = `${companyId}:${userId}`;
  const response = await fetch(path, { method: data ? 'POST' : 'GET', headers: { 'X-Demo-Company': companyId, 'X-Demo-User': userId, ...(data ? { 'Content-Type': 'application/json' } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
  const result = await response.json();
  if (scope !== `${companyId}:${userId}`) throw new Error('模拟身份已切换，请使用当前身份重试。');
  if (!response.ok) { const error = new Error(result.error || result.message || '请求失败'); error.data = result; throw error; }
  return result;
}
async function refresh() { state = await api('/api/state'); render(); }
function go(value) { if (location.hash === `#${value}`) render(); else location.hash = value; }
async function changeIdentity(nextCompany, nextUser) {
  companyId = nextCompany; userId = nextUser;
  localStorage.setItem('pr-company', companyId); localStorage.setItem('pr-user', userId);
  filter = '全部'; search = '';
  await refresh();
  if (route() === 'detail' && !parcel()) go('overview');
  toast(`已切换模拟身份：${state.user.name} · ${roleNames[state.user.role]}`);
}
const navItems = [['overview', '▦', '收件工作台'], ['intake', '＋', '到件登记'], ['rules', '☷', '企业规则'], ['guide', '◷', '验收与说明']];
function render() {
  const r = route();
  app.innerHTML = `<div class="shell"><aside class="sidebar">
    <a class="brand" href="#overview"><span class="brand-mark">↗</span><span>ParcelRelay<small>EVERY HANDOFF, ACCOUNTED FOR.</small></span></a>
    <nav class="nav" aria-label="主导航">${navItems.map(([key, icon, label]) => `<a href="#${key}" class="${r === key || (r === 'detail' && key === 'overview') ? 'active' : ''}" ${r === key ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${icon}</span>${label}</a>`).join('')}</nav>
    <div class="side-bottom"><strong>从到件，到责任交接。</strong><span class="muted">把业务归属、人的决定和每一次交接，留在同一条记录里。</span><div class="side-foot"><span class="dot"></span><span>本地运行 · SQLite 持久化</span></div></div>
    </aside><div class="content"><header class="topbar"><div class="breadcrumb">工作空间 <span>/</span> ${esc(state.company.name)}</div>
    <div class="identity"><span class="mock">模拟身份</span><label class="sr-only" for="company-select" hidden>合成企业</label><select id="company-select" aria-label="切换合成企业">${boot.companies.map(c => `<option value="${c.id}" ${c.id === companyId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
    <select id="user-select" aria-label="切换模拟身份">${boot.companies.find(c => c.id === companyId).users.map(u => `<option value="${u.id}" ${u.id === userId ? 'selected' : ''}>${esc(u.name)} · ${roleNames[u.role]}</option>`).join('')}</select></div></header>
    <main id="main" class="main">${r === 'overview' ? overview() : r === 'intake' ? intake() : r === 'detail' ? detail() : r === 'rules' ? rules() : guide()}<footer class="footer"><span>PARCELRELAY · HACKATHON 2026 / 合成数据演示</span><span>Orbyte 接口为假设 · 未接入 AI · 时间 MYT</span></footer></main></div></div>`;
}
function heading(kicker, title, subtitle, action = '') { return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`; }
function nextAction(p) {
  if (p.status === '待核对' || p.status === '退回') return '核对业务归属';
  if (p.status === '异常') return p.exception?.kind || '处理异常';
  if (p.status === '待审核') return '等待授权审核人决定';
  if (p.status === '待交接') return p.release ? `等待${userName(p.plan.assigneeId)}核对接收` : '等待交出方确认';
  return '查看交接证明';
}
function overview() {
  const statuses = ['待核对', '待审核', '待交接', '异常', '已交接'];
  const shown = state.parcels.filter(p => (filter === '全部' || p.status === filter || (filter === '待核对' && p.status === '退回')) && `${p.tracking} ${p.recipient} ${p.businessId || ''} ${p.reference}`.toLowerCase().includes(search.toLowerCase()));
  const pending = state.parcels.filter(p => p.canReview || p.canReceive || p.canLink).length;
  return `${heading('WORKSPACE / RECEIVING', '每一件，都有下一步。', '先核对归属，再明确授权，让内部交接有据可查。', state.user.role === 'registrar' ? '<a class="btn" href="#intake">＋ 登记到件</a>' : '<button class="btn secondary" data-action="refresh">↻ 刷新记录</button>')}
    <div class="stats">${statuses.map(s => `<button class="stat ${filter === s ? 'active' : ''}" data-filter="${s}" aria-pressed="${filter === s}"><span class="stat-top">${s}<span aria-hidden="true">${s === '已交接' ? '✓' : '↗'}</span></span><strong>${state.parcels.filter(p => p.status === s || (s === '待核对' && p.status === '退回')).length.toString().padStart(2, '0')}</strong><small>${s === '待交接' ? '批准后仍须执行前复核' : s === '已交接' ? '仅表示内部交接完成' : s === '异常' ? '等待允许的人工处理' : '当前身份可见记录'}</small></button>`).join('')}</div>
    <div class="overview-grid"><section class="panel"><div class="panel-heading"><h2>收件记录 <span class="count">/ ${state.parcels.length} 件可见</span></h2><button class="export-link" data-action="export">导出可见记录 ↗</button></div>
    <div class="toolbar"><input id="search" type="search" aria-label="搜索收件" placeholder="搜索编号、收件人、业务…" value="${esc(search)}"><select id="status-filter" aria-label="按状态筛选">${['全部', ...statuses, '退回'].map(s => `<option ${filter === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    ${shown.length ? `<div class="table-scroll"><table><thead><tr><th>收件 / 业务</th><th>收件人</th><th>当前阶段</th><th>下一步</th><th></th></tr></thead><tbody>${shown.map(p => `<tr><td><a class="row-link" href="#parcel/${p.id}">${esc(p.tracking)}</a><small>${esc(p.businessId || '尚未关联业务')} · ${esc(p.type)}</small></td><td>${esc(p.recipient)}<small>${fmt(p.createdAt)}</small></td><td>${badge(p.status)}</td><td><small>${esc(nextAction(p))}</small></td><td><a href="#parcel/${p.id}" class="row-link" aria-label="查看 ${esc(p.tracking)}">↗</a></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><strong>这里暂时没有收件</strong>${search || filter !== '全部' ? '试试清除搜索或切换为全部状态。' : '当前身份没有可见记录。可由登记员创建合成案例。'}</div>`}
    <div class="search-note">仅显示当前企业、当前模拟身份有权查看的收件。保密元数据不会出现在未授权列表。</div></section>
    <aside class="overview-aside"><section class="aside-card"><div class="aside-label">YOUR NEXT MOVE</div><h3>${esc(state.user.name)}，<br>有 ${pending} 件可以继续处理。</h3><p>每一次推进，都对应清晰的条件和责任人。</p><ol class="mini-flow"><li><span class="mini-number">1</span><div>核对业务归属<small>准确编号优先，歧义不自动选择</small></div></li><li><span class="mini-number">2</span><div>明确授权审核<small>改派不等于授予权限</small></div></li><li><span class="mini-number">3</span><div>复核后交接<small>条件变化，让旧批准失效</small></div></li></ol></section>
    <section class="quiet-card"><h3>第一次验收？</h3><p>从 DEMO-A-001 开始，走完采购物资的登记、审核与双人确认，再验证异常拦截。</p><a class="btn ghost small" href="#guide" style="margin-top:14px">打开验收清单 ↗</a></section></aside></div>`;
}
const samples = {
  A: { label: '采购物资 · 正常闭环', desc: '原负责人休假，推荐在岗授权备用人。', type: '采购物资', reference: 'PO-2026-001', source: '合成供应商 · 云帆设备', recipient: '黄安 / 采购', note: '案例 A：两台显示器到件，按采购单核对并交给授权备用人。' },
  B: { label: '保密合同 · 无人可接收', desc: '仅指定授权审核人可见；普通人员不可领取。', type: '保密文件', reference: 'CT-2026-001', source: '合成合作方', recipient: '温岚', note: '案例 B：已申报为保密；原负责人和备用人均不在岗。' },
  C: { label: '相似项目 · 归属歧义', desc: '两个晨光项目，需要补充准确业务编号。', type: '客户资料', reference: '晨光', source: '合成客户 · 晨光', recipient: '项目组', note: '案例 C：请人工确认是品牌项目还是网站项目，不可仅凭名称自动关联。' },
  D: { label: '批准后撤权 · 旧批准失效', desc: '先批准，再撤销备用人接收授权并尝试领取。', type: '采购物资', reference: 'PO-2026-001', source: '合成供应商 · 云帆设备', recipient: '黄安 / 采购', note: '案例 D：批准后由配置负责人撤销李宁接收授权；领取时应拦截。' },
  E: { label: '实物不符 · 暂停交接', desc: '型号或数量不一致，报告异常并保留记录。', type: '采购物资', reference: 'PO-2026-001', source: '合成供应商 · 云帆设备', recipient: '黄安 / 采购', note: '案例 E：验收时发现仅到一台显示器，采购单要求两台；请报告异常。' },
};
function intake() {
  const sample = companyId === 'orion' ? samples[selectedSample] : { label: '客户资料接收', desc: '相同流程复用在第二家企业。', type: '客户资料', reference: 'AC-2026-001', source: '合成客户 · 青禾', recipient: '乔文', note: '接收资料不代表已经审阅内容。' };
  return `${heading('INTAKE / A NEW ARRIVAL', '先登记，再交接。', '只登记必要信息。业务归属与分派方案将在下一步明确。')}
    ${state.user.role !== 'registrar' ? `<div class="notice"><strong>到件登记需要登记员身份</strong>当前为${esc(roleNames[state.user.role])}。<button class="btn ghost small" data-switch="${companyId === 'orion' ? 'lin' : 'ivy'}">切换为模拟登记员</button></div>` : ''}
    <div class="intake-grid"><section class="panel"><div class="panel-heading"><h2>到件信息</h2><span class="badge">仅合成数据</span></div><div class="panel-body"><form id="intake-form"><div class="form-grid">
    ${inputField('tracking', '收件编号 *', `DEMO-${companyId === 'orion' ? selectedSample : 'AC'}-${Date.now().toString().slice(-6)}`, true, 60)}
    <div class="field"><label for="type">收件类型 *</label><select id="type" name="type">${['采购物资', '客户资料', '保密文件', '工作用品'].map(t => `<option ${sample.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    ${inputField('source', '来源 / 寄件方 *', sample.source, true, 100)}${inputField('recipient', '外包装收件人 *', sample.recipient, true, 100)}
    ${inputField('reference', '业务编号或名称', sample.reference, false, 100)}
    <div class="field"><label for="deadline">期望处理时间（MYT，可选）</label><input id="deadline" type="datetime-local" name="deadline"><span class="hint">仅为期望时间，不代表承诺期限。</span></div>
    <div class="field full"><label for="note">必要备注</label><textarea id="note" name="note" maxlength="500">${esc(sample.note)}</textarea><span class="hint">保密件需填写完整业务编号；普通登记员保存后无法查看受限详情。</span></div></div>
    <label class="check"><input type="checkbox" name="synthetic" required>我确认以上均为合成信息，不包含真实合同、员工或客户资料。</label>
    <div class="form-actions"><span class="hint">登记后不会自动完成分派或交接。</span><button class="btn" ${state.user.role !== 'registrar' ? 'disabled' : ''}>保存并核对归属 →</button></div></form></div></section>
    <aside class="stack"><section class="panel"><div class="panel-heading"><h2>合成案例</h2><span class="count">一键填充</span></div><div class="panel-body sample-list">${companyId === 'orion' ? Object.entries(samples).map(([key, s]) => `<button class="sample ${selectedSample === key ? 'selected' : ''}" data-sample="${key}"><span class="sample-letter">${key}</span><span><strong>${s.label}</strong><small>${s.desc}</small></span></button>`).join('') : '<div class="business-card"><strong>青杉会计事务所</strong><p>业务 AC-2026-001；审核人沈思，接收人乔文。使用独立企业配置，复用同一套交接规则。</p></div>'}</div></section>
    <div class="quiet-card"><h3>信息提取方式：人工输入</h3><p>此版本尚未连接 AI。合成案例仅填充草稿，仍需你确认后保存。</p></div></aside></div>`;
}
function inputField(name, label, value, required = false, max = 100) { return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" value="${esc(value)}" maxlength="${max}" ${required ? 'required' : ''}></div>`; }
function history(events) {
  return events.length ? `<ol class="timeline">${events.map(e => `<li><time>${fmt(e.at)}</time><strong>${esc(e.action)} ${e.result === '拦截' ? '<span class="badge error">已拦截</span>' : ''}</strong><p>${esc(e.actorName)} · ${roleNames[e.role]} / ${esc(e.before)} → ${esc(e.after)}${e.planVersion ? ` / 方案 v${e.planVersion}` : ''}</p><p>${esc(e.reason)}</p><div class="log-id">${esc(e.id)}</div></li>`).join('')}</ol>` : '<p class="muted">暂无活动记录。</p>';
}
function detail() {
  const p = parcel();
  if (!p) return `${heading('RECEIPT / ACCESS', '此收件不可见', '它可能属于其他企业、受限业务，或已不在当前身份的查看范围。')}<a class="btn" href="#overview">返回工作台</a>`;
  const b = p.business;
  const stages = ['待核对', '待审核', '待交接', '已交接'];
  const current = stages.indexOf(p.status);
  const events = state.events.filter(e => e.parcelId === p.id);
  const approvedFor = p.plan?.assigneeId ? state.users.find(u => u.id === p.plan.assigneeId) : null;
  return `<a class="back" href="#overview">← 返回收件工作台</a>${heading('RECEIPT / HANDOFF JOURNEY', esc(p.tracking), `${esc(p.type)} · ${esc(p.id)} · ${fmt(p.createdAt)}`, badge(p.status))}
    <div class="progress">${stages.map((s, i) => `<div class="step ${i <= current ? 'on' : ''}"><span>0${i + 1}</span>${s}</div>`).join('')}</div>
    ${p.exception ? `<div class="notice ${p.status === '异常' ? 'error' : ''}"><strong>${esc(p.exception.kind)}</strong>${esc(p.exception.reason)}<br>下一步：${esc(p.exception.next)}</div>` : ''}
    <div class="detail-grid"><div class="stack"><section class="panel"><div class="panel-heading"><h2>到件信息</h2><span class="count">资料版本 ${p.revision}</span></div><div class="panel-body"><dl class="kv"><div><dt>来源</dt><dd>${esc(p.source)}</dd></div><div><dt>外包装收件人</dt><dd>${esc(p.recipient)}</dd></div><div><dt>登记业务线索</dt><dd>${esc(p.reference || '未提供')}</dd></div><div><dt>期望处理时间</dt><dd>${p.deadline ? `${esc(p.deadline.replace('T', ' '))} MYT` : '未设置'}<small>（不代表承诺）</small></dd></div><div class="full"><dt>必要备注</dt><dd>${esc(p.note || '无')}</dd></div></dl></div></section>
    <section class="panel"><div class="panel-heading"><h2>业务关联与分派依据</h2>${p.plan ? `<span class="badge">方案 v${p.plan.version}</span>` : ''}</div><div class="panel-body">
    ${b ? `<div class="business-card"><span class="eyebrow">${p.plan ? 'CONFIRMED BUSINESS' : 'PENDING CONFIRMATION'}</span><strong>${esc(b.id)} / ${esc(b.name)}</strong><p>${p.plan ? '关联依据：用户确认完整业务编号；收件类型一致。' : '登记已指定业务编号；仍需授权审核人明确核对。'}</p><p>必要核对：${esc(b.model)} × ${b.quantity}；状况；双方确认。</p><p>关联业务仍为「${esc(b.downstreamStatus)}」。内部交接不会自动将其办结。</p></div>` : '<p class="muted">尚未确认业务归属。名称相似时需要补充准确业务编号。</p>'}
    ${p.plan ? `<h3>${approvedFor ? `推荐接收：${esc(approvedFor.name)}` : '暂停：没有允许的接收人'}</h3><p class="hint">${esc(p.plan.reason)}</p><div class="people">${p.plan.people.map(u => `<div class="person-row"><div class="person-main"><span class="person-avatar">${esc(u.name.slice(-1))}</span><div>${esc(u.name)}<small>${esc(u.reason)}</small></div></div><span class="badge ${u.available && u.authorized ? 'handoff' : 'error'}">${u.authorized ? (u.available ? '在岗 · 有授权' : '缺席 · 有授权') : '无接收授权'}</span></div>`).join('')}</div><p class="hint" style="margin-top:14px">以上为生成方案时的快照；执行时会重新检查当前条件。</p>` : ''}
    ${p.approval ? `<div class="notice info" style="margin-top:18px;margin-bottom:0"><strong>${esc(userName(p.approval.by))} 已明确批准 · v${p.approval.version}</strong>${esc(p.approval.reason)}<br>${fmt(p.approval.at)}。交接前仍须复核。</div>` : ''}
    </div></section>
    ${p.proof ? `<section class="panel"><div class="panel-heading"><h2>内部交接证明</h2><span class="badge done">已交接</span></div><div class="panel-body"><dl class="kv"><div><dt>交出方</dt><dd>${esc(userName(p.proof.senderId))}</dd></div><div><dt>接收方</dt><dd>${esc(userName(p.proof.receiverId))}</dd></div><div><dt>完成时间</dt><dd>${fmt(p.proof.at)}</dd></div><div><dt>已核对物品</dt><dd>${esc(p.proof.model)} × ${p.proof.quantity}</dd></div><div class="full"><dt>证明项</dt><dd>✓ 型号一致　✓ 数量一致　✓ 状况无异常<br>✓ 交出方确认　✓ 接收方确认</dd></div><div class="full"><dt>交接备注</dt><dd>${esc(p.proof.note || '无')}</dd></div></dl><p class="hero-note">仅表示内部交接完成，不表示合同已审核或关联业务已办结。</p></div></section>` : ''}
    <section class="panel"><div class="panel-heading"><h2>活动记录</h2><span class="count">${events.length} 条 / MYT</span></div><div class="panel-body">${history(events)}</div></section></div>
    <aside class="stack"><section class="panel"><div class="panel-heading"><h2>下一步操作</h2><span class="count">${esc(state.user.name)}</span></div>${detailActions(p)}</section>
    ${p.canEdit ? editForm(p) : ''}<section class="quiet-card"><h3>人的决定，始终明确。</h3><p>不自动扩大权限，不将接收等同业务办结。没有允许路径时暂停，保留理由和处理记录。</p></section></aside></div>`;
}
function switchButtons(ids) { return [...new Set(ids)].filter(uid => uid && uid !== userId).map(uid => `<button class="btn ghost small" data-switch="${esc(uid)}">模拟为${esc(userName(uid))} →</button>`).join(''); }
function detailActions(p) {
  let html = '';
  const b = p.business;
  if (p.canLink) {
    const found = state.businesses.filter(b => b.type === p.type && (b.id.toLowerCase() === p.reference.toLowerCase() || b.name.includes(p.reference)));
    const exact = state.businesses.find(b => b.type === p.type && b.id.toLowerCase() === p.reference.toLowerCase());
    html += `<div class="action-section"><h3>01 / 核对业务归属</h3><p>候选仅用于辅助核对；请填入完整编号并确认。</p>${found.length ? `<div class="candidates">${found.map(b => `<div class="candidate"><strong>${esc(b.id)} · ${esc(b.name)}</strong><small>${b.id.toLowerCase() === p.reference.toLowerCase() ? '编号完全一致' : '名称匹配，仍有歧义，不能自动选择'}</small></div>`).join('')}</div>` : '<p>没有可见候选，请向业务负责人确认完整编号。未配置类型不会自动匹配。</p>'}
    <form data-parcel-action="link">${inputField('businessId', '完整业务编号 *', exact?.id || '', true, 100)}<label class="check"><input name="confirmed" type="checkbox" required>我已核对编号、类型与到件资料一致。</label><button class="btn">确认归属，生成方案</button></form></div>`;
  }
  if (p.canReview) html += `<div class="action-section"><h3>02 / 授权审核</h3><p>批准会允许指定人员进入交接；改派只能选择已授权且在岗的人。</p><form data-parcel-action="review"><div class="field"><label for="decision">审核决定</label><select name="decision" id="decision"><option value="approve" ${!p.plan.assigneeId ? 'disabled' : ''}>批准分派</option><option value="hold" ${!p.plan.assigneeId ? 'selected' : ''}>暂存，保持暂停</option><option value="escalate">申请指定授权人介入</option><option value="return">退回，补充信息</option></select></div><div class="field"><label for="assigneeId">获授权接收人（批准时）</label><select id="assigneeId" name="assigneeId"><option value="">无可用接收人</option>${state.users.filter(u => u.available && u.role === 'receiver' && b.authorized.includes(u.id)).map(u => `<option value="${u.id}" ${u.id === p.plan.assigneeId ? 'selected' : ''}>${esc(u.name)} · 在岗 / 已授权</option>`).join('')}</select></div><div class="field"><label for="review-reason">决定理由 *</label><textarea id="review-reason" name="reason" maxlength="500" required placeholder="说明批准、改派、暂存或退回的原因"></textarea></div><button class="btn">记录审核决定</button></form></div>`;
  if (p.status === '待审核' && !p.canReview) html += `<div class="action-section"><h3>等待授权审核</h3><p>当前身份不能批准；需要该业务配置中的授权审核人决定。</p><div class="inline-actions">${switchButtons(b?.reviewers || [])}</div></div>`;
  if (p.status === '待核对' && !p.canLink) html += `<div class="action-section"><h3>等待归属核对</h3><p>需由登记员或指定业务审核人确认。</p></div>`;
  if (p.status === '异常' && !p.canReview) html += `<div class="action-section"><h3>等待异常处理</h3><p>${esc(p.exception?.next || '请授权审核人处理')}</p><div class="inline-actions">${switchButtons(b?.reviewers || [])}</div></div>`;
  if (p.status === '待交接') {
    const canRelease = ['registrar', 'reviewer'].includes(state.user.role) && state.user.available && b?.readers.includes(userId);
    if (!p.release && canRelease) html += `<div class="action-section"><h3>03 / 交出方确认</h3><p>当前模拟交出方：${esc(state.user.name)}。确认前会重新检查批准是否有效。</p><form data-parcel-action="release"><label class="check"><input type="checkbox" name="confirmed" required>我已实际核对收件，并向获批准的接收人当面交出。</label><button class="btn">确认交出，等待接收</button></form></div>`;
    if (p.release) html += `<div class="action-section"><h3>交出方已确认</h3><p>${esc(userName(p.release.by))} · ${fmt(p.release.at)}<br>等待${esc(userName(p.plan.assigneeId))}完成接收核对。</p>${!p.canReceive ? switchButtons([p.plan.assigneeId]) : ''}</div>`;
    else if (!canRelease) html += `<div class="action-section"><h3>先由交出方确认</h3><p>需要登记员或有权审核人以自己的身份确认交出。</p>${switchButtons(b?.readers.filter(uid => state.users.some(u => u.id === uid && ['registrar', 'reviewer'].includes(u.role) && u.available)) || [])}</div>`;
    if (p.canReceive) html += `<div class="action-section"><h3>04 / 核对并接收</h3><p>应到物品：${esc(b.model)} × ${b.quantity}。实物不符时请报告异常，不能直接完成。</p><form data-parcel-action="handoff">${[['model', '型号与业务记录一致'], ['quantity', '数量与业务记录一致'], ['condition', '状况无异常'], ['sender', '确认交出方已当面交出'], ['receiver', '本人已实际核对并接收']].map(([key, label]) => `<label class="check"><input name="${key}" type="checkbox" required>${label}</label>`).join('')}<div class="field"><label for="proof-note">交接备注（可选）</label><textarea id="proof-note" name="note" maxlength="500"></textarea></div><button class="btn">复核条件并确认接收</button><span class="hint">${p.release ? '提交时再次检查授权、人员、版本与重复领取。' : '交出方尚未确认；提交会被服务端拦截。'}</span></form></div>`;
  }
  if (['异常', '待审核'].includes(p.status) && b && (state.user.role === 'registrar' || b.reviewers.includes(userId))) html += `<div class="action-section"><details><summary>条件已修正？重新生成方案</summary><form data-parcel-action="replan"><div class="field"><label for="replan-reason">修正情况 / 重新规划理由 *</label><textarea id="replan-reason" name="reason" required maxlength="500"></textarea></div><button class="btn secondary">重新检查并生成方案</button></form></details></div>`;
  if (['待审核', '待交接'].includes(p.status) && (p.canReceive || b?.reviewers.includes(userId) || state.user.role === 'registrar')) html += `<div class="action-section"><details><summary>实物或资料不符？报告异常</summary><form data-parcel-action="exception"><div class="field"><label for="exception-reason">异常原因 *</label><textarea id="exception-reason" name="reason" required maxlength="500" placeholder="例如：应到两台，实到一台"></textarea></div><button class="btn danger">记录异常，暂停交接</button></form></details></div>`;
  if (p.status === '已交接') html += '<div class="action-section"><h3>✓ 内部交接已完成</h3><p>本件不能再次领取，证明与活动记录保存在服务端。</p></div>';
  return html || '<div class="action-section"><p>当前身份无可执行操作，可查看已获授权的记录。</p></div>';
}
function editForm(p) { return `<section class="panel"><div class="panel-body"><details><summary>编辑资料或补充备注</summary><p class="hint">无关备注保留批准；来源、收件人或业务线索变化，会使原批准失效并回到待核对。</p><form data-parcel-action="edit" class="stack" style="gap:12px;margin-top:14px">${inputField('source', '来源', p.source, true, 100)}${inputField('recipient', '外包装收件人', p.recipient, true, 100)}${inputField('reference', '业务编号或名称', p.reference, false, 100)}<div class="field"><label for="edit-note">备注</label><textarea id="edit-note" name="note" maxlength="500">${esc(p.note)}</textarea></div><div class="field"><label for="edit-reason">修改理由 *</label><textarea id="edit-reason" name="reason" required maxlength="500"></textarea></div><button class="btn secondary">保存资料并重新校验</button></form></details></div></section>`; }
function rules() {
  const admin = state.user.role === 'admin';
  return `${heading('POLICY / PEOPLE & PERMISSIONS', '规则清楚，交接才可靠。', '企业配置决定谁能审核、谁能接收；角色名称本身不会扩大授权。')}
    <div class="notice info"><strong>${esc(state.company.name)}</strong>${esc(state.company.rule)}</div>
    <div class="config-grid"><section class="panel"><div class="panel-heading"><h2>当前企业的交接规则</h2><span class="badge">规则版 · 无 AI</span></div><div class="panel-body">${[
      ['业务归属必须明确', '完整业务编号优先，类型一致且用户确认后才生成方案。名称歧义必须补充信息。'],
      ['每条分派都要审核', '只有业务指定审核人能批准、改派、退回或暂存。接收授权须独立配置并留记录。'],
      ['关键变化使批准失效', '来源、收件人、业务归属、授权或相关人员状态变化时，执行前复核会拦截旧批准。无关备注不使批准失效。'],
      ['双身份确认与完成门槛', '交出方先确认，获批准的接收人再确认型号、数量、状况与实际接收；服务端事务防止重复交接。'],
      ['没有授权路径就暂停', '保密件没有可用授权人时，只能暂存、申请指定授权人介入或退回。不把申请当作已获授权。'],
    ].map(([title, desc], i) => `<div class="rule-item"><strong><span class="rules-number">0${i + 1}</span>${title}</strong><p>${desc}</p></div>`).join('')}</div></section>
    <section class="panel"><div class="panel-heading"><h2>人员与可用性</h2><span class="count">合成身份</span></div><div class="panel-body">${state.users.map(u => `<div class="person-row"><div class="person-main"><span class="person-avatar">${esc(u.name.slice(-1))}</span><div>${esc(u.name)}<small>${roleNames[u.role]}</small></div></div><span class="badge ${u.available ? 'handoff' : 'error'}">${u.available ? '在岗' : '不在岗'}</span></div>`).join('')}</div></section>
    <section class="panel wide"><div class="panel-heading"><h2>可见业务配置与授权</h2><span class="count">只显示当前身份获准查看的业务</span></div><div class="table-scroll"><table><thead><tr><th>业务 / 类型</th><th>原负责人</th><th>接收授权名单</th><th>授权审核人</th><th>完成条件</th></tr></thead><tbody>${state.businesses.map(b => `<tr><td><strong>${esc(b.id)}</strong><small>${esc(b.name)} / ${b.type}</small></td><td>${esc(userName(b.ownerId))}</td><td>${esc(b.authorized.map(userName).join('、') || '暂无')}</td><td>${esc(b.reviewers.map(userName).join('、'))}</td><td>${esc(b.model)} × ${b.quantity}<small>状况、交出方及接收方确认</small></td></tr>`).join('')}</tbody></table></div></section>
    ${admin ? `<section class="panel"><div class="panel-heading"><h2>独立变更接收授权</h2></div><div class="panel-body"><p class="hint">变更不会自动批准或完成交接。案例 D 可撤销 PO-2026-001 的李宁授权，再切换接收人尝试领取。</p><form id="authorization-form" class="stack" style="margin-top:16px;gap:14px"><div class="field"><label for="config-business">业务</label><select id="config-business" name="businessId">${state.businesses.filter(b => b.type !== '保密文件').map(b => `<option value="${b.id}">${esc(b.id)} / ${esc(b.name)}</option>`).join('')}</select></div><div class="field"><label for="config-user">接收人</label><select id="config-user" name="userId">${state.users.filter(u => u.role === 'receiver').map(u => `<option value="${u.id}" ${u.id === 'nina' ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div><div class="field"><label for="config-authorized">变更为</label><select id="config-authorized" name="authorized"><option value="false">撤销接收授权</option><option value="true">授权生效</option></select></div><div class="field"><label for="auth-reason">变更理由 *</label><textarea id="auth-reason" name="reason" maxlength="500" required></textarea></div><button class="btn">记录授权变更</button></form></div></section>
    <section class="panel"><div class="panel-heading"><h2>变更人员在岗状态</h2></div><div class="panel-body"><form id="availability-form" class="stack" style="gap:14px"><div class="field"><label for="availability-user">人员</label><select id="availability-user" name="userId">${state.users.map(u => `<option value="${u.id}">${esc(u.name)} / ${u.available ? '在岗' : '不在岗'}</option>`).join('')}</select></div><div class="field"><label for="availability-value">变更为</label><select id="availability-value" name="available"><option value="false">不在岗</option><option value="true">在岗</option></select></div><div class="field"><label for="availability-reason">变更理由 *</label><textarea id="availability-reason" name="reason" maxlength="500" required></textarea></div><button class="btn secondary">记录人员状态变更</button></form><p class="hero-note">保密业务的授权名单不在普通配置负责人的可见范围；不允许通过此页面增加保密接收权限。</p></div></section>
    <section class="panel wide"><div class="panel-heading"><h2>配置活动记录</h2></div><div class="panel-body">${history(state.events.filter(e => !e.parcelId))}</div></section>` : `<div class="quiet-card wide"><h3>配置变更需要配置负责人身份</h3><p>可用性与接收授权在独立操作中修改并记录理由，不能通过审核改派隐式扩权。</p><div class="inline-actions" style="margin-top:12px">${switchButtons([companyId === 'orion' ? 'admin' : 'ops'])}</div></div>`}
    </div>`;
}
function guide() {
  return `${heading('DEMO / ACCEPTANCE & EVIDENCE', '你来验收，我们留证。', '先完成主流程，再检查异常边界。这里如实列出实现、模拟与待验证范围。', '<button class="btn secondary" data-action="export">导出可见 JSON ↗</button>')}
    <div class="notice info"><strong>当前是可操作的本地比赛 MVP</strong>SQLite 持久化；服务端校验；所有人员、企业、采购与文件都是合成数据。模拟身份可任意切换，不具备生产认证能力。</div>
    <div class="guide-grid">
    <section class="panel guide-card"><span class="badge handoff">A / 主验收 · 正常闭环</span><h3>采购物资到件 → 授权交接</h3><ol><li>星桥企业，模拟「林悦 · 登记员」，打开 DEMO-A-001（或登记案例 A）。核对 <code>PO-2026-001</code> 并确认。</li><li>方案应说明黄安不在岗，推荐有授权且在岗的李宁。</li><li>切换「陈美 · 授权审核人」，打开同一收件，填写理由并批准。</li><li>由林悦或陈美确认交出，再切换「李宁 · 接收人」。</li><li>核对显示器 M27 × 2，勾选全部证明项并确认接收。查看已交接状态、证明与完整活动记录。</li><li>刷新浏览器，记录仍在；关联采购业务仍为进行中。</li></ol><a class="btn ghost small" href="#overview">开始验收 →</a></section>
    <section class="panel guide-card"><span class="badge error">B / 保密与无授权接收人</span><h3>该暂停的时候，必须暂停</h3><ol><li>林悦、陈美或李宁的列表里不应出现 DEMO-B-001 的受限元数据。</li><li>切换「周晨 · 授权审核人」，核对保密件完整业务编号 <code>CT-2026-001</code>。</li><li>温岚、何皓均不在岗。系统不给普通员工接收权限，也不能批准普通分派。</li><li>填写理由选择「暂存」或「申请指定授权人介入」。收件保持异常，日志记录决定。</li></ol><p>业务类型由合成企业资料明确提供，系统不从包装猜测保密等级。</p></section>
    <section class="panel guide-card"><span class="badge review">C / 归属歧义</span><h3>两个相似项目，不静默选择</h3><ol><li>以林悦打开 DEMO-C-001，查看「晨光」的两个候选。</li><li>未填写完整业务编号时不能继续。</li><li>向合成业务信息确认后，输入 <code>CLIENT-101</code> 或 <code>CLIENT-102</code>，明确确认才生成方案。</li></ol><p>候选展示可见依据，不使用未经校准的精确置信百分比。</p></section>
    <section class="panel guide-card"><span class="badge error">D / 批准后关键变化</span><h3>旧批准不能继续执行</h3><ol><li>新建案例 D，完成归属核对、陈美批准与交出方确认，暂不接收。</li><li>切换「许岑 · 配置负责人」→ 企业规则，撤销 <code>PO-2026-001 / 李宁</code> 的接收授权，写明理由。</li><li>切换李宁，打开原收件并尝试接收。服务端应拦截，旧批准失效并留下原因。</li><li>恢复李宁授权后，登记员或审核人重新生成方案、重新审核、重新确认交出才能接收。</li></ol><p>撤销的是接收权限；既有公开业务的查看权限保留，便于本人看到拦截结果。保密数据不走此路径。</p></section>
    <section class="panel guide-card"><span class="badge error">E / 实物不符与漏核对</span><h3>不能靠少勾一个框就完成</h3><ol><li>新建案例 E，批准后切换李宁，展开「实物或资料不符」。</li><li>填写「应到两台，实到一台」，报告异常。批准失效，交接暂停。</li><li>必要证明项缺失时不能交接。即使直接请求接口，服务端也会拒绝。</li><li>重复领取、过期页面或越权审核不会产生重复交接结果。</li></ol></section>
    <section class="panel guide-card"><span class="badge">已实现 / 技术与边界</span><h3>透明说明，而非过度承诺</h3><ul><li>原生 HTML/CSS/JavaScript + Node.js 24 内置 HTTP 与 SQLite，无第三方依赖。</li><li>服务端事务内重新检查状态、方案版本、授权、人员状态及完成证明；可刷新保留。</li><li>第二家合成企业「青杉会计事务所」用不同人员和授权复用同一流程；接口按企业范围过滤。</li><li>活动记录可导出，但本机拥有者能修改数据库，不声称防篡改或生产安全。</li><li>Orbyte 员工、授权与业务数据均由合成配置模拟；未连接 Orbyte、AI、WhatsApp 或真实通知。</li><li>没有真实访谈、商业收益测量或受控用户实验；这些均为待验证项。当前不提供正式认证、生产租户隔离、云备份或专业判断。</li></ul></section>
    <section class="panel guide-card wide"><span class="badge">验收建议 / 保留真实观察</span><h3>把测试结果记下来，再讨论收益</h3><p>请记录：使用者背景、案例编号、完成耗时、需要帮助次数、错误与失败原因。对比聊天＋表格时，使用同等难度的不同案例并交换顺序。不要把自动测试通过当作市场需求成立，也不要预写节省时间百分比。</p><p class="hero-note">启动与自动测试方法、接口假设、已执行检查及测试记录模板，都在仓库 README 和 docs 文件夹。GitHub / Replit 在线同步与正式提交需另行验证。</p></section>
    </div>`;
}

app.addEventListener('change', async e => {
  try {
    if (e.target.id === 'company-select') { const c = boot.companies.find(c => c.id === e.target.value); await changeIdentity(c.id, c.users[0].id); }
    if (e.target.id === 'user-select') await changeIdentity(companyId, e.target.value);
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
    if (target.dataset.filter) { filter = filter === target.dataset.filter ? '全部' : target.dataset.filter; render(); }
    if (target.dataset.sample) { selectedSample = target.dataset.sample; render(); }
    if (target.dataset.switch) await changeIdentity(companyId, target.dataset.switch);
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
  let path, data, message;
  if (form.id === 'intake-form') { path = '/api/parcels'; data = values; message = '登记成功。'; }
  else if (form.id === 'authorization-form' || form.id === 'availability-form') {
    path = '/api/config'; data = { ...values, kind: form.id === 'authorization-form' ? 'authorization' : 'availability', authorized: values.authorized === 'true', available: values.available === 'true' }; message = '配置已记录。旧批准执行时将重新检查条件。';
  } else if (form.dataset.parcelAction) {
    const p = parcel(); const action = form.dataset.parcelAction;
    path = `/api/parcels/${p.id}/${action}`;
    data = { ...values, etag: p.etag || 0, version: p.plan?.version, confirmed: values.confirmed === 'on' };
    if (action === 'handoff') data.checks = Object.fromEntries(['model', 'quantity', 'condition', 'sender', 'receiver'].map(key => [key, values[key] === 'on']));
    message = ({ link: '业务归属已确认，方案已生成。', review: '审核决定已记录。', release: '交出方确认已保存，请接收人核对。', handoff: '内部交接完成，证明与日志已保存。', exception: '异常已记录，交接已暂停。', replan: '已按当前条件生成新方案，需要重新审核。', edit: '资料已保存，关键变化已重新校验。' })[action];
  } else return;
  busy = true;
  form.querySelectorAll('button').forEach(b => { b.disabled = true; });
  try {
    const result = await api(path, data); state = result;
    if (result.created) {
      message = result.created.message;
      if (result.created.visible) go(`parcel/${result.created.id}`); else go('overview');
    }
    render(); toast(message);
  } catch (error) {
    if (error.data?.parcels) { state = error.data; render(); }
    else { try { await refresh(); } catch { form.querySelectorAll('button').forEach(b => { b.disabled = false; }); } }
    toast(error.message, true);
  } finally { busy = false; }
});
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
async function start() {
  try {
    boot = await api('/api/bootstrap');
    let c = boot.companies.find(c => c.id === companyId);
    if (!c) { c = boot.companies[0]; companyId = c.id; }
    if (!c.users.some(u => u.id === userId)) userId = c.users[0].id;
    await refresh();
  } catch (error) { app.innerHTML = `<main class="boot"><h1>暂时无法打开工作空间</h1><p>${esc(error.message)}</p><p>请确认本地服务仍在运行，然后刷新页面。</p><button class="btn" id="retry">重试连接</button></main>`; document.querySelector('#retry').onclick = start; }
}
start();
