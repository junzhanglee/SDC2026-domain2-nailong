import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { seed, createParcel, context } from './domain.js';

export function openStore(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), document TEXT NOT NULL)');
  if (!db.prepare('SELECT id FROM app_state WHERE id=1').get()) {
    const state = seed();
    const ctx = context(state, 'orion', 'lin');
    for (const input of [
      { tracking: 'DEMO-A-001', source: '合成供应商 · 云帆设备', recipient: '黄安 / 采购', type: '采购物资', reference: 'PO-2026-001', note: '案例 A：原负责人休假，请核对业务后推荐授权备用人。' },
      { tracking: 'DEMO-B-001', source: '合成合作方', recipient: '温岚', type: '保密文件', reference: 'CT-2026-001', note: '案例 B：已申报为保密，接收人均不在岗。' },
      { tracking: 'DEMO-C-001', source: '合成客户 · 晨光', recipient: '项目组', type: '客户资料', reference: '晨光', note: '案例 C：存在两个相似项目，请补充准确编号后继续。' },
    ]) createParcel(state, ctx, input);
    db.prepare('INSERT INTO app_state VALUES (1, ?)').run(JSON.stringify(state));
  }
  const existing = JSON.parse(db.prepare('SELECT document FROM app_state WHERE id=1').get().document);
  if (existing.schema < 2) {
    const template = seed().companies[0].businesses.find(b => b.id === 'SUP-2026-001');
    if (!existing.companies[0].businesses.some(b => b.id === template.id)) existing.companies[0].businesses.push(template);
    existing.schema = 2;
    db.prepare('UPDATE app_state SET document=? WHERE id=1').run(JSON.stringify(existing));
  }
  return {
    db,
    read() { return JSON.parse(db.prepare('SELECT document FROM app_state WHERE id=1').get().document); },
    transaction(fn) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const state = this.read();
        const result = fn(state);
        db.prepare('UPDATE app_state SET document=? WHERE id=1').run(JSON.stringify(state));
        db.exec('COMMIT');
        return result;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close() { db.close(); },
  };
}
