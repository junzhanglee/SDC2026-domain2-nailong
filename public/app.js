import { STATUS, TYPE, EXCEPTION, english } from './english.js';
const app = document.querySelector('#app');
const toastEl = document.querySelector('#toast');
const roleNames = { registrar: 'Registrar', reviewer: 'Reviewer', receiver: 'Receiver', admin: 'Administrator' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = value => value ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) + ' MYT' : '—';
const statusClass = value => ({ [STATUS.review]: 'review', [STATUS.handoff]: 'handoff', [STATUS.done]: 'done', [STATUS.exception]: 'error', [STATUS.returned]: 'return' })[value] || '';
const show = value => esc(english(value));
const badge = value => `<span class="badge ${statusClass(value)}">${show(value)}</span>`;
let state, companyId, userId, demoAccounts = [], authGeneration = 0;
let filter = 'To do', search = '', selectedSample = 'A', toastTimer, busy = false, completion = null;
const userName = uid => english(state.users.find(u => u.id === uid)?.name || uid || 'Unassigned');
const initials = value => english(value).split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase();
const parcel = () => state.parcels.find(p => p.id === decodeURIComponent(location.hash.slice(8)));
const route = () => location.hash.startsWith('#parcel/') ? 'detail' : (location.hash === '#main' ? 'overview' : (location.hash.slice(1) || 'overview'));
function toast(message, error = false) { clearTimeout(toastTimer); toastEl.textContent = english(message); toastEl.className = `show${error ? ' error' : ''}`; toastTimer = setTimeout(() => { toastEl.className = ''; }, error ? 8500 : 4500); }
async function api(path, data) {
  const generation = authGeneration;
  const response = await fetch(path, { method: data ? 'POST' : 'GET', credentials: 'same-origin', headers: data ? { 'Content-Type': 'application/json' } : {}, ...(data ? { body: JSON.stringify(data) } : {}) });
  const result = await response.json();
  if (generation !== authGeneration) throw new Error('Your account session has changed. Please try again.');
  if (!response.ok) {
    const error = new Error(english(result.error || result.message || 'Request failed')); error.data = result; error.status = response.status;
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
  const nav = [['overview', 'tasks', 'My tasks'], ...(state.user.role === 'registrar' ? [['intake', 'add', 'Register']] : []), ['account', 'user', 'Account']];
  document.body.className = 'personal-app';
  app.innerHTML = `<div class="personal-shell"><header class="personal-header"><a class="personal-brand" href="#overview">${icon('box')}<span>ParcelRelay</span></a><a class="account-shortcut" href="#account" aria-label="My account ${show(state.user.name)}"><span>${show(state.user.name)}</span><span class="mini-avatar">${esc(initials(state.user.name))}</span></a></header>
  <main id="main" class="personal-main page-screen ${animate ? 'route-enter' : ''}">${r === 'overview' || r === 'records' ? overview() : r === 'intake' ? intake() : r === 'detail' ? detail() : r === 'rules' ? (state.user.role === 'admin' ? rules() : '<div class="empty"><strong>Administrator access required</strong><a href="#overview">Back to my tasks</a></div>') : r === 'guide' ? guide() : accountPage()}</main>
  <nav class="bottom-nav" aria-label="Main navigation">${nav.map(([key, glyph, label]) => `<a href="#${key}" class="${r === key || (key === 'overview' && ['detail', 'records'].includes(r)) || (key === 'account' && ['rules', 'guide'].includes(r)) ? 'active' : ''}" ${r === key ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span></a>`).join('')}</nav></div>`;
}
function renderLogin(message = '') {
  document.body.className = 'personal-app signed-out';
  app.innerHTML = `<main id="main" class="login-shell route-enter"><a href="#login" class="personal-brand">${icon('box')}<span>ParcelRelay</span></a><div class="login-heading"><span class="login-kicker">YOUR WORK, IN HAND.</span><h1>Every handoff,<br>starts with you.</h1><p>Sign in to see your tasks and keep work moving.</p></div><form id="login-form" class="login-form">${message ? `<p class="form-error" role="alert">${esc(message)}</p>` : ''}<div class="field"><label for="login-name">Username</label><input id="login-name" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="48" placeholder="Your assigned username"></div><div class="field"><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" required maxlength="128" placeholder="Your password"></div><button class="btn login-submit">Sign in to my tasks ${icon('arrow')}</button><p class="login-help">Your administrator creates your account.</p></form>
  <details class="demo-account-help"><summary>Explore demo accounts</summary><p>These accounts use synthetic data. Each person signs in separately. Initial passwords stop working after a password change.</p><div>${demoAccounts.map(a => `<div class="demo-login-row"><strong>${show(a.name)}<small>${show(a.role)}</small></strong><span><code>${esc(a.username)}</code><small>${esc(a.password)}</small></span></div>`).join('')}</div></details><footer class="login-footer">PARCELRELAY <span>·</span> Synthetic data demo</footer></main>`;
}
function accountPage() {
  return `<div class="account-page">${heading('YOUR SPACE', 'Account', 'Your identity and current workspace.')}<section class="profile-card"><div class="profile-avatar">${esc(initials(state.user.name))}</div><div><h2>${show(state.user.name)}</h2><p>${roleNames[state.user.role]} · ${show(state.company.name)}</p><small>Username ${esc(state.account.username)}</small></div></section>
  <div class="profile-links"><a href="#records">My activity ${icon('arrow')}</a>${state.user.role === 'admin' ? `<a href="#rules">Permissions & rules ${icon('arrow')}</a>` : ''}<a href="#guide">Demo guide ${icon('arrow')}</a></div>
  <details class="settings-section"><summary>Change password<span>Update your sign-in details</span></summary><div class="settings-body"><form id="password-form" class="focus-form"><div class="field"><label for="current-password">Current password</label><input id="current-password" name="currentPassword" type="password" autocomplete="current-password" required maxlength="128"></div><div class="field"><label for="new-password">New password (12–128 characters)</label><input id="new-password" name="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div><button class="btn">Update password</button></form></div></details>
  ${state.user.role === 'admin' ? `<details class="settings-section"><summary>Team accounts<span>View & create</span></summary><div class="settings-body"><p>New accounts receive a role. Business access, receiving permissions and review permissions are configured separately.</p><div class="member-list">${(state.accounts || []).map(a => `<div><span>${esc(userName(a.userId))}</span><code>${esc(a.username)}</code></div>`).join('')}</div><form id="account-create-form" class="focus-form"><div class="form-grid">${inputField('member-name', 'Full name *', '', true, 40)}${inputField('member-username', 'Username *', '', true, 48)}<div class="field"><label for="member-role">Role</label><select id="member-role" name="role">${Object.entries(roleNames).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></div><div class="field"><label for="member-password">Initial password (at least 12 characters)</label><input id="member-password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div></div><button class="btn">Create team account</button></form></div></details>` : ''}
  <button class="logout-button" data-action="logout">${icon('logout')}Sign out</button><p class="account-footnote">This workspace uses synthetic business data. Sign-in and task ownership are verified by the server.</p></div>`;
}
function heading(kicker, title, subtitle, action = '') { return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`; }
function canRelease(p) { return !!p.canRelease; }
function canReplan(p) { return !!p.business && [STATUS.exception, STATUS.review].includes(p.status) && (p.creatorId === userId || p.business.reviewers.includes(userId)); }
function isMyTask(p) { return !!p.task; }
function phase(p) {
  if (p.status === STATUS.done) return 5;
  if (p.status === STATUS.link || p.status === STATUS.returned) return 1;
  if (p.status === STATUS.review || p.status === STATUS.exception) return 2;
  return p.release ? 4 : 3;
}
function taskLabel(p) {
  if (p.status === STATUS.done) return 'View handoff';
  if (p.status === STATUS.exception) return isMyTask(p) ? 'Resolve issue' : 'View progress';
  return ['Register arrival', 'Match business', 'Review assignment', 'Confirm release', 'Verify receipt'][phase(p)] || 'View progress';
}
function nextAction(p) {
  if (p.status === STATUS.done) return `Received by ${userName(p.proof?.receiverId)}`;
  if (p.status === STATUS.exception) return english(p.exception?.kind) || 'Action required';
  if (phase(p) === 1) return 'Registrar to match the business';
  if (phase(p) === 2) return `${(p.business?.reviewers || []).map(userName).join(', ')} to review`;
  if (phase(p) === 3) return 'Sender releases, then receiver verifies';
  return `${userName(p.plan?.assigneeId)} to verify receipt`;
}
function overview() {
  const myTasks = state.parcels.filter(isMyTask);
  const shown = state.parcels.filter(p => ((filter === 'To do' ? isMyTask(p) : filter === 'Following' ? p.status !== STATUS.done && !isMyTask(p) : filter === 'Completed' ? p.status === STATUS.done : p.status === filter))
    && `${p.tracking} ${p.recipient} ${english(p.recipient)} ${p.businessId || ''} ${p.reference} ${english(p.reference)}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(isMyTask(b)) - Number(isMyTask(a)) || b.createdAt.localeCompare(a.createdAt));
  return `<div class="worklist-page">${heading('MY TASKS', `Hello, ${show(state.user.name)}.`, `${myTasks.length} ${myTasks.length === 1 ? 'task needs' : 'tasks need'} your attention.`, state.user.role === 'registrar' ? '<a class="btn" href="#intake">＋ Register parcel</a>' : '<button class="text-action" data-action="refresh">Refresh ↻</button>')}
    <section class="panel task-list"><div class="list-controls"><div class="list-tabs" role="group" aria-label="Task view">${['To do', 'Following', 'Completed'].map(s => `<button class="list-tab ${filter === s ? 'active' : ''}" data-filter="${s}" aria-pressed="${filter === s}">${s}<span>${state.parcels.filter(p => s === 'To do' ? isMyTask(p) : s === 'Following' ? p.status !== STATUS.done && !isMyTask(p) : p.status === STATUS.done).length}</span></button>`).join('')}</div><input id="search" type="search" aria-label="Search parcels" placeholder="Search parcel or business ID" value="${esc(search)}"></div>
    ${shown.length ? `<div class="receipt-list">${shown.map(p => `<article class="receipt-row"><div class="receipt-symbol" aria-hidden="true">${p.status === STATUS.done ? '✓' : p.status === STATUS.exception ? '!' : '▱'}</div><div class="receipt-name"><a href="#parcel/${p.id}">${esc(p.tracking)}</a><p>${show(p.type)}<span>·</span>${show(p.recipient)}</p></div><div class="receipt-stage">${badge(p.status)}<small>${show(nextAction(p))}</small></div><a href="#parcel/${p.id}" class="${isMyTask(p) ? 'btn small' : 'btn ghost small'}" aria-label="${esc(taskLabel(p))} ${esc(p.tracking)}">${isMyTask(p) ? esc(taskLabel(p)) : p.status === STATUS.done ? 'View result' : 'View progress'} →</a></article>`).join('')}</div>` : `<div class="empty"><span class="empty-mark" aria-hidden="true">${filter === 'To do' ? '✓' : '▱'}</span><strong>${filter === 'To do' && !search ? 'You are all caught up' : 'No parcels found'}</strong><p>${filter === 'To do' ? 'Tasks appear when your action is needed. See Following for parcels you have passed on.' : 'Try another tab or parcel ID.'}</p>${filter !== 'Following' ? '<button class="btn ghost small" data-filter="Following">View parcels in progress</button>' : ''}</div>`}
    </section><div class="list-bottom"><p>Complete your step. The next task then moves to the right colleague.</p><details class="list-more"><summary>More options</summary><button class="text-action" data-action="export">Export my visible records</button><a href="#guide">Read the demo guide</a></details></div></div>`;
}
const samples = {
  A: { label: 'Equipment · Complete handoff', desc: 'The owner is away. An available, authorized backup is recommended.', type: TYPE.purchase, reference: 'PO-2026-001', source: 'Synthetic supplier · CloudSail Equipment', recipient: 'Alan Huang / Procurement', note: 'Case A: Two monitors arrived. Match the purchase order and hand them to the authorized backup.' },
  B: { label: 'Confidential · No available receiver', desc: 'Only designated reviewers can see this parcel. Other staff cannot collect it.', type: TYPE.confidential, reference: 'CT-2026-001', source: 'Synthetic partner', recipient: 'Wen Lan', note: 'Case B: Declared confidential. The owner and backup are both unavailable.' },
  C: { label: 'Similar projects · Ambiguous match', desc: 'Two Dawn projects match. An exact business ID is required.', type: TYPE.client, reference: 'Dawn', source: 'Synthetic client · Dawn', recipient: 'Project team', note: 'Case C: Confirm the branding or website project using its exact ID. A similar name is not enough.' },
  D: { label: 'Permission revoked · Approval expires', desc: 'Approve first, then revoke the backup receiver permission and attempt collection.', type: TYPE.purchase, reference: 'PO-2026-001', source: 'Synthetic supplier · CloudSail Equipment', recipient: 'Alan Huang / Procurement', note: 'Case D: After approval, the administrator revokes receiving permission for Nina Li. Collection must be blocked.' },
  E: { label: 'Item mismatch · Handoff paused', desc: 'Report a model or quantity mismatch and retain the record.', type: TYPE.purchase, reference: 'PO-2026-001', source: 'Synthetic supplier · CloudSail Equipment', recipient: 'Alan Huang / Procurement', note: 'Case E: Only one monitor arrived; the purchase order requires two. Report the mismatch.' },
};
function intake() {
  const sample = companyId === 'orion' ? samples[selectedSample] : { type: TYPE.client, reference: 'AC-2026-001', source: 'Synthetic client · Greenfield', recipient: 'Jo Wen', note: 'Receiving documents does not mean their contents have been reviewed.' };
  return `<div class="intake-focus">${heading('STEP 1 / REGISTER', 'What has arrived?', 'Record the arrival first, then match it to the right business.')}
    ${state.user.role !== 'registrar' ? '<div class="notice">Your account cannot register arrivals.</div>' : ''}
    <section class="panel intake-card"><details class="sample-picker"><summary>Try a demo scenario <span>Fill form</span></summary><div class="sample-list">${companyId === 'orion' ? Object.entries(samples).map(([key, s]) => `<button class="sample ${selectedSample === key ? 'selected' : ''}" data-sample="${key}"><span class="sample-letter">${key}</span><span><strong>${s.label}</strong><small>${s.desc}</small></span></button>`).join('') : '<p>Synthetic client details for Cedar Accounting are prefilled.</p>'}</div></details>
    <form id="intake-form" class="intake-fields"><div class="form-grid">
    ${inputField('tracking', 'Parcel ID *', `DEMO-${companyId === 'orion' ? selectedSample : 'AC'}-${Date.now().toString().slice(-6)}`, true, 60)}
    <div class="field"><label for="type">Parcel type *</label><select id="type" name="type">${[TYPE.purchase, TYPE.client, TYPE.confidential, TYPE.supplies].map(t => `<option value="${esc(t)}" ${sample.type === t ? 'selected' : ''}>${show(t)}</option>`).join('')}</select></div>
    ${inputField('source', 'Source / sender *', sample.source, true, 100)}${inputField('recipient', 'Recipient on label *', sample.recipient, true, 100)}
    <div class="field full"><label for="reference">Business ID or name</label><input id="reference" name="reference" value="${esc(sample.reference)}" maxlength="100"><span class="hint">Confidential parcels require the full business ID.</span></div></div>
    <details class="optional-fields"><summary>Add notes or a preferred time <span>Optional</span></summary><div class="stack"><div class="field"><label for="note">Notes</label><textarea id="note" name="note" maxlength="500">${esc(sample.note)}</textarea></div><div class="field"><label for="deadline">Preferred handling time (MYT)</label><input id="deadline" name="deadline" type="datetime-local"><span class="hint">A preferred time is not a guaranteed deadline.</span></div></div></details>
    <label class="check demo-check"><input name="synthetic" type="checkbox" required>I confirm this is synthetic data with no real contracts, employee or client information.</label>
    <div class="step-submit"><span>Next: match the business</span><button class="btn" ${state.user.role !== 'registrar' ? 'disabled' : ''}>Save & match →</button></div></form></section></div>`;
}
function inputField(name, label, value, required = false, max = 100, localize = false) { return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" value="${localize ? show(value) : esc(value)}" ${localize ? `data-stored-value="${esc(value)}"` : ''} maxlength="${max}" ${required ? 'required' : ''}></div>`; }
function history(events) {
  return events.length ? `<ol class="timeline">${events.map(e => `<li><time>${fmt(e.at)}</time><strong>${show(e.action)} ${e.result === '拦截' ? '<span class="badge error">Blocked</span>' : ''}</strong><p>${show(e.actorName)} · ${roleNames[e.role]} / ${show(e.before)} → ${show(e.after)}${e.planVersion ? ` / Assignment v${e.planVersion}` : ''}</p><p>${show(e.reason)}</p><div class="log-id">${esc(e.id)}</div></li>`).join('')}</ol>` : '<p class="muted">No activity yet.</p>';
}
function stepper(p) {
  const n = phase(p);
  const labels = ['Register', 'Match business', 'Review', 'Confirm release', 'Verify receipt'];
  return `<ol class="journey-steps" aria-label="Handoff progress">${labels.map((title, i) => `<li class="${i < n ? 'complete' : i === n ? 'current' : ''}" ${i === n ? 'aria-current="step"' : ''}><span class="step-circle">${i < n ? '✓' : i + 1}</span><span class="step-title">${title}</span>${i === n ? '<small>Current step</small>' : ''}</li>`).join('')}</ol>`;
}
function businessSummary(p) {
  const b = p.business;
  return b ? `<div class="item-summary"><span class="summary-icon" aria-hidden="true">▱</span><div><strong>${show(b.model)} <span>× ${b.quantity}</span></strong><small>${show(b.name)} · ${esc(b.id)}</small></div></div>` : '';
}
function switchTask(ids, verb) {
  const target = ids.find(uid => state.users.some(u => u.id === uid));
  return `<div class="role-handoff"><p class="handoff-caption">${target ? `Next: <strong>${esc(userName(target))}</strong> · ${verb}` : 'Waiting for the designated colleague'}</p><p class="wait-note">This step will appear in their task list when they sign in to their own account.</p><a class="btn" href="#overview">Back to my tasks →</a></div>`;
}
function reasonField(id, label = 'Reason *', placeholder = 'Explain the reason for this decision') {
  return `<div class="field"><label for="${id}">${label}</label><textarea id="${id}" name="reason" maxlength="500" required placeholder="${placeholder}" rows="2"></textarea></div>`;
}
function outcomeNote(p) {
  if (!completion || completion.id !== p.id || completion.status !== p.status) return '';
  return `<div class="completion-note" role="status"><span aria-hidden="true">✓</span>${show(completion.message)}</div>`;
}
function detail() {
  const p = parcel();
  if (!p) return `${heading('', 'Parcel unavailable', 'Your account cannot view this parcel. Return to your task list.')}<a class="btn" href="#overview">Back to my tasks</a>`;
  const events = state.events.filter(e => e.parcelId === p.id);
  const n = phase(p);
  const owner = n === 1 ? 'Registrar' : n === 2 ? (p.business?.reviewers || []).map(userName).join(', ') : n === 3 ? userName(p.senderId) : userName(p.plan?.assigneeId);
  return `<div class="journey-page"><a class="back" href="#overview">← My tasks</a><div class="receipt-heading"><div><h1>${esc(p.tracking)}</h1><p>${show(p.type)}<span>·</span>${show(p.recipient)}</p></div>${badge(p.status)}</div>
    ${stepper(p)}${outcomeNote(p)}
    <section class="panel journey-focus" aria-label="Current step">${p.status === STATUS.done ? completeTask(p) : `<div class="task-eyebrow"><span>${p.status === STATUS.exception ? 'ACTION REQUIRED / PAUSED' : `STEP ${n + 1} OF 5`}</span><span>Assigned to ${esc(owner)}</span></div>${currentTask(p)}`}</section>
    <div class="receipt-extras"><details class="extra-panel"><summary>Parcel details<span>Source, notes & edits</span></summary><div class="extra-body">${receiptInfo(p)}${p.canEdit ? editForm(p) : ''}</div></details>
    ${p.plan ? `<details class="extra-panel"><summary>Business match & assignment<span>Recommendation & approval</span></summary><div class="extra-body">${planInfo(p)}</div></details>` : ''}
    <details class="extra-panel"><summary>Activity<span>${events.length} ${events.length === 1 ? 'entry' : 'entries'} · MYT</span></summary><div class="extra-body">${history(events)}</div></details></div></div>`;
}
function taskHeading(title, text) { return `<div class="task-heading"><h2 tabindex="-1">${title}</h2><p>${text}</p></div>`; }
function currentTask(p) {
  if (p.status === STATUS.exception) return exceptionTask(p);
  const n = phase(p);
  if (n === 1) {
    if (!p.canLink) return taskHeading('Waiting for a business match', 'The registrar or a designated business reviewer must confirm this step.') + switchTask(p.business?.reviewers || state.users.filter(u => u.role === 'registrar').map(u => u.id), 'Match business');
    const found = state.businesses.filter(b => b.type === p.type && p.reference && (b.id.toLowerCase() === p.reference.toLowerCase() || b.name.toLowerCase().includes(p.reference.toLowerCase()) || english(b.name).toLowerCase().includes(english(p.reference).toLowerCase())));
    const exact = found.find(b => b.id.toLowerCase() === p.reference.toLowerCase());
    return taskHeading('Which business is this for?', p.status === STATUS.returned ? `Returned: ${show(p.exception?.reason || 'Add the missing details, then match again')}` : 'Confirm that the business ID matches the arrival details before creating an assignment.') +
      `<form data-parcel-action="link" class="focus-form">${found.length ? `<div class="match-list" aria-label="Visible business matches">${found.map(b => `<div class="match-card"><div><strong>${show(b.name)}</strong><small>${esc(b.id)} · ${show(b.model)} × ${b.quantity}</small></div><span class="badge ${exact?.id === b.id ? 'handoff' : 'review'}">${exact?.id === b.id ? 'Exact ID match' : 'Needs confirmation'}</span></div>`).join('')}</div>` : '<div class="inline-note">No visible match yet. Check the full business ID.</div>'}
      ${found.length > 1 && !exact ? '<p class="form-warning">Several projects match. Enter the exact ID.</p>' : ''}
      ${inputField('businessId', 'Full business ID *', exact?.id || '', true, 100)}<label class="check"><input name="confirmed" type="checkbox" required>The ID, parcel type and arrival details match.</label>
      <div class="step-submit"><span>Next: assignment review</span><button class="btn">Confirm match & continue →</button></div></form>`;
  }
  if (n === 2) {
    if (!p.canReview) return taskHeading('Matched. Waiting for review.', 'The assignment is ready. A designated reviewer must approve it before release.') + businessSummary(p) + `<div class="one-line-plan"><span>Recommended receiver</span><strong>${esc(userName(p.plan?.assigneeId))}</strong></div>` + switchTask(p.business?.reviewers || [], 'Review assignment');
    return taskHeading('Approve this assignment?', 'Check the recommended receiver and their permissions before approving.') + businessSummary(p) + `<div class="recommended-person"><span class="person-avatar">${esc(initials(userName(p.plan?.assigneeId)))}</span><div><span class="field-label">Recommended receiver</span><strong>${esc(userName(p.plan?.assigneeId))}</strong><p>${show(p.plan?.reason)}</p></div><span class="badge handoff">Authorized · Available</span></div>
      <form data-parcel-action="review" class="focus-form"><input type="hidden" name="decision" value="approve"><input type="hidden" name="assigneeId" value="${esc(p.plan.assigneeId)}">${reasonField('review-reason', 'Approval reason *', 'For example: Purchase order checked; approved for the authorized backup.')}<div class="step-submit"><span>After approval: sender confirms release</span><button class="btn">Approve assignment →</button></div></form>${alternateReview(p)}${exceptionOption(p)}`;
  }
  if (n === 3) {
    const canAct = canRelease(p);
    const message = p.approval ? `${esc(userName(p.approval.by))} approved ${esc(userName(p.plan.assigneeId))} to receive this parcel. ` : '';
    return taskHeading(canAct ? 'Release to the approved receiver' : 'Waiting for the sender', `${message}The sender confirms release before the receiver verifies receipt.`) + businessSummary(p) + `<div class="handoff-pair"><div><small>Sender</small><strong>${esc(userName(p.senderId))}</strong></div><span aria-hidden="true">→</span><div><small>Approved receiver</small><strong>${esc(userName(p.plan.assigneeId))}</strong></div></div>` +
      (canAct ? `<form data-parcel-action="release" class="focus-form"><label class="check"><input name="confirmed" type="checkbox" required>I have checked this parcel and handed it directly to ${esc(userName(p.plan.assigneeId))}.</label><div class="step-submit"><span>Next: ${esc(userName(p.plan.assigneeId))} to verify receipt</span><button class="btn">Confirm release →</button></div></form>${exceptionOption(p)}` : switchTask([p.senderId], 'Confirm release'));
  }
  if (!p.canReceive) return taskHeading('Released. Waiting for the receiver.', `${esc(userName(p.release.by))} confirmed release at ${fmt(p.release.at)}.`) + businessSummary(p) + switchTask([p.plan.assigneeId], 'Verify receipt');
  return taskHeading('Check the items, then confirm receipt', `Sender: ${esc(userName(p.release.by))}. Report any mismatch before continuing.`) + businessSummary(p) +
    `<form data-parcel-action="handoff" class="focus-form"><div class="receive-checklist">${[['model', 'Model matches', p.business.model], ['quantity', 'Quantity matches', `${p.business.quantity} ${p.business.quantity === 1 ? 'item' : 'items'} in total`], ['condition', 'Condition checked', 'Check condition and completeness'], ['sender', 'Handed over directly by the sender', userName(p.release.by)], ['receiver', 'I have physically received the parcel', state.user.name]].map(([key, label, hint]) => `<label class="receive-check"><input name="${key}" type="checkbox" required><span>${esc(label)}<small>${show(hint)}</small></span></label>`).join('')}</div><details class="optional-fields"><summary>Add a handoff note<span>Optional</span></summary><label class="field"><span>Handoff note</span><textarea name="note" maxlength="500" rows="2"></textarea></label></details><div class="step-submit"><span>After confirmation: save proof and result</span><button class="btn">Confirm receipt & finish ✓</button></div></form>${exceptionOption(p)}`;
}
function alternateReview(p, onlyException = false) {
  if (!p.canReview) return '';
  return `<details class="secondary-task"><summary>${onlyException ? 'Choose another action' : 'Reassign, return or hold?'}</summary><form data-parcel-action="review" class="focus-form"><div class="field"><label for="decision">Action</label><select name="decision" id="decision">${!onlyException ? '<option value="approve">Reassign to an authorized receiver</option>' : ''}<option value="hold">Hold and keep paused</option><option value="escalate">Escalate to designated authority</option><option value="return">Return for more information</option></select></div>${!onlyException ? `<div class="field alternate-assignee"><label for="assigneeId">Authorized receivers</label><select id="assigneeId" name="assigneeId">${state.users.filter(u => u.available && u.role === 'receiver' && p.business.authorized.includes(u.id)).map(u => `<option value="${u.id}" ${u.id === p.plan.assigneeId ? 'selected' : ''}>${show(u.name)}</option>`).join('')}</select></div>` : ''}${reasonField('other-review-reason')}<button class="btn secondary">Save decision</button></form></details>`;
}
function replanOption(p, expanded = false) {
  if (!canReplan(p)) return '';
  const form = `<form data-parcel-action="replan" class="focus-form">${reasonField('replan-reason', 'What has been resolved? *', 'Explain how the item, details, availability or permissions have been corrected')}<div class="step-submit"><span>A fresh review is required before handoff</span><button class="btn">Recheck & create assignment →</button></div></form>`;
  return expanded ? form : `<details class="secondary-task"><summary>Conditions resolved? Recheck</summary>${form}</details>`;
}
function exceptionTask(p) {
  const kind = p.exception?.kind;
  const held = [EXCEPTION.held, EXCEPTION.escalated].includes(kind);
  const mismatch = kind === EXCEPTION.mismatch;
  const info = `<div class="exception-focus"><span class="exception-sign" aria-hidden="true">!</span><div><strong>${show(kind || 'Action required')}</strong><p>${show(p.exception?.reason || p.plan?.reason || 'Check the situation first.')}</p></div></div>`;
  if (mismatch) return taskHeading('Resolve the issue before continuing', 'This handoff is paused. The previous approval is no longer valid.') + businessSummary(p) + info + (canReplan(p) ? replanOption(p, true) + alternateReview(p, true) : switchTask(p.business?.reviewers || [], 'Resolve issue'));
  if (held) return taskHeading(kind === EXCEPTION.held ? 'On hold until conditions are resolved' : 'Escalated to the designated authority', 'Keep this paused. Recheck and request a new review once conditions are resolved.') + info + replanOption(p) + alternateReview(p, true);
  if (!p.canReview) return taskHeading('Handoff cannot continue yet', 'A designated reviewer must choose to hold, escalate or return it.') + info + switchTask(p.business?.reviewers || [], 'Resolve issue') + replanOption(p);
  return taskHeading('No authorized receiver is available', 'Decide how to store the parcel. Permissions will not be expanded automatically.') + businessSummary(p) + info + `<form data-parcel-action="review" class="focus-form"><input type="hidden" name="decision" value="hold">${reasonField('hold-reason', 'Reason for holding *', 'Describe the storage arrangement and what must be resolved')}<div class="step-submit"><span>Keep paused until an authorized receiver is available</span><button class="btn">Confirm hold</button></div></form>` + alternateReview(p, true) + replanOption(p);
}
function exceptionOption(p) {
  if (![STATUS.review, STATUS.handoff].includes(p.status) || !(p.canReceive || p.business?.reviewers.includes(userId) || state.user.role === 'registrar')) return '';
  return `<details class="secondary-task exception-option"><summary>Item or details do not match? Pause & report</summary><form data-parcel-action="exception" class="focus-form">${reasonField('exception-reason', 'Issue details *', 'For example: Expected two monitors; only one arrived.')}<button class="btn danger">Report issue & pause</button></form></details>`;
}
function completeTask(p) {
  return `<div class="complete-heading"><span class="complete-icon" aria-hidden="true">✓</span><div><h2 tabindex="-1">Handoff complete</h2><p>Received by ${esc(userName(p.proof.receiverId))}.</p></div></div>${businessSummary(p)}<dl class="proof-summary"><div><dt>Sender</dt><dd>${esc(userName(p.proof.senderId))}</dd></div><div><dt>Receiver</dt><dd>${esc(userName(p.proof.receiverId))}</dd></div><div><dt>Completed at</dt><dd>${fmt(p.proof.at)}</dd></div></dl><div class="proof-checks">✓ Model, quantity and condition checked<br>✓ Both sender and receiver confirmed</div>${p.proof.note ? `<p class="proof-note">Note: ${show(p.proof.note)}</p>` : ''}<div class="step-submit"><span>Handoff proof saved. The linked business remains in progress.</span><a class="btn" href="#overview">Back to my tasks →</a></div>`;
}
function receiptInfo(p) {
  return `<dl class="kv"><div><dt>Source</dt><dd>${show(p.source)}</dd></div><div><dt>Recipient on label</dt><dd>${show(p.recipient)}</dd></div><div><dt>Business reference</dt><dd>${show(p.reference || 'Not provided')}</dd></div><div><dt>Preferred handling time</dt><dd>${p.deadline ? `${esc(p.deadline.replace('T', ' '))} MYT (preferred only)` : 'Not set'}</dd></div><div class="full"><dt>Notes</dt><dd>${show(p.note || 'None')}</dd></div><div><dt>Registered at</dt><dd>${fmt(p.createdAt)}</dd></div><div><dt>Internal ID / revision</dt><dd>${esc(p.id)} / ${p.revision}</dd></div></dl>`;
}
function planInfo(p) {
  return `<div class="business-card"><strong>${esc(p.business?.id)} · ${show(p.business?.name)}</strong><p>Assignment v${p.plan.version}; Business ID explicitly confirmed; parcel type matches.</p><p>${show(p.plan.reason)}</p></div><div class="people">${p.plan.people.map(u => `<div class="person-row"><div>${show(u.name)}<small>${show(u.reason)}</small></div><span class="badge ${u.available && u.authorized ? 'handoff' : 'error'}">${u.authorized ? (u.available ? 'Available · Authorized' : 'Unavailable') : 'Not authorized to receive'}</span></div>`).join('')}</div><p class="hint">This is a snapshot from assignment creation. Conditions are checked again before handoff.</p>${p.approval ? `<div class="approval-record"><strong>Approved by ${esc(userName(p.approval.by))} · v${p.approval.version}</strong><p>${show(p.approval.reason)}</p><small>${fmt(p.approval.at)}</small></div>` : ''}`;
}
function switchButtons() { return '<span class="hint">Contact your workspace administrator.</span>'; }
function editForm(p) { return `<section class="panel"><div class="panel-body"><details><summary>Edit details or add notes</summary><p class="hint">Notes alone keep the approval valid. Changing the source, recipient or business reference invalidates it and requires a new match.</p><form data-parcel-action="edit" class="stack" style="gap:12px;margin-top:14px">${inputField('source', 'Source', p.source, true, 100, true)}${inputField('recipient', 'Recipient on label', p.recipient, true, 100, true)}${inputField('reference', 'Business ID or name', p.reference, false, 100, true)}<div class="field"><label for="edit-note">Note</label><textarea id="edit-note" name="note" data-stored-value="${esc(p.note)}" maxlength="500">${show(p.note)}</textarea></div><div class="field"><label for="edit-reason">Reason for editing *</label><textarea id="edit-reason" name="reason" required maxlength="500"></textarea></div><button class="btn secondary">Save & revalidate</button></form></details></div></section>`; }
function rules() {
  const admin = state.user.role === 'admin';
  return `<div class="settings-page">${heading('WORKSPACE SETTINGS', 'Rules & permissions', show(state.company.name))}
  <details class="settings-section" open><summary>Businesses & receiving permissions<span>${state.businesses.length} visible businesses</span></summary><div class="settings-body table-scroll"><table><thead><tr><th>Business</th><th>Authorized receivers</th><th>Designated reviewers</th><th>Expected items</th></tr></thead><tbody>${state.businesses.map(b => `<tr><td><strong>${esc(b.id)}</strong><small>${show(b.name)}</small></td><td>${esc(b.authorized.map(userName).join(', ') || 'None')}</td><td>${esc(b.reviewers.map(userName).join(', '))}</td><td>${show(b.model)} × ${b.quantity}</td></tr>`).join('')}</tbody></table></div></details>
  ${admin ? `<details class="settings-section"><summary>Change receiving permissions<span>Recorded separately</span></summary><div class="settings-body"><p class="hint">Reassigning does not grant access. Update receiving permissions for non-confidential businesses separately here.</p><form id="authorization-form" class="focus-form settings-form"><div class="form-grid"><div class="field"><label for="config-business">Business</label><select id="config-business" name="businessId">${state.businesses.filter(b => b.type !== TYPE.confidential).map(b => `<option value="${b.id}">${esc(b.id)} / ${show(b.name)}</option>`).join('')}</select></div><div class="field"><label for="config-user">Receiver</label><select id="config-user" name="userId">${state.users.filter(u => u.role === 'receiver').map(u => `<option value="${u.id}" ${u.id === 'nina' ? 'selected' : ''}>${show(u.name)}</option>`).join('')}</select></div><div class="field full"><label for="config-authorized">Change to</label><select id="config-authorized" name="authorized"><option value="false">Revoke receiving permission</option><option value="true">Grant receiving permission</option></select></div></div>${reasonField('auth-reason', 'Reason for permission change *')}<button class="btn">Save permission change</button></form></div></details>` : `<div class="settings-access"><p>A designated administrator manages configuration changes.</p>${switchButtons([companyId === 'orion' ? 'admin' : 'ops'])}</div>`}
  ${admin ? `<details class="settings-section"><summary>Registration & review access<span>Assign business access to new members</span></summary><div class="settings-body"><form id="business-access-form" class="focus-form"><div class="field"><label for="access-business">Business</label><select id="access-business" name="businessId">${state.businesses.filter(b => b.type !== TYPE.confidential).map(b => `<option value="${b.id}">${esc(b.id)} / ${show(b.name)}</option>`).join('')}</select></div><div class="field"><label for="access-user">Member</label><select id="access-user" name="userId">${state.users.filter(u => ['registrar', 'reviewer'].includes(u.role)).map(u => `<option value="${u.id}">${show(u.name)} / ${roleNames[u.role]}</option>`).join('')}</select></div><div class="field"><label for="access-kind">Access</label><select id="access-kind" name="access"><option value="read">View and link to business</option><option value="review">Review assignments (reviewers only)</option></select></div><div class="field"><label for="access-granted">Change to</label><select id="access-granted" name="granted"><option value="true">Grant access</option><option value="false">Revoke access</option></select></div>${reasonField('access-reason', 'Reason for access change *')}<button class="btn">Save business access</button></form></div></details>` : ''}
  <details class="settings-section"><summary>Team availability<span>${state.users.length} synthetic team members</span></summary><div class="settings-body"><div class="people">${state.users.map(u => `<div class="person-row"><div>${show(u.name)}<small>${roleNames[u.role]}</small></div><span class="badge ${u.available ? 'handoff' : 'error'}">${u.available ? 'Available' : 'Unavailable'}</span></div>`).join('')}</div>
    ${admin ? `<details class="secondary-task"><summary>Update availability</summary><form id="availability-form" class="focus-form"><div class="form-grid"><div class="field"><label for="availability-user">Person</label><select id="availability-user" name="userId">${state.users.map(u => `<option value="${u.id}">${show(u.name)} / ${u.available ? 'Available' : 'Unavailable'}</option>`).join('')}</select></div><div class="field"><label for="availability-value">Change to</label><select id="availability-value" name="available"><option value="false">Unavailable</option><option value="true">Available</option></select></div></div>${reasonField('availability-reason', 'Reason for availability change *')}<button class="btn secondary">Save availability</button></form></details>` : ''}</div></details>
  <details class="settings-section"><summary>Handoff rules<span>Completion requirements & limits</span></summary><div class="settings-body">${[
    ['Exact business match', 'Confirm the business ID and type before creating an assignment. Similar names cannot determine a match.'],
    ['Explicit approval', 'All assignments require approval from a designated reviewer. Reassignment is limited to available, authorized receivers.'],
    ['Confirmation by both parties', 'The sender confirms release first. The approved receiver checks model, quantity, condition and physical receipt.'],
    ['Recheck before handoff', 'Changes to key details, permissions or relevant availability invalidate approval. Unrelated notes do not.'],
    ['Pause when no authorized path exists', 'Without an authorized receiver, confidential parcels must be held, escalated or returned. An escalation request is not approval.'],
  ].map(([title, desc]) => `<div class="rule-item"><strong>${title}</strong><p>${desc}</p></div>`).join('')}</div></details>
  ${admin ? `<details class="settings-section"><summary>Configuration history<span>${state.events.filter(e => !e.parcelId).length} ${state.events.filter(e => !e.parcelId).length === 1 ? 'entry' : 'entries'}</span></summary><div class="settings-body">${history(state.events.filter(e => !e.parcelId))}</div></details>` : ''}</div>`;
}
function guide() {
  return `<div class="guide-page">${heading('DEMO GUIDE', 'Start with one parcel.', 'Complete a normal handoff first, then explore exception scenarios.')}
  <details class="settings-section" open><summary>A / Complete an equipment handoff<span>Standard flow</span></summary><div class="settings-body"><ol class="acceptance-steps">
  <li><span>1</span><div><strong>Registrar matches the business</strong><p>Sign in as Lin Yue, open an equipment parcel and confirm <code>PO-2026-001</code>. Nina Li should be recommended as the available, authorized backup.</p></div></li>
  <li><span>2</span><div><strong>Reviewer approves</strong><p>Sign in as Mei Chen, enter a reason and approve the assignment.</p></div></li>
  <li><span>3</span><div><strong>Sender confirms release</strong><p>Sign in as Lin Yue, check the parcel and confirm direct handover.</p></div></li>
  <li><span>4</span><div><strong>Receiver checks and accepts</strong><p>Sign in as Nina Li. Check two M27 monitors, their condition and physical receipt, then save the handoff.</p></div></li>
  </ol><div class="acceptance-result">Expect a completed handoff with both names and a timestamp. It persists after refresh; the linked business remains in progress.</div><a class="btn" href="#overview">Open my tasks →</a><p class="hint guide-hint">Completed parcels cannot be collected again. Use case A on the registration page to create another parcel with a unique ID.</p></div></details>
  <details class="settings-section"><summary>B / Confidential parcel without a receiver<span>Permissions & holding</span></summary><div class="settings-body"><ol class="guide-list"><li>Sign in as Chen Zhou, open the confidential parcel and confirm <code>CT-2026-001</code>. </li><li>Wen Lan and Hao He are unavailable. Other staff cannot be assigned.</li><li>Enter a reason to hold, or expand the other actions to escalate or return. The flow stays paused.</li><li>Restricted parcel metadata must not appear in the lists for Lin Yue, Mei Chen or Nina Li.</li></ol></div></details>
  <details class="settings-section"><summary>C / Similar businesses require confirmation<span>Ambiguous business match</span></summary><div class="settings-body"><p>Sign in as Lin Yue and open the Dawn client parcel. Both branding and website projects appear. Enter the full ID <code>CLIENT-101</code> or <code>CLIENT-102</code> and explicitly confirm to continue.</p></div></details>
  <details class="settings-section"><summary>D / Revoke permission after approval<span>Block before handoff</span></summary><div class="settings-body"><ol class="guide-list"><li>Create case D, match the business, approve and confirm release. Do not receive it yet.</li><li>Sign in as Cen Xu. In Rules & permissions, open Change receiving permissions, revoke PO-2026-001 / Nina Li and record a reason.</li><li>Sign in as Nina Li and attempt receipt. It must be blocked; the old approval expires and a reason is logged.</li><li>Restoring permission still requires a fresh assignment, review and release confirmation. Restore receiving permission for Nina Li after testing for future demos.</li></ol></div></details>
  <details class="settings-section"><summary>E / Pause on an item mismatch<span>Issues & missing checks</span></summary><div class="settings-body"><p>Create and approve case E. Open the mismatch report and enter: Expected two monitors; only one arrived. The handoff pauses and the old approval clears. Record the correction and review again. Missing any required check must prevent completion.</p></div></details>
  <details class="settings-section"><summary>Demo scope & data<span>Included & not connected</span></summary><div class="settings-body"><ul class="guide-list"><li>People, companies and businesses are synthetic. Password sign-in and server sessions are enabled; all business data remains synthetic.</li><li>Records are stored in local SQLite. The device owner can edit logs; they are not tamper-proof.</li><li>Orbyte data follows team-defined interface assumptions. Real Orbyte, AI, WhatsApp and external notifications are not connected.</li><li>An internal handoff does not mean a contract is reviewed or the downstream business is complete.</li><li>No real interviews, controlled user studies or business impact measurements have been completed. Online operation on Replit is not yet verified.</li></ul><button class="btn secondary small" data-action="export">Export my visible records</button></div></details>
  <details class="settings-section"><summary>Record your observations<span>Usability & business validation</span></summary><div class="settings-body"><p>Record participant background, scenario, completion time, requests for help and reasons for failure. Compare against chat and spreadsheets using equally difficult scenarios in alternating order. Passing automated tests does not validate market demand or business benefit. A raw observation template is in the repository docs folder.</p></div></details></div>`;
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
    if (target.dataset.action === 'refresh') { await refresh(); toast('Records refreshed.'); }
    if (target.dataset.action === 'export') {
      const result = await api('/api/export');
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `parcelrelay-${companyId}-${userId}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); toast('Your visible records have been exported.');
    }
  } catch (error) { toast(error.message, true); }
});
app.addEventListener('submit', async e => {
  e.preventDefault();
  if (busy) return;
  const form = e.target;
  const values = Object.fromEntries(new FormData(form));
  for (const field of form.querySelectorAll('[data-stored-value]')) {
    if (field.value === english(field.dataset.storedValue)) values[field.name] = field.dataset.storedValue;
  }
  if (['login-form', 'password-form'].includes(form.id)) {
    busy = true; const button = form.querySelector('button'); button.disabled = true;
    form.querySelector('.form-error')?.remove();
    try {
      if (form.id === 'login-form') {
        const result = await api('/api/auth/login', values); authGeneration++; state = result; companyId = state.company.id; userId = state.user.id;
        filter = 'To do'; completion = null; search = ''; location.hash = 'overview'; render(true); window.scrollTo(0, 0);
      } else { const result = await api('/api/auth/password', values); form.reset(); toast(result.message); }
    } catch (error) { const hint = document.createElement('p'); hint.className = 'form-error'; hint.setAttribute('role', 'alert'); hint.textContent = error.message; form.prepend(hint); button.disabled = false; }
    finally { busy = false; if (button.isConnected) button.disabled = false; }
    return;
  }
  let path, data, message, actedId, action;
  if (form.id === 'account-create-form') { path = '/api/accounts'; data = { username: values['member-username'], name: values['member-name'], role: values.role, password: values.password }; message = 'Team account created. Configure business permissions separately.'; }
  else if (form.id === 'intake-form') { path = '/api/parcels'; data = values; message = 'Parcel registered.'; }
  else if (form.id === 'business-access-form') { path = '/api/config'; data = { ...values, kind: 'business-access', granted: values.granted === 'true' }; message = 'Business access updated and recorded.'; }
  else if (form.id === 'authorization-form' || form.id === 'availability-form') {
    path = '/api/config'; data = { ...values, kind: form.id === 'authorization-form' ? 'authorization' : 'availability', authorized: values.authorized === 'true', available: values.available === 'true' }; message = 'Configuration saved. Existing approvals will be rechecked before handoff.';
  } else if (form.dataset.parcelAction) {
    const p = parcel(); action = form.dataset.parcelAction; actedId = p.id;
    path = `/api/parcels/${p.id}/${action}`;
    data = { ...values, etag: p.etag || 0, version: p.plan?.version, confirmed: values.confirmed === 'on' };
    if (action === 'handoff') data.checks = Object.fromEntries(['model', 'quantity', 'condition', 'sender', 'receiver'].map(key => [key, values[key] === 'on']));
    message = ({ link: 'Business matched and assignment created.', review: 'Review decision saved.', release: 'Release confirmed. The receiver can now verify receipt.', handoff: 'Handoff complete. Proof and activity saved.', exception: 'Issue recorded. Handoff paused.', replan: 'A new assignment reflects current conditions and needs review.', edit: 'Details saved and key changes revalidated.' })[action];
  } else return;
  busy = true;
  form.querySelectorAll('button').forEach(b => { b.disabled = true; });
  try {
    const result = await api(path, data); state = result;
    if (actedId) { const updated = state.parcels.find(p => p.id === actedId); if (updated) completion = { id: actedId, status: updated.status, message: ({ link: 'Business matched. Assignment ready.', review: updated.status === STATUS.handoff ? 'Assignment approved. The sender confirms release next.' : 'Decision saved.', release: 'Release confirmed. The receiver verifies receipt next.', handoff: 'All steps complete. Handoff proof saved.', exception: 'Issue recorded. Handoff paused.', replan: 'New assignment created. A fresh review is required.', edit: 'Changes saved.' })[action] }; }
    if (result.created) {
      message = result.created.message;
      if (result.created.visible) { const created = state.parcels.find(p => p.id === result.created.id); completion = { id: created.id, status: created.status, message: 'Arrival registered. Match the business next.' }; go(`parcel/${result.created.id}`); } else go('overview');
    }
    render(true); window.scrollTo(0, 0); document.querySelector('.task-heading h2, .complete-heading h2')?.focus({ preventScroll: true }); if (!actedId && !result.created?.visible) toast(message);
  } catch (error) {
    if (error.data?.parcels) { state = error.data; completion = null; render(); window.scrollTo(0, 0); document.querySelector('.task-heading h2')?.focus({ preventScroll: true }); }
    else if (error.data?.error && /已被更新|已过期|版本已变化/.test(error.data.error)) { await refresh(); }
    else { form.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
    const inline = document.createElement('p'); inline.className = 'form-error'; inline.setAttribute('role', 'alert'); inline.textContent = error.message;
    form.querySelector('.form-error')?.remove();
    if (form.isConnected) { form.prepend(inline); inline.scrollIntoView({ block: 'nearest' }); }
    if (!form.isConnected) toast(error.message, true);
  } finally { busy = false; }
});
window.addEventListener('hashchange', () => {
  if (route() === 'records') filter = 'Following';
  else if (route() === 'overview') filter = 'To do';
  render(true); window.scrollTo(0, 0);
});
async function backgroundRefresh() {
  if (!state || busy || document.visibilityState !== 'visible' || !['overview', 'records'].includes(route()) || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  try { await refresh(); } catch { /* Expired sessions return to sign-in; keep the current view on temporary network errors. */ }
}
setInterval(backgroundRefresh, 15000);
window.addEventListener('focus', backgroundRefresh);
document.addEventListener('visibilitychange', backgroundRefresh);
async function start() {
  try {
    if (route() === 'records') filter = 'Following';
    const result = await fetch('/api/demo-accounts'); demoAccounts = (await result.json()).accounts || [];
    await refresh();
    if (route() === 'login') go('overview');
  } catch (error) {
    if (error.status === 401) renderLogin();
    else { state = null; renderLogin('Unable to connect. Make sure the service is running, then try again.'); }
  }
}
start();
