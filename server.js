import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { openStore } from './lib/store.js';
import { createAuth, sessionCookie, demoPassword } from './lib/auth.js';
import { Problem, fail, context, view, candidates, parcelFor, createParcel, linkParcel, reviewParcel, replan, handoff, releaseParcel, reportException, editParcel, configure, event, id } from './lib/domain.js';

const actions = { link: linkParcel, review: reviewParcel, replan, handoff, release: releaseParcel, exception: reportException, edit: editParcel };
const staticFiles = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'] };
async function body(request) {
  if (!request.headers['content-type']?.startsWith('application/json')) fail(415, '请使用 JSON 请求');
  let data = '';
  for await (const chunk of request) { data += chunk; if (Buffer.byteLength(data) > 16384) fail(413, '请求内容过长'); }
  try { const value = JSON.parse(data); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); return value; }
  catch { fail(400, 'JSON 格式无效'); }
}
export function createApp({ databaseFile = process.env.DATABASE_PATH || resolve('data/parcelrelay.sqlite') } = {}) {
  const store = openStore(databaseFile);
  const auth = createAuth(store.db, store.read());
  const secureCookies = process.env.COOKIE_SECURE === '1';
  const accountView = (state, identity) => ({ ...view(state, context(state, identity.companyId, identity.userId)), account: { username: identity.username }, ...(context(state, identity.companyId, identity.userId).user.role === 'admin' ? { accounts: auth.list(identity.companyId) } : {}), mode: 'synthetic-data-personal-accounts' });
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname;
    const send = (status, data) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(data)); };
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'same-origin');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    let ctx, parcelId, action;
    try {
      if (request.method === 'GET' && staticFiles[path]) {
        const [file, mime] = staticFiles[path];
        const content = await readFile(new URL(`./public/${file}`, import.meta.url));
        response.writeHead(200, { 'Content-Type': `${mime}; charset=utf-8` }); return response.end(content);
      }
      if (request.method === 'GET' && path === '/api/health') return send(200, { ok: true, mode: 'synthetic-demo', storage: 'SQLite' });
      if (!path.startsWith('/api/')) return send(404, { error: '地址不存在' });
      if (request.method === 'POST') {
        const origin = request.headers.origin;
        if (origin && new URL(origin).host !== request.headers.host) fail(403, '拒绝来自其他网站的变更请求');
      }
      if (request.method === 'GET' && path === '/api/demo-accounts') {
        return send(200, { accounts: [
          { username: 'lin', name: '林悦', role: '登记员' }, { username: 'mei', name: '陈美', role: '授权审核人' },
          { username: 'nina', name: '李宁', role: '接收人' }, { username: 'chen', name: '周晨', role: '保密审核人' }, { username: 'admin', name: '许岑', role: '配置负责人' },
        ].map(a => ({ ...a, password: demoPassword(a.username) })), notice: '仅限合成数据试用；改密后初始密码不再有效。' });
      }
      if (request.method === 'POST' && path === '/api/auth/login') {
        const identity = await auth.login(await body(request), request.socket.remoteAddress);
        const state = store.read();
        context(state, identity.companyId, identity.userId);
        response.setHeader('Set-Cookie', sessionCookie(identity.token, secureCookies));
        return send(200, accountView(state, identity));
      }
      const identity = auth.identify(request.headers.cookie);
      const { companyId, userId } = identity;
      ctx = context(store.read(), companyId, userId);
      if (request.method === 'GET') {
        const state = store.read(); ctx = context(state, companyId, userId);
        if (path === '/api/state' || path === '/api/auth/me') return send(200, accountView(state, identity));
        if (path === '/api/tasks') return send(200, { tasks: view(state, ctx).parcels.filter(p => p.task) });
        if (path === '/api/accounts') { if (ctx.user.role !== 'admin') fail(403, '只有企业配置负责人可以管理账号'); return send(200, { accounts: auth.list(companyId) }); }
        if (path === '/api/parcels') return send(200, { parcels: view(state, ctx).parcels });
        if (path === '/api/candidates') return send(200, { candidates: candidates(ctx, url.searchParams.get('q'), url.searchParams.get('type')) });
        if (path === '/api/export') return send(200, { exportedAt: new Date().toISOString(), timezone: 'Asia/Kuala_Lumpur', mode: '合成数据 / 个人账号登录 / 本地可修改记录', ...view(state, ctx) });
        return send(404, { error: '接口不存在' });
      }
      if (request.method !== 'POST') { response.setHeader('Allow', 'GET, POST'); return send(405, { error: '不支持此请求方式' }); }
      const input = await body(request);
      if (path === '/api/auth/logout') {
        auth.logout(identity); response.setHeader('Set-Cookie', sessionCookie('', secureCookies));
        return send(200, { message: '已安全退出' });
      }
      if (path === '/api/auth/password') {
        const token = await auth.changePassword(identity, input);
        response.setHeader('Set-Cookie', sessionCookie(token, secureCookies));
        return send(200, { message: '密码已更新，其他设备的旧会话已退出' });
      }
      const result = store.transaction(state => {
        const currentIdentity = auth.identify(request.headers.cookie);
        ctx = context(state, currentIdentity.companyId, currentIdentity.userId);
        if (path === '/api/parcels') return { created: createParcel(state, ctx, input), ...accountView(state, identity) };
        if (path === '/api/config') { configure(state, ctx, input); return accountView(state, identity); }
        if (path === '/api/accounts') {
          if (ctx.user.role !== 'admin') fail(403, '只有企业配置负责人可以创建账号');
          if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 40 || !['registrar', 'reviewer', 'receiver', 'admin'].includes(input.role)) fail(400, '请填写有效姓名与岗位角色');
          const user = { id: id('USER'), name: input.name.trim(), role: input.role, available: true, revision: 1 };
          const loginName = auth.create(companyId, user.id, input.username, input.password);
          ctx.company.users.push(user);
          event(state, ctx, null, '创建个人账号', '账号配置', `${user.name} / ${loginName} / ${user.role}；未授予任何业务接收或审核权限`);
          return { ...accountView(state, identity), createdAccount: { username: loginName, name: user.name, role: user.role } };
        }
        const match = path.match(/^\/api\/parcels\/([^/]+)\/(link|review|replan|handoff|release|exception|edit)$/);
        if (!match) fail(404, '接口不存在');
        [, parcelId, action] = match;
        const p = parcelFor(state, ctx, parcelId);
        if (input.etag !== (p.etag || 0)) fail(409, '这条收件已被更新，请刷新后再操作');
        const outcome = actions[action](state, ctx, p, input);
        p.etag = (p.etag || 0) + 1;
        return { ...outcome, ...accountView(state, identity) };
      });
      return send(result.blocked ? 409 : path === '/api/parcels' ? 201 : 200, result);
    } catch (error) {
      const status = error instanceof Problem ? error.status : 500;
      if (parcelId && ctx && status < 500) {
        // 拒绝请求也留记录，但不写入越权者不可见的收件内容。
        store.transaction(state => {
          const fresh = context(state, ctx.company.id, ctx.user.id);
          try { const p = parcelFor(state, fresh, parcelId); event(state, fresh, p, `拒绝操作：${action}`, p.status, error.message, '拦截'); } catch { /* 不泄露其他企业或受限收件 */ }
        });
      }
      if (status === 500) console.error(error);
      return send(status, { error: status === 500 ? '服务暂时出错，请重试' : error.message });
    }
  });
  server.on('close', () => store.close());
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const server = createApp();
  server.on('error', error => { console.error(`启动失败：${error.message}`); process.exitCode = 1; });
  server.listen(port, host, () => console.log(`ParcelRelay: http://localhost:${port} · SQLite · 仅合成数据`));
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
}
