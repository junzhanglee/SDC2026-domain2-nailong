import { randomBytes, scryptSync, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { fail, seed } from './domain.js';
const derive = promisify(scrypt);
const options = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const digest = value => createHash('sha256').update(value).digest('hex');
const username = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
export const demoPassword = userId => `Parcel-${userId}-2026!`;
export function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64, options).toString('hex')}`;
}
const dummyHash = passwordHash(randomBytes(32).toString('hex'));
async function matches(password, stored) {
  const [salt, hash] = stored.split(':');
  const actual = await derive(password, salt, 64, options);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
function validPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) fail(400, '密码请使用 12–128 个字符');
}
export function createAuth(db, state) {
  db.exec(`CREATE TABLE IF NOT EXISTS accounts (
    username TEXT PRIMARY KEY, company_id TEXT NOT NULL, user_id TEXT NOT NULL,
    password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, UNIQUE(company_id,user_id));
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, username TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (attempt_key TEXT PRIMARY KEY, failures INTEGER NOT NULL, reset_at INTEGER NOT NULL);`);
  // 仅为原始合成人员建立试用账号；不会重置已有密码或替企业新增人员授权。
  for (const company of seed().companies) for (const user of company.users) {
    if (!state.companies.find(c => c.id === company.id)?.users.some(u => u.id === user.id)) continue;
    if (!db.prepare('SELECT username FROM accounts WHERE company_id=? AND user_id=?').get(company.id, user.id)) {
      db.prepare('INSERT INTO accounts(username,company_id,user_id,password_hash) VALUES(?,?,?,?)').run(user.id, company.id, user.id, passwordHash(demoPassword(user.id)));
    }
  }
  function sessionFor(name) {
    const token = randomBytes(32).toString('base64url');
    db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token), name, Date.now() + 12 * 60 * 60 * 1000);
    return token;
  }
  return {
    async login(input, address = '') {
      const name = username(input.username);
      const password = typeof input.password === 'string' && input.password.length <= 128 ? input.password : '';
      const key = digest(`${address}:${name}`), now = Date.now();
      const attempt = db.prepare('SELECT * FROM login_attempts WHERE attempt_key=?').get(key);
      if (attempt?.reset_at > now && attempt.failures >= 6) fail(429, '尝试次数较多，请 10 分钟后再试');
      const account = name.length <= 48 ? db.prepare('SELECT * FROM accounts WHERE username=?').get(name) : null;
      const correct = await matches(password, account?.password_hash || dummyHash);
      const current = account && db.prepare('SELECT password_hash,active FROM accounts WHERE username=?').get(name);
      if (!current?.active || !correct || current.password_hash !== account.password_hash) {
        const latestAttempt = db.prepare('SELECT * FROM login_attempts WHERE attempt_key=?').get(key);
        db.prepare('INSERT INTO login_attempts VALUES(?,?,?) ON CONFLICT(attempt_key) DO UPDATE SET failures=?,reset_at=?')
          .run(key, 1, now + 600000, latestAttempt?.reset_at > now ? latestAttempt.failures + 1 : 1, latestAttempt?.reset_at > now ? latestAttempt.reset_at : now + 600000);
        fail(401, '账号或密码不正确');
      }
      db.prepare('DELETE FROM login_attempts WHERE attempt_key=?').run(key);
      return { token: sessionFor(name), companyId: account.company_id, userId: account.user_id, username: name };
    },
    identify(cookie = '') {
      const token = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('pr_session='))?.slice(11);
      if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) fail(401, '请先登录自己的账号');
      const account = db.prepare('SELECT a.username,a.company_id,a.user_id FROM sessions s JOIN accounts a ON a.username=s.username WHERE s.token_hash=? AND s.expires_at>? AND a.active=1').get(digest(token), Date.now());
      if (!account) fail(401, '登录已过期，请重新登录');
      return { companyId: account.company_id, userId: account.user_id, username: account.username, tokenHash: digest(token) };
    },
    logout(identity) { db.prepare('DELETE FROM sessions WHERE token_hash=?').run(identity.tokenHash); },
    async changePassword(identity, input) {
      validPassword(input.newPassword);
      const account = db.prepare('SELECT * FROM accounts WHERE username=?').get(identity.username);
      if (typeof input.currentPassword !== 'string' || input.currentPassword.length > 128 || !await matches(input.currentPassword, account.password_hash)) fail(400, '当前密码不正确');
      if (input.newPassword === input.currentPassword) fail(400, '新密码应与当前密码不同');
      db.exec('BEGIN IMMEDIATE');
      try {
        // 异步校验期间若另一请求已改密，则拒绝本次过期请求。
        if (db.prepare('SELECT password_hash FROM accounts WHERE username=?').get(identity.username)?.password_hash !== account.password_hash) fail(409, '账号密码已更新，请重新登录');
        db.prepare('UPDATE accounts SET password_hash=? WHERE username=?').run(passwordHash(input.newPassword), identity.username);
        db.prepare('DELETE FROM sessions WHERE username=?').run(identity.username);
        const token = sessionFor(identity.username);
        db.exec('COMMIT'); return token;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    list(companyId) { return db.prepare('SELECT username,user_id AS userId,active FROM accounts WHERE company_id=? ORDER BY username').all(companyId); },
    create(companyId, userId, name, password) {
      name = username(name); validPassword(password);
      if (!/^[a-z][a-z0-9._-]{2,47}$/.test(name)) fail(400, '账号须以字母开头，使用 3–48 位字母、数字、点、短横线或下划线');
      if (db.prepare('SELECT username FROM accounts WHERE username=?').get(name)) fail(409, '该账号已存在');
      db.prepare('INSERT INTO accounts(username,company_id,user_id,password_hash) VALUES(?,?,?,?)').run(name, companyId, userId, passwordHash(password));
      return name;
    },
  };
}
export function sessionCookie(token, secure = false) {
  return `pr_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token ? 43200 : 0}${secure ? '; Secure' : ''}`;
}
