import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { openStore } from './lib/store.js';
import { Problem, fail, context, view, candidates, parcelFor, createParcel, linkParcel, reviewParcel, replan, handoff, releaseParcel, reportException, editParcel, configure, event } from './lib/domain.js';

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
      if (request.method === 'GET' && path === '/api/bootstrap') {
        const state = store.read();
        return send(200, { companies: state.companies.map(c => ({ id: c.id, name: c.name, description: c.description, users: c.users.map(u => ({ id: u.id, name: u.name, role: u.role })) })) });
      }
      if (!path.startsWith('/api/')) return send(404, { error: '地址不存在' });
      const companyId = request.headers['x-demo-company'];
      const userId = request.headers['x-demo-user'];
      ctx = context(store.read(), companyId, userId);
      if (request.method === 'GET') {
        const state = store.read(); ctx = context(state, companyId, userId);
        if (path === '/api/state') return send(200, view(state, ctx));
        if (path === '/api/parcels') return send(200, { parcels: view(state, ctx).parcels });
        if (path === '/api/candidates') return send(200, { candidates: candidates(ctx, url.searchParams.get('q'), url.searchParams.get('type')) });
        if (path === '/api/export') return send(200, { exportedAt: new Date().toISOString(), timezone: 'Asia/Kuala_Lumpur', mode: '合成数据 / 模拟身份 / 本地可修改记录', ...view(state, ctx) });
        return send(404, { error: '接口不存在' });
      }
      if (request.method !== 'POST') { response.setHeader('Allow', 'GET, POST'); return send(405, { error: '不支持此请求方式' }); }
      const origin = request.headers.origin;
      if (origin && new URL(origin).host !== request.headers.host) fail(403, '拒绝来自其他网站的变更请求');
      const input = await body(request);
      const result = store.transaction(state => {
        ctx = context(state, companyId, userId);
        if (path === '/api/parcels') return { created: createParcel(state, ctx, input), ...view(state, ctx) };
        if (path === '/api/config') { configure(state, ctx, input); return view(state, ctx); }
        const match = path.match(/^\/api\/parcels\/([^/]+)\/(link|review|replan|handoff|release|exception|edit)$/);
        if (!match) fail(404, '接口不存在');
        [, parcelId, action] = match;
        const p = parcelFor(state, ctx, parcelId);
        if (input.etag !== (p.etag || 0)) fail(409, '这条收件已被更新，请刷新后再操作');
        const outcome = actions[action](state, ctx, p, input);
        p.etag = (p.etag || 0) + 1;
        return { ...outcome, ...view(state, ctx) };
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
