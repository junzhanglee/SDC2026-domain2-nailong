import { randomUUID, createHash } from 'node:crypto';

export class Problem extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (status, message) => { throw new Problem(status, message); };
export const id = prefix => `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
const person = (key, name, role, available = true) => ({ id: key, name, role, available, revision: 1 });
const business = (key, name, type, ownerId, backups, readers, reviewers, model, quantity = 1) => ({
  id: key, name, type, ownerId, authorized: [ownerId, ...backups], readers, reviewers,
  model, quantity, revision: 1, downstreamStatus: '进行中',
});
export function seed() {
  return { schema: 2, companies: [
    { id: 'orion', name: '星桥设计工作室', description: '采购与文件交接 · 合成企业', rule: '所有分派需明确审核；禁止自己批准自己的登记；型号、数量、状况与双方确认缺一不可。', users: [
      person('lin', '林悦', 'registrar'), person('mei', '陈美', 'reviewer'), person('alan', '黄安', 'receiver', false),
      person('nina', '李宁', 'receiver'), person('wen', '温岚', 'receiver', false), person('hao', '何皓', 'receiver', false),
      person('chen', '周晨', 'reviewer'), person('admin', '许岑', 'admin'),
    ], businesses: [
      business('PO-2026-001', '设计设备采购', '采购物资', 'alan', ['nina'], ['lin', 'mei', 'alan', 'nina', 'admin'], ['mei'], '显示器 M27', 2),
      business('SUP-2026-001', '员工工作用品', '工作用品', 'nina', [], ['lin', 'mei', 'nina', 'admin'], ['mei'], '办公套装', 1),
      business('CT-2026-001', '保密合作合同', '保密文件', 'wen', ['hao'], ['wen', 'hao', 'chen'], ['chen'], '密封文件袋', 1),
      business('CLIENT-101', '晨光客户 · 品牌项目', '客户资料', 'alan', ['nina'], ['lin', 'mei', 'alan', 'nina', 'admin'], ['mei'], '资料袋', 1),
      business('CLIENT-102', '晨光客户 · 网站项目', '客户资料', 'nina', [], ['lin', 'mei', 'alan', 'nina', 'admin'], ['mei'], '资料袋', 1),
    ] },
    { id: 'cedar', name: '青杉会计事务所', description: '相同流程 · 不同企业配置', rule: '所有分派需明确审核；禁止自审；接收资料不表示已审阅内容。', users: [
      person('ivy', '叶青', 'registrar'), person('sam', '沈思', 'reviewer'), person('jo', '乔文', 'receiver'), person('lee', '黎禾', 'receiver'), person('ops', '方竹', 'admin'),
    ], businesses: [business('AC-2026-001', '青禾客户季度资料', '客户资料', 'jo', ['lee'], ['ivy', 'sam', 'jo', 'lee', 'ops'], ['sam'], '季度资料袋', 1)] },
  ], parcels: [], events: [] };
}
export function context(state, companyId, userId) {
  const company = state.companies.find(c => c.id === companyId);
  if (!company) fail(401, '请先登录自己的企业账号');
  const user = company.users.find(u => u.id === userId);
  if (!user) fail(401, '该身份不属于当前企业');
  return { company, user };
}
export function visible(ctx, p) {
  if (p.companyId !== ctx.company.id) return false;
  const b = ctx.company.businesses.find(b => b.id === p.businessId);
  if (p.type === '保密文件' || b?.type === '保密文件') return !!b?.readers.includes(ctx.user.id)
    && (b.reviewers.includes(ctx.user.id) || p.plan?.assigneeId === ctx.user.id || p.proof?.receiverId === ctx.user.id);
  if (!b) return p.creatorId === ctx.user.id;
  if (!b.readers.includes(ctx.user.id)) return false;
  return p.creatorId === ctx.user.id || b.reviewers.includes(ctx.user.id)
    || p.plan?.assigneeId === ctx.user.id || p.proof?.receiverId === ctx.user.id || p.release?.by === ctx.user.id || p.participantIds?.includes(ctx.user.id);
}
function senderFor(ctx, p) {
  const b = ctx.company.businesses.find(b => b.id === p.businessId);
  return [p.creatorId, ...(b?.reviewers || [])].find(uid => b?.readers.includes(uid)
    && ctx.company.users.some(u => u.id === uid && u.available && ['registrar', 'reviewer'].includes(u.role)));
}
export function taskFor(ctx, p) {
  if (!ctx.user.available || !visible(ctx, p)) return null;
  const b = ctx.company.businesses.find(b => b.id === p.businessId), uid = ctx.user.id;
  if (['待核对', '退回'].includes(p.status) && (p.creatorId === uid || (p.type === '保密文件' && b?.reviewers.includes(uid)))) return { kind: 'link', label: '核对业务', ownerId: uid };
  if (['待审核', '异常'].includes(p.status) && b?.reviewers.includes(uid) && p.plan) return { kind: p.status === '异常' ? 'exception' : 'review', label: p.status === '异常' ? '处理异常' : '审核分派', ownerId: uid };
  if (p.status === '待交接' && !p.release && (p.senderId || senderFor(ctx, p)) === uid) return { kind: 'release', label: '确认交出', ownerId: uid };
  if (p.status === '待交接' && p.release && p.plan?.assigneeId === uid) return { kind: 'handoff', label: '核对接收', ownerId: uid };
  return null;
}
export function parcelFor(state, ctx, parcelId) {
  const p = state.parcels.find(p => p.id === parcelId && visible(ctx, p));
  if (!p) fail(404, '收件不存在或当前身份无权查看');
  return p;
}
const text = (value, name, max = 200, required = true) => {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(400, `请填写有效的${name}（最多 ${max} 字）`);
  return value.trim();
};
const requireRole = (ctx, role) => { if (ctx.user.role !== role) fail(403, '当前账号没有执行此操作的权限'); };
const getBusiness = (ctx, p) => ctx.company.businesses.find(b => b.id === p.businessId);
export function event(state, ctx, p, action, before, reason, result = '成功') {
  state.events.push({ id: id('EV'), companyId: ctx.company.id, parcelId: p?.id || null, businessId: p?.businessId || null,
    actorId: ctx.user.id, actorName: ctx.user.name, role: ctx.user.role, at: new Date().toISOString(), action,
    before, after: p?.status || before, reason, planVersion: p?.plan?.version || null, result });
}
function eligible(ctx, b, userId) {
  const user = ctx.company.users.find(u => u.id === userId);
  return !!user && user.role === 'receiver' && user.available && b.authorized.includes(userId);
}
export function candidates(ctx, query, type) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return ctx.company.businesses.filter(b => b.readers.includes(ctx.user.id) && (!type || b.type === type)
    && (b.id.toLowerCase() === q || b.name.toLowerCase().includes(q))).map(b => ({
      id: b.id, name: b.name, type: b.type, exact: b.id.toLowerCase() === q,
      basis: b.id.toLowerCase() === q ? '业务编号完全一致；请确认登记信息' : '名称包含输入文字；必须补充准确业务编号',
    }));
}
function fingerprint(ctx, p) {
  const b = getBusiness(ctx, p);
  return createHash('sha256').update(JSON.stringify({ revision: p.revision, business: b?.id, businessRevision: b?.revision,
    people: b?.authorized.map(uid => { const u = ctx.company.users.find(u => u.id === uid); return [uid, u?.available, u?.revision]; }),
  })).digest('hex');
}
function makePlan(state, ctx, p, action = '生成分派方案') {
  const b = getBusiness(ctx, p);
  const before = p.status;
  const assignee = [b.ownerId, ...b.authorized.filter(uid => uid !== b.ownerId)].find(uid => eligible(ctx, b, uid));
  const explain = uid => {
    const user = ctx.company.users.find(u => u.id === uid);
    return { id: uid, name: user?.name || uid, available: !!user?.available, authorized: b.authorized.includes(uid), reason: !b.authorized.includes(uid) ? '未获当前业务接收授权，不能交接' : !user?.available ? '不在岗，不能交接' : '在岗且列入业务授权名单' };
  };
  p.plan = { version: (p.plan?.version || 0) + 1, assigneeId: assignee || null, fingerprint: fingerprint(ctx, p),
    reason: assignee ? (assignee === b.ownerId ? '原负责人在岗且已获授权。' : '原负责人不在岗；推荐在岗的授权备用人。') : '没有在岗且获授权的接收人；必须暂存或升级处理，不扩大权限。',
    people: [...new Set([b.ownerId, ...b.authorized])].map(explain),
    checks: ['型号一致', '数量一致', '状况无异常', '交出方确认', '接收方确认'],
  };
  p.approval = null; p.release = null; p.senderId = null;
  p.status = assignee ? '待审核' : '异常';
  p.exception = assignee ? null : { kind: '无授权接收人', reason: p.plan.reason, next: '等待授权审核人决定暂存或升级处理' };
  event(state, ctx, p, action, before, p.plan.reason);
}
export function createParcel(state, ctx, input) {
  requireRole(ctx, 'registrar');
  const tracking = text(input.tracking, '收件编号', 60);
  if (state.parcels.some(p => p.companyId === ctx.company.id && p.tracking.toLowerCase() === tracking.toLowerCase())) fail(409, '该企业的收件编号已存在，请勿重复登记');
  const type = text(input.type, '收件类型', 20);
  if (!['采购物资', '保密文件', '客户资料', '工作用品'].includes(type)) fail(400, '收件类型无效');
  const reference = text(input.reference || '', '业务编号或名称', 100, false);
  const deadline = text(input.deadline || '', '期望处理时间', 30, false);
  if (deadline && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(deadline) || Number.isNaN(Date.parse(`${deadline}+08:00`)))) fail(400, '期望处理时间格式无效');
  const p = { id: id('PR'), companyId: ctx.company.id, tracking, source: text(input.source, '来源', 100),
    recipient: text(input.recipient, '外包装收件人', 100), type, reference, businessId: null, deadline,
    note: text(input.note || '', '备注', 500, false), status: '待核对', revision: 1, creatorId: ctx.user.id,
    createdAt: new Date().toISOString(), plan: null, approval: null, exception: null, proof: null };
  // 保密登记只接受明确编号，不向登记员暴露受限业务名称或候选。
  if (type === '保密文件') {
    const b = ctx.company.businesses.find(b => b.id.toLowerCase() === reference.toLowerCase() && b.type === type);
    if (!b) fail(400, '保密件须填写有效的完整业务编号；请向指定授权审核人确认');
    p.businessId = b.id;
  }
  state.parcels.push(p);
  event(state, ctx, p, '登记到件', '待登记', '用户确认合成登记信息');
  return { id: p.id, visible: visible(ctx, p), message: visible(ctx, p) ? '登记成功，下一步核对业务归属。' : '保密件登记成功，已交给指定授权审核人；当前身份无法查看其详情。' };
}
export function linkParcel(state, ctx, p, input) {
  const b = ctx.company.businesses.find(b => b.id === input.businessId && b.readers.includes(ctx.user.id));
  if (!(ctx.user.role === 'registrar' && p.creatorId === ctx.user.id) && !(p.type === '保密文件' && b?.reviewers.includes(ctx.user.id))) fail(403, '只有登记员或该业务授权审核人可以核对归属');
  if (!['待核对', '退回'].includes(p.status)) fail(409, '当前阶段不能直接关联；如需修改关键资料，请先退回或编辑');
  if (!b || b.type !== p.type) fail(400, '请选择类型一致、当前身份有权查看的准确业务编号');
  if (input.confirmed !== true) fail(400, '请先明确确认业务编号与到件信息一致');
  p.businessId = b.id;
  p.reference = b.id;
  p.revision++;
  makePlan(state, ctx, p, '核对业务并生成方案');
}
export function reviewParcel(state, ctx, p, input) {
  const b = getBusiness(ctx, p);
  if (!b?.reviewers.includes(ctx.user.id) || ctx.user.role !== 'reviewer') fail(403, '当前身份不在该业务的授权审核名单');
  if (p.creatorId === ctx.user.id) fail(403, '企业规则禁止自己批准自己的登记');
  if (!ctx.user.available) fail(409, '当前审核人不在岗');
  if (!p.plan || !['待审核', '异常'].includes(p.status)) fail(409, '当前收件没有可审核的方案');
  const reason = text(input.reason, '审核理由', 500);
  if (input.version !== p.plan.version) fail(409, '方案版本已变化，请刷新后重新审核');
  const before = p.status;
  if (['hold', 'escalate', 'return'].includes(input.decision)) {
    p.approval = null; p.release = null; p.senderId = null;
    p.status = input.decision === 'return' ? '退回' : '异常';
    p.exception = { kind: input.decision === 'hold' ? '已批准暂存' : input.decision === 'escalate' ? '等待指定授权人介入' : '审核退回', reason,
      next: input.decision === 'return' ? '登记员补充资料并重新核对' : '保持暂停；指定负责人确认条件变化后重新生成方案' };
    event(state, ctx, p, input.decision === 'return' ? '退回方案' : input.decision === 'hold' ? '决定暂存' : '升级处理', before, reason);
    return;
  }
  if (input.decision !== 'approve') fail(400, '审核操作无效');
  if (p.exception?.kind === '实物或资料不符') fail(409, '实物或资料异常尚未处理，请记录修正情况并重新生成方案后再审核');
  if (p.plan.fingerprint !== fingerprint(ctx, p)) {
    makePlan(state, ctx, p, '审核时发现条件变化');
    event(state, ctx, p, '拦截旧方案审核', before, '人员、授权或关键资料已变化；请重新审核新方案', '拦截');
    return { blocked: true, message: '条件已变化，已生成新方案，请重新审核。' };
  }
  const assigneeId = text(input.assigneeId || p.plan.assigneeId || '', '接收人', 50);
  if (!eligible(ctx, b, assigneeId)) fail(409, '接收人必须在岗且已有业务授权；改派不能增加权限');
  if (assigneeId !== p.plan.assigneeId) {
    p.plan = { ...p.plan, version: p.plan.version + 1, assigneeId, reason: `审核人改派：${reason}` };
  }
  p.release = null; p.senderId = senderFor(ctx, p);
  if (!p.senderId) fail(409, '暂无可用交出方，请先处理人员可用性');
  p.participantIds = [...new Set([...(p.participantIds || []), p.creatorId, assigneeId, p.senderId, ctx.user.id])];
  p.approval = { by: ctx.user.id, at: new Date().toISOString(), version: p.plan.version, fingerprint: fingerprint(ctx, p), reason };
  p.status = '待交接'; p.exception = null;
  event(state, ctx, p, '批准分派', before, reason);
}
export function replan(state, ctx, p, input) {
  const b = getBusiness(ctx, p);
  if (!((ctx.user.role === 'registrar' && p.creatorId === ctx.user.id) || b?.reviewers.includes(ctx.user.id))) fail(403, '当前身份不能重新生成方案');
  if (!b || !['异常', '待审核'].includes(p.status)) fail(409, '请先核对业务，或等待当前流程完成');
  text(input.reason, '重新规划理由', 500);
  makePlan(state, ctx, p, `重新生成方案：${input.reason.trim()}`);
}
export function releaseParcel(state, ctx, p, input) {
  const b = getBusiness(ctx, p);
  if (!['registrar', 'reviewer'].includes(ctx.user.role) || !ctx.user.available || !b?.readers.includes(ctx.user.id)) fail(403, '仅在岗且有权处理本件的登记员或审核人可以确认交出');
  if (p.status !== '待交接' || !p.approval) fail(409, '请先完成有效的分派审核');
  if (p.release) fail(409, '交出方已确认，请勿重复操作');
  if ((p.senderId || senderFor(ctx, p)) !== ctx.user.id) fail(403, '这项交出任务属于其他同事，请由指定交出方登录确认');
  if (p.approval.fingerprint !== fingerprint(ctx, p)) {
    const before = p.status;
    makePlan(state, ctx, p, '交出前复核：批准失效');
    event(state, ctx, p, '交出被拦截', before, '关键条件变化，旧批准失效', '拦截');
    return { blocked: true, message: '交出前复核未通过，请重新审核。' };
  }
  if (input.confirmed !== true || input.version !== p.plan.version) fail(400, '请确认实际交出核对并使用当前方案');
  p.release = { by: ctx.user.id, at: new Date().toISOString(), version: p.plan.version, fingerprint: p.approval.fingerprint, personRevision: ctx.user.revision };
  event(state, ctx, p, '交出方确认', p.status, '交出方以自己的账号确认已核对并当面交出；等待接收方确认。');
}
export function handoff(state, ctx, p, input) {
  const b = getBusiness(ctx, p);
  if (p.status === '已交接') fail(409, '收件已交接，不能重复领取');
  if (!p.approval || p.status !== '待交接') fail(409, '必须先取得有效的人工批准');
  if (ctx.user.id !== p.plan.assigneeId) fail(403, '只有方案中获批准的接收人可以确认交接');
  if (p.approval.fingerprint !== fingerprint(ctx, p) || !eligible(ctx, b, ctx.user.id)
    || !b.reviewers.includes(p.approval.by) || p.approval.version !== p.plan.version) {
    const before = p.status;
    makePlan(state, ctx, p, '执行前复核：批准失效');
    event(state, ctx, p, '交接被拦截', before, '授权、人员状态或关键资料已变化，旧批准失效', '拦截');
    return { blocked: true, message: '执行前复核未通过：旧批准已失效，请重新审核。' };
  }
  if (input.version !== p.plan.version) fail(409, '页面方案已过期，请刷新');
  const checks = input.checks;
  if (!checks || ['model', 'quantity', 'condition', 'sender', 'receiver'].some(key => checks[key] !== true)) fail(400, '型号、数量、状况与双方确认全部完成后才能交接；实物不符请报告异常');
  if (!p.release || p.release.version !== p.plan.version || p.release.fingerprint !== p.approval.fingerprint) fail(409, '请先由交出方以自己的账号确认交出');
  const senderId = p.release.by;
  const sender = ctx.company.users.find(u => u.id === senderId && ['registrar', 'reviewer'].includes(u.role) && u.available);
  if (!sender || !b.readers.includes(senderId) || sender.revision !== p.release.personRevision) {
    const before = p.status;
    makePlan(state, ctx, p, '执行前复核：交出方条件变化');
    event(state, ctx, p, '交接被拦截', before, '交出方状态或处理权限已变化，必须重新审核并确认交出', '拦截');
    return { blocked: true, message: '交出方条件已变化，旧批准失效；请重新审核并确认交出。' };
  }
  const before = p.status;
  p.status = '已交接';
  p.proof = { at: new Date().toISOString(), senderId, receiverId: ctx.user.id, checks,
    model: b.model, quantity: b.quantity, note: text(input.note || '', '交接备注', 500, false), version: p.plan.version };
  event(state, ctx, p, '确认内部交接', before, '必要核对项齐全；执行前复核通过。关联业务仍为进行中。');
}
export function reportException(state, ctx, p, input) {
  if (!['待交接', '待审核'].includes(p.status)) fail(409, '当前阶段不能报告交接异常');
  if (!(ctx.user.id === p.plan?.assigneeId || getBusiness(ctx, p)?.reviewers.includes(ctx.user.id) || (ctx.user.role === 'registrar' && p.creatorId === ctx.user.id))) fail(403, '当前身份不能报告此异常');
  const reason = text(input.reason, '异常原因', 500);
  const before = p.status;
  p.status = '异常'; p.approval = null; p.release = null; p.senderId = null;
  p.exception = { kind: '实物或资料不符', reason, next: '业务负责人处理；修正后重新生成方案并审核' };
  event(state, ctx, p, '报告异常并暂停交接', before, reason);
}
export function editParcel(state, ctx, p, input) {
  const b = getBusiness(ctx, p);
  if (!((ctx.user.role === 'registrar' && p.creatorId === ctx.user.id) || b?.reviewers.includes(ctx.user.id))) fail(403, '当前身份不能编辑收件');
  if (p.status === '已交接') fail(409, '已交接记录不能修改');
  const reason = text(input.reason, '修改理由', 500);
  const note = text(input.note ?? p.note, '备注', 500, false);
  const recipient = text(input.recipient ?? p.recipient, '外包装收件人', 100);
  const source = text(input.source ?? p.source, '来源', 100);
  const reference = text(input.reference ?? p.reference, '业务编号或名称', 100, false);
  const before = p.status;
  const critical = recipient !== p.recipient || source !== p.source || reference !== p.reference;
  if (critical && p.type === '保密文件') fail(400, '保密件关键资料修改须退回并重新登记；此 MVP 仅允许修改其无关备注');
  Object.assign(p, { note, recipient, source, reference });
  if (critical) {
    p.revision++; p.approval = null; p.release = null; p.senderId = null; p.businessId = null; p.status = '待核对';
    p.exception = { kind: '关键资料已变化', reason, next: '重新核对业务归属并审核' };
  }
  event(state, ctx, p, critical ? '修改关键资料，批准失效' : '补充备注，保留有效批准', before, reason);
}
export function configure(state, ctx, input) {
  requireRole(ctx, 'admin');
  const reason = text(input.reason, '配置变更理由', 500);
  if (input.kind === 'business-access') {
    const b = ctx.company.businesses.find(b => b.id === input.businessId && b.type !== '保密文件');
    const u = ctx.company.users.find(u => u.id === input.userId);
    if (!b || !u || !['read', 'review'].includes(input.access) || typeof input.granted !== 'boolean') fail(400, '业务、成员或权限类型无效');
    if (input.access === 'review' && u.role !== 'reviewer') fail(400, '审核权限只能配置给审核岗位成员');
    const list = input.access === 'review' ? b.reviewers : b.readers;
    if (list.includes(u.id) === input.granted) fail(409, '权限未发生变化');
    if (input.access === 'review') {
      b.reviewers = input.granted ? [...b.reviewers, u.id] : b.reviewers.filter(uid => uid !== u.id);
      if (input.granted && !b.readers.includes(u.id)) b.readers.push(u.id);
      b.revision++;
    } else b.readers = input.granted ? [...b.readers, u.id] : b.readers.filter(uid => uid !== u.id);
    event(state, ctx, null, '业务处理权限独立变更', '配置', `${b.id} / ${u.name} / ${input.access === 'review' ? '授权审核' : '业务查看与登记关联'} → ${input.granted ? '生效' : '撤销'}；${reason}`);
  } else if (input.kind === 'availability') {
    const u = ctx.company.users.find(u => u.id === input.userId);
    if (!u || typeof input.available !== 'boolean') fail(400, '人员或在岗状态无效');
    if (u.available === input.available) fail(409, '人员状态未发生变化');
    u.available = input.available; u.revision++;
    event(state, ctx, null, '人员状态变更', '配置', `${u.name} → ${u.available ? '在岗' : '不在岗'}；${reason}`);
  } else if (input.kind === 'authorization') {
    const b = ctx.company.businesses.find(b => b.id === input.businessId && b.type !== '保密文件');
    const u = ctx.company.users.find(u => u.id === input.userId && u.role === 'receiver');
    if (!b || !u || typeof input.authorized !== 'boolean') fail(400, '当前配置负责人只能管理公开业务的接收授权；保密授权由指定负责人线下确认');
    const wasAuthorized = b.authorized.includes(u.id);
    if (wasAuthorized === input.authorized) fail(409, '授权状态未发生变化');
    b.authorized = input.authorized ? [...b.authorized, u.id] : b.authorized.filter(uid => uid !== u.id);
    if (input.authorized && !b.readers.includes(u.id)) b.readers.push(u.id);
    b.revision++;
    event(state, ctx, null, '接收授权独立变更', '配置', `${b.id} / ${u.name} → ${input.authorized ? '授权生效' : '撤销接收授权'}；${reason}`);
  } else fail(400, '配置操作无效');
}
export function view(state, ctx) {
  const parcels = state.parcels.filter(p => visible(ctx, p)).map(p => ({ ...p,
    business: getBusiness(ctx, p) || null,
    task: taskFor(ctx, p),
    canRelease: taskFor(ctx, p)?.kind === 'release',
    senderId: p.senderId || (p.status === '待交接' ? senderFor(ctx, p) : null),
    canEdit: p.status !== '已交接' && ((ctx.user.role === 'registrar' && p.creatorId === ctx.user.id) || !!getBusiness(ctx, p)?.reviewers.includes(ctx.user.id)),
    canReview: ctx.user.role === 'reviewer' && !!getBusiness(ctx, p)?.reviewers.includes(ctx.user.id) && ['待审核', '异常'].includes(p.status) && !!p.plan,
    canLink: taskFor(ctx, p)?.kind === 'link',
    canReceive: ctx.user.id === p.plan?.assigneeId && p.status === '待交接',
  }));
  const ids = new Set(parcels.map(p => p.id));
  return { company: { id: ctx.company.id, name: ctx.company.name, rule: ctx.company.rule }, user: ctx.user,
    users: ctx.company.users, businesses: ctx.company.businesses.filter(b => b.readers.includes(ctx.user.id)),
    parcels, events: state.events.filter(e => e.companyId === ctx.company.id && (ids.has(e.parcelId) || (!e.parcelId && ctx.user.role === 'admin'))).slice().reverse(),
  };
}
