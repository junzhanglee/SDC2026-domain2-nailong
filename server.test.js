import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './server.js';

async function harness(t, databaseFile = ':memory:') {
  const server = createApp({ databaseFile });
  await new Promise((resolve, reject) => { server.on('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const close = () => new Promise(resolve => server.close(resolve));
  t.after(close);
  async function req(user, path = '/api/state', data, company = 'orion') {
    const res = await fetch(base + path, { method: data ? 'POST' : 'GET', headers: { 'X-Demo-Company': company, 'X-Demo-User': user, ...(data ? { 'Content-Type': 'application/json' } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
    return { status: res.status, body: await res.json(), headers: res.headers };
  }
  const get = async (user, id) => (await req(user)).body.parcels.find(p => p.id === id || p.tracking === id);
  const act = async (user, id, action, data = {}, snapshot) => {
    const p = snapshot || await get(user, id);
    return req(user, `/api/parcels/${p.id}/${action}`, { etag: p.etag || 0, version: p.plan?.version, ...data });
  };
  const a = async () => {
    const p = await get('lin', 'DEMO-A-001');
    const res = await act('lin', p.id, 'link', { businessId: 'PO-2026-001', confirmed: true });
    assert.equal(res.status, 200);
    return p.id;
  };
  const approve = async id => {
    const res = await act('mei', id, 'review', { decision: 'approve', assigneeId: 'nina', reason: '核对授权与人员状态，批准备用人接收' });
    assert.equal(res.status, 200);
  };
  const release = async id => {
    const res = await act('lin', id, 'release', { confirmed: true });
    assert.equal(res.status, 200);
  };
  const checks = { model: true, quantity: true, condition: true, sender: true, receiver: true };
  return { req, get, act, a, approve, release, checks, base };
}

test('A：明确关联 → 授权备用人 → 人工审核 → 双身份交接 → 日志与关联业务状态', async t => {
  const h = await harness(t); const id = await h.a();
  let p = await h.get('lin', id);
  assert.equal(p.status, '待审核'); assert.equal(p.plan.assigneeId, 'nina'); assert.match(p.plan.reason, /原负责人不在岗/);
  await h.approve(id); await h.release(id);
  const res = await h.act('nina', id, 'handoff', { checks: h.checks, note: '合成物资已核对' });
  assert.equal(res.status, 200);
  p = res.body.parcels.find(p => p.id === id);
  assert.equal(p.status, '已交接'); assert.equal(p.proof.receiverId, 'nina'); assert.equal(p.proof.senderId, 'lin');
  assert.equal(p.business.downstreamStatus, '进行中');
  const events = res.body.events.filter(e => e.parcelId === id);
  assert.ok(['登记到件', '核对业务并生成方案', '批准分派', '交出方确认', '确认内部交接'].every(action => events.some(e => e.action === action)));
  assert.ok(events.every(e => e.id && e.at && e.actorName && e.role && e.before && e.after));
});

test('登记：必填项、唯一编号、仅登记员可写、只接受有效 JSON', async t => {
  const h = await harness(t);
  const input = { tracking: 'NEW-001', source: '合成供应商', recipient: '黄安', type: '采购物资', reference: 'PO-2026-001' };
  assert.equal((await h.req('lin', '/api/parcels', { ...input, source: '' })).status, 400);
  assert.equal((await h.req('nina', '/api/parcels', input)).status, 403);
  assert.equal((await h.req('lin', '/api/parcels', input)).status, 201);
  assert.equal((await h.req('lin', '/api/parcels', { ...input, tracking: 'new-001' })).status, 409);
  const bad = await fetch(h.base + '/api/parcels', { method: 'POST', headers: { 'X-Demo-Company': 'orion', 'X-Demo-User': 'lin', 'Content-Type': 'application/json' }, body: '{broken' });
  assert.equal(bad.status, 400);
});

test('C：同名项目不自动关联，必须准确编号、确认与类型一致', async t => {
  const h = await harness(t); const p = await h.get('lin', 'DEMO-C-001');
  const candidates = await h.req('lin', '/api/candidates?q=%E6%99%A8%E5%85%89&type=%E5%AE%A2%E6%88%B7%E8%B5%84%E6%96%99');
  assert.equal(candidates.body.candidates.length, 2); assert.ok(candidates.body.candidates.every(c => !c.exact));
  assert.equal((await h.act('lin', p.id, 'link', { businessId: '晨光', confirmed: true })).status, 400);
  assert.equal((await h.act('lin', p.id, 'link', { businessId: 'CLIENT-101', confirmed: false })).status, 400);
  assert.equal((await h.act('lin', p.id, 'link', { businessId: 'PO-2026-001', confirmed: true })).status, 400);
  assert.equal((await h.act('lin', p.id, 'link', { businessId: 'CLIENT-101', confirmed: true })).status, 200);
});

test('B：保密列表、详情、候选和导出均不向普通人员泄露元数据', async t => {
  const h = await harness(t); const secret = await h.get('chen', 'DEMO-B-001');
  for (const user of ['lin', 'mei', 'nina', 'admin']) {
    const state = await h.req(user);
    assert.ok(!JSON.stringify(state.body).includes('DEMO-B-001'));
    assert.ok(!JSON.stringify(state.body).includes('CT-2026-001'));
    const exported = await h.req(user, '/api/export'); assert.ok(!JSON.stringify(exported.body).includes('CT-2026-001'));
    const attempts = await h.req(user, `/api/parcels/${secret.id}/review`, { etag: 0, decision: 'approve', reason: '越权测试' });
    assert.equal(attempts.status, 404);
    const candidates = await h.req(user, '/api/candidates?q=CT-2026-001'); assert.equal(candidates.body.candidates.length, 0);
  }
  const linked = await h.act('chen', secret.id, 'link', { businessId: 'CT-2026-001', confirmed: true });
  assert.equal(linked.status, 200); const p = await h.get('chen', secret.id);
  assert.equal(p.status, '异常'); assert.equal(p.plan.assigneeId, null);
  assert.equal((await h.act('chen', p.id, 'review', { decision: 'approve', assigneeId: 'nina', reason: '不能向普通员工扩权' })).status, 409);
  const hold = await h.act('chen', p.id, 'review', { decision: 'hold', reason: '合成企业规则允许暂存，等待指定授权人' });
  assert.equal(hold.status, 200); assert.equal((await h.get('chen', p.id)).exception.kind, '已批准暂存');
});

test('权限：登记员不能审批，审核人不能为未授权人员改派', async t => {
  const h = await harness(t); const id = await h.a();
  assert.equal((await h.act('lin', id, 'review', { decision: 'approve', assigneeId: 'nina', reason: '测试越权' })).status, 403);
  assert.equal((await h.act('mei', id, 'review', { decision: 'approve', assigneeId: 'wen', reason: '测试非法改派' })).status, 409);
  assert.equal((await h.act('nina', id, 'handoff', { checks: h.checks })).status, 409);
});

test('双身份：没有交出方确认或证明缺项时，接收人不能完成交接', async t => {
  const h = await harness(t); const id = await h.a(); await h.approve(id);
  assert.equal((await h.act('nina', id, 'release', { confirmed: true })).status, 403);
  assert.equal((await h.act('nina', id, 'handoff', { checks: h.checks })).status, 409);
  await h.release(id);
  assert.equal((await h.act('nina', id, 'handoff', { checks: { ...h.checks, quantity: false } })).status, 400);
  assert.equal((await h.act('nina', id, 'handoff', { checks: { ...h.checks, model: 'true' } })).status, 400);
  assert.equal((await h.get('nina', id)).status, '待交接');
});

test('D：批准后撤销接收授权，执行时拦截旧批准并记录；恢复后必须重审', async t => {
  const h = await harness(t); const id = await h.a(); await h.approve(id); await h.release(id);
  assert.equal((await h.req('admin', '/api/config', { kind: 'authorization', businessId: 'PO-2026-001', userId: 'nina', authorized: false, reason: '验收撤销接收权限' })).status, 200);
  const res = await h.act('nina', id, 'handoff', { checks: h.checks });
  assert.equal(res.status, 409); assert.equal(res.body.blocked, true);
  assert.equal((await h.get('lin', id)).approval, null);
  assert.ok(res.body.events.some(e => e.parcelId === id && e.action === '交接被拦截' && e.result === '拦截'));
  await h.req('admin', '/api/config', { kind: 'authorization', businessId: 'PO-2026-001', userId: 'nina', authorized: true, reason: '重新确认权限，独立生效' });
  assert.equal((await h.act('nina', id, 'handoff', { checks: h.checks })).status, 409);
  assert.equal((await h.act('mei', id, 'replan', { reason: '恢复授权后重新检查' })).status, 200);
  await h.approve(id); await h.release(id);
  assert.equal((await h.act('nina', id, 'handoff', { checks: h.checks })).status, 200);
});

test('批准后人员离岗，交出前复核会让旧批准失效', async t => {
  const h = await harness(t); const id = await h.a(); await h.approve(id);
  await h.req('admin', '/api/config', { kind: 'availability', userId: 'nina', available: false, reason: '接收人临时离岗' });
  const res = await h.act('lin', id, 'release', { confirmed: true });
  assert.equal(res.status, 409); assert.equal(res.body.blocked, true);
  assert.equal((await h.get('lin', id)).status, '异常');
});

test('关键资料修改使批准失效，无关备注不使批准失效', async t => {
  const h = await harness(t); const id = await h.a(); await h.approve(id);
  const old = await h.get('lin', id);
  const note = await h.act('lin', id, 'edit', { note: '放在前台左侧', reason: '仅补充位置备注' });
  assert.equal(note.status, 200); const after = await h.get('lin', id);
  assert.deepEqual(after.approval, old.approval); assert.equal(after.revision, old.revision);
  const critical = await h.act('lin', id, 'edit', { reference: 'CLIENT-101', reason: '发现业务编号登记错误' });
  assert.equal(critical.status, 200); const edited = await h.get('lin', id);
  assert.equal(edited.status, '待核对'); assert.equal(edited.approval, null); assert.equal(edited.businessId, null);
  assert.equal((await h.act('nina', id, 'handoff', { checks: h.checks }, after)).status, 404);
});

test('E：实物不符暂停，清除批准并要求修正与重新审核', async t => {
  const h = await harness(t); const id = await h.a(); await h.approve(id);
  const res = await h.act('nina', id, 'exception', { reason: '应到两台，实到一台' });
  assert.equal(res.status, 200); const p = await h.get('lin', id);
  assert.equal(p.status, '异常'); assert.equal(p.approval, null); assert.equal(p.exception.reason, '应到两台，实到一台');
  assert.equal((await h.act('nina', id, 'handoff', { checks: h.checks })).status, 409);
});

test('退回与重新核对有明确状态和理由', async t => {
  const h = await harness(t); const id = await h.a();
  assert.equal((await h.act('mei', id, 'review', { decision: 'return', reason: '缺少采购信息，退回补充' })).status, 200);
  const p = await h.get('lin', id); assert.equal(p.status, '退回'); assert.match(p.exception.reason, /缺少/);
  assert.equal((await h.act('lin', id, 'link', { businessId: 'PO-2026-001', confirmed: true })).status, 200);
  assert.equal((await h.get('lin', id)).plan.version, 2);
});

test('事务与过期页面保护：并发重复领取只有一次成功', async t => {
  const h = await harness(t); const id = await h.a(); await h.approve(id); await h.release(id);
  const snapshot = await h.get('nina', id);
  const responses = await Promise.all([h.act('nina', id, 'handoff', { checks: h.checks }, snapshot), h.act('nina', id, 'handoff', { checks: h.checks }, snapshot)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  const state = (await h.req('nina')).body;
  assert.equal(state.events.filter(e => e.parcelId === id && e.action === '确认内部交接').length, 1);
  assert.equal((await h.act('nina', id, 'handoff', { checks: h.checks })).status, 409);
});

test('过期审核与重复交出不能重复写入业务结果', async t => {
  const h = await harness(t); const id = await h.a(); const old = await h.get('mei', id); await h.approve(id);
  assert.equal((await h.act('mei', id, 'review', { decision: 'approve', assigneeId: 'nina', reason: '重复批准' }, old)).status, 409);
  await h.release(id);
  assert.equal((await h.act('lin', id, 'release', { confirmed: true })).status, 409);
  const state = (await h.req('lin')).body;
  assert.equal(state.events.filter(e => e.parcelId === id && e.action === '批准分派').length, 1);
});

test('企业范围：第二家企业复用配置，不能跨企业查看或操作', async t => {
  const h = await harness(t); const id = await h.a();
  const other = await h.req('ivy', '/api/state', undefined, 'cedar');
  assert.equal(other.body.parcels.length, 0); assert.equal(other.body.businesses[0].ownerId, 'jo');
  assert.equal((await h.req('ivy', `/api/parcels/${id}/edit`, { etag: 0, reason: '跨企业尝试' }, 'cedar')).status, 404);
  assert.equal((await h.req('lin', '/api/state', undefined, 'cedar')).status, 401);
  const created = await h.req('ivy', '/api/parcels', { tracking: 'CEDAR-001', source: '合成客户', recipient: '乔文', type: '客户资料', reference: 'AC-2026-001' }, 'cedar');
  assert.equal(created.status, 201);
  const pid = created.body.created.id;
  const linked = await h.req('ivy', `/api/parcels/${pid}/link`, { etag: 0, businessId: 'AC-2026-001', confirmed: true }, 'cedar');
  assert.equal(linked.status, 200); assert.equal(linked.body.parcels[0].plan.assigneeId, 'jo');
  assert.ok(!(await h.req('lin')).body.parcels.some(p => p.id === pid));
});

test('持久化：数据库重新打开后保留登记、审核、交接与日志', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'parcelrelay-'));
  const file = join(dir, 'test.sqlite');
  t.after(() => rm(dir, { recursive: true, force: true }));
  const h = await harness(t, file); const id = await h.a(); await h.approve(id); await h.release(id);
  assert.equal((await h.act('nina', id, 'handoff', { checks: h.checks })).status, 200);
  const again = await harness(t, file);
  const p = await again.get('nina', id); assert.equal(p.status, '已交接'); assert.equal(p.proof.receiverId, 'nina');
  assert.ok((await again.req('lin')).body.events.some(e => e.parcelId === id && e.action === '确认内部交接'));
});

test('基础接口：页面可访问、错误请求不写数据、拒绝跨站写入', async t => {
  const h = await harness(t);
  const page = await fetch(h.base); assert.equal(page.status, 200); assert.match(await page.text(), /ParcelRelay/);
  assert.equal((await fetch(h.base + '/app.js')).status, 200);
  assert.equal((await fetch(h.base + '/styles.css')).status, 200);
  assert.equal((await fetch(h.base + '/not-found')).status, 404);
  assert.equal((await fetch(h.base + '/api/state')).status, 401);
  const cross = await fetch(h.base + '/api/parcels', { method: 'POST', headers: { 'X-Demo-Company': 'orion', 'X-Demo-User': 'lin', 'Content-Type': 'application/json', Origin: 'https://other.example' }, body: '{}' });
  assert.equal(cross.status, 403);
});

test('工作用品：在岗原负责人优先；非授权人不能取得配置权限', async t => {
  const h = await harness(t);
  const created = await h.req('lin', '/api/parcels', { tracking: 'SUP-TEST-001', source: '合成供应商', recipient: '李宁', type: '工作用品', reference: 'SUP-2026-001' });
  assert.equal(created.status, 201);
  const id = created.body.created.id;
  assert.equal((await h.act('lin', id, 'link', { businessId: 'SUP-2026-001', confirmed: true })).status, 200);
  const p = await h.get('lin', id); assert.equal(p.plan.assigneeId, 'nina'); assert.match(p.plan.reason, /原负责人在岗/);
  assert.equal((await h.req('mei', '/api/config', { kind: 'authorization', businessId: 'SUP-2026-001', userId: 'wen', authorized: true, reason: '越权扩权尝试' })).status, 403);
});

test('实物异常不能直接再次批准，必须记录修正并重新生成方案', async t => {
  const h = await harness(t); const id = await h.a(); await h.approve(id);
  await h.act('nina', id, 'exception', { reason: '型号不符' });
  assert.equal((await h.act('mei', id, 'review', { decision: 'approve', assigneeId: 'nina', reason: '不能跳过处理' })).status, 409);
  assert.equal((await h.act('mei', id, 'replan', { reason: '合成供应商更换物品，采购已核对型号' })).status, 200);
  await h.approve(id);
  assert.equal((await h.get('lin', id)).status, '待交接');
});

test('配置不可通过普通管理员增授保密接收权限，审核必须有理由', async t => {
  const h = await harness(t); const id = await h.a();
  assert.equal((await h.req('admin', '/api/config', { kind: 'authorization', businessId: 'CT-2026-001', userId: 'nina', authorized: true, reason: '保密权限不能隐式扩展' })).status, 400);
  assert.equal((await h.act('mei', id, 'review', { decision: 'approve', assigneeId: 'nina', reason: '' })).status, 400);
  assert.equal((await h.get('lin', id)).status, '待审核');
});

test('事务回滚：无效交接备注不能部分写入已交接状态', async t => {
  const h = await harness(t); const id = await h.a(); await h.approve(id); await h.release(id);
  const res = await h.act('nina', id, 'handoff', { checks: h.checks, note: 'x'.repeat(501) });
  assert.equal(res.status, 400); const p = await h.get('lin', id);
  assert.equal(p.status, '待交接'); assert.equal(p.proof, null);
  assert.equal((await h.act('nina', id, 'handoff', { checks: h.checks })).status, 200);
});

test('交出方确认后离岗或状态变动，也会使旧交出证明和批准失效', async t => {
  const h = await harness(t); const id = await h.a(); await h.approve(id); await h.release(id);
  await h.req('admin', '/api/config', { kind: 'availability', userId: 'lin', available: false, reason: '交出方临时离岗' });
  const res = await h.act('nina', id, 'handoff', { checks: h.checks });
  assert.equal(res.status, 409); assert.equal(res.body.blocked, true);
  assert.equal((await h.get('mei', id)).approval, null);
  assert.equal((await h.get('mei', id)).release, null);
});
