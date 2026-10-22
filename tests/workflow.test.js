import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../apps/web/assets/data.js';
import {can,permissions,planInquiry,approveInquiry,reviewRequest,visibleLogs,visibleRequests,visibleTasks,parseCSV,analyzeMessage,directRoom,visibleMessages,sendMessage,unreadMessages,markConversationRead} from '../apps/web/assets/engine.js';
const setup=role=>{const s=initialState();s.session={role,name:'Test'};return s;};
test('core journey checks inventory and approved leave before creating one task',()=>{
 const s=setup('owner');const p=planInquiry(s,'Q-1042');
 assert.equal(p.missing,20);assert.deepEqual(p.unavailable,['e5']);assert.equal(p.assignee,'e7');
 const n=s.tasks.length;approveInquiry(s,'Q-1042');assert.equal(s.tasks.length,n+1);assert.equal(s.tasks.at(-1).status,'受阻');
 assert.equal(s.inquiries[0].status,'approved');assert.throws(()=>approveInquiry(s,'Q-1042'));assert.equal(s.tasks.length,n+1);
});
test('customer service prepares suggestions but cannot approve business decisions',()=>{
 const s=setup('support');assert.ok(planInquiry(s,'Q-1042'));assert.throws(()=>approveInquiry(s,'Q-1042'),/权限/);
});
test('employee cannot open inbox or see team claims or team leave reasons',()=>{
 const s=setup('employee');assert.equal(can(s,'inbox'),false);assert.throws(()=>planInquiry(s,'Q-1042'),/权限/);
 s.claims.push({id:'c1',staff:'e4'},{id:'c2',staff:'e5'});assert.deepEqual(visibleRequests(s,'claims').map(x=>x.id),['c2']);
 assert.ok(visibleTasks(s).every(t=>t.assignee==='e5'));assert.ok(visibleLogs(s).every(l=>l.staff==='e5'));
});
test('finance cannot access HR records or approve HR requests',()=>{
 const s=setup('finance');assert.equal(can(s,'hr-import'),false);assert.equal(visibleRequests(s,'leave').length,0);
 assert.throws(()=>reviewRequest(s,'leave','L-001',true),/权限/);assert.equal(visibleLogs(s).length,0);
});
test('approval rechecks availability and inventory rather than trusting stale plan',()=>{
 const s=setup('owner');planInquiry(s,'Q-1042');s.stock=100;s.leave.push({staff:'e7',from:'2026-10-26',to:'2026-10-26',status:'approved'});
 assert.throws(()=>approveInquiry(s,'Q-1042'),/没有可用/);assert.equal(s.tasks.length,2);
});
test('own claims cannot be self-approved and a processed claim cannot execute twice',()=>{
 const s=setup('finance');s.claims.push({id:'mine',staff:'e4',status:'pending'},{id:'other',staff:'e5',status:'pending'});
 assert.throws(()=>reviewRequest(s,'claims','mine',true),/自己/);reviewRequest(s,'claims','other',true);assert.equal(s.claims[1].status,'approved');assert.throws(()=>reviewRequest(s,'claims','other',true),/已处理/);
});
test('leave balance is checked when approval executes',()=>{
 const s=setup('hr');s.leave.push({id:'L2',staff:'e5',days:14,status:'pending'});assert.throws(()=>reviewRequest(s,'leave','L2',true),/余额不足/);
});
test('CSV accepts BOM, escaped quotes and quoted commas; rejects corrupt data',()=>{
 const r=parseCSV('\uFEFFname,team,skill,capacity\r\n"Amir, Jr",运营,"印刷""A",5\r\n');assert.equal(r[0].name,'Amir, Jr');assert.equal(r[0].skill,'印刷"A');assert.equal(r[0].capacity,5);
 assert.throws(()=>parseCSV('name,team,skill,capacity\nA,B,C,wrong'));assert.throws(()=>parseCSV('name,team,skill,capacity\nA,B,C,-1'));assert.throws(()=>parseCSV('name,team,skill,capacity\nA,B,C,'));assert.throws(()=>parseCSV('name\nA'));assert.throws(()=>parseCSV('name,team,skill,capacity\n"bad'));
});
test('customer reply does not invent a delivery or financial promise',()=>{
 const r=analyzeMessage('退款 RM500，明天交货');assert.match(r.intent,/交易/);assert.match(r.reply,/负责人确认/);assert.doesNotMatch(r.reply,/已退款|保证|已付款/);
});
test('zero-capacity staff are not suggested as available',()=>{
 const s=setup('owner');s.staff.find(e=>e.id==='e7').capacity=0;
 assert.equal(planInquiry(s,'Q-1042').assignee,null);assert.throws(()=>approveInquiry(s,'Q-1042'),/没有可用/);
});
test('management has the same complete business permissions as the owner',()=>{
 const s=setup('manager');assert.deepEqual(permissions.manager,permissions.owner);
 for(const p of ['hr-import','claim-review','connect','manage-connectors'])assert.equal(can(s,p),true);
 assert.equal(visibleLogs(s).length,s.logs.length);
 s.claims.push({id:'mine',staff:'e2',status:'pending'});assert.throws(()=>reviewRequest(s,'claims','mine',true),/自己/);
});
test('any staff role can start a direct conversation, with a stable conversation identity',()=>{
 assert.equal(directRoom('e5','e2'),directRoom('e2','e5'));
 for(const role of ['owner','manager','hr','finance','employee','support']){
  const s=setup(role),own={owner:'e1',manager:'e2',hr:'e3',finance:'e4',employee:'e5',support:'e6'}[role];
  const to=own==='e1'?'e2':'e1',key=directRoom(own,to);sendMessage(s,key,'Hello Nexus');assert.equal(visibleMessages(s,key).length,1);
 }
});
test('private messages and summaries are inaccessible to a non-participant, even an admin',()=>{
 const s=setup('employee'),key=directRoom('e5','e6');sendMessage(s,key,'For Nur only');
 s.session={role:'manager',name:'Aisha'};assert.throws(()=>visibleMessages(s,key),/参与者/);assert.throws(()=>sendMessage(s,key,'Intrusion'),/参与者/);
 assert.ok(!unreadMessages(s).some(m=>m.text==='For Nur only'));
});
test('a direct message notifies only its recipient and can be marked read without affecting other chats',()=>{
 const s=setup('employee'),key=directRoom('e5','e6'),m=sendMessage(s,key,'Please confirm');
 assert.ok(!unreadMessages(s).some(x=>x.id===m.id));s.session={role:'support',name:'Nur'};
 assert.ok(unreadMessages(s).some(x=>x.id===m.id));markConversationRead(s,key);assert.ok(!unreadMessages(s).some(x=>x.id===m.id));assert.ok(unreadMessages(s).some(x=>x.room==='交付协作'));
});
test('invalid/self conversations and empty messages are rejected',()=>{
 const s=setup('employee');for(const room of ['dm:e5:e5','dm:e5:unknown','fake'])assert.throws(()=>sendMessage(s,room,'hello'));
 assert.throws(()=>sendMessage(s,directRoom('e5','e6'),'  '));assert.throws(()=>sendMessage(s,directRoom('e5','e6'),'x'.repeat(2001)));
});
