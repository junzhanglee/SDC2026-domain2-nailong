import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../apps/web/assets/data.js';
import {dashboardData,filterDashboardItems,malaysiaDate} from '../apps/web/assets/dashboard-model.js';
const now=new Date('2026-10-23T04:00:00Z');
const setup=role=>{const s=initialState();s.session={role,name:'Demo'};return s;};
test('due dates use Malaysia midnight and a three-calendar-day window without completed tasks',()=>{
  assert.equal(malaysiaDate(new Date('2026-10-22T16:00:00Z')),'2026-10-23');
  const s=setup('employee');s.tasks=[
    {id:'late',title:'Yesterday',assignee:'e5',status:'进行中',due:'2026-10-22'},
    {id:'today',title:'Today',assignee:'e5',status:'进行中',due:'2026-10-23'},
    {id:'edge',title:'In two days',assignee:'e5',status:'进行中',due:'2026-10-25'},
    {id:'later',title:'In three days',assignee:'e5',status:'待开始',due:'2026-10-26'},
    {id:'done',title:'Done',assignee:'e5',status:'已完成',due:'2026-10-01'}
  ];
  const d=dashboardData(s,now);assert.equal(d.counts.overdue,1);assert.equal(d.counts.soon,2);assert.equal(d.items.length,4);
  assert.deepEqual(filterDashboardItems(d,'soon').map(x=>x.ref),['today','edge']);
});
test('ordering puts overdue, blocking and personal approval ahead of ordinary work',()=>{
  const s=setup('manager');s.tasks=[
    {id:'plain',title:'Regular',status:'进行中',assignee:'e5',due:'2026-10-29'},
    {id:'blocked',title:'Blocked',status:'受阻',blocked:'缺材料',assignee:'e5',due:'2026-10-29'},
    {id:'late',title:'Overdue',status:'待开始',assignee:'e7',due:'2026-10-22'}
  ];s.inquiries=[{id:'approval',customer:'C',status:'review',reviewer:'e2',due:'2026-10-29',plan:{reason:'库存充足'}}];
  assert.deepEqual(dashboardData(s,now).items.map(x=>x.ref),['late','blocked','approval','plain']);
});
test('employee metrics and projects cannot leak another employee task or internal approvals',()=>{
  const s=setup('employee');s.tasks.push({id:'other-late',title:'Other',status:'受阻',due:'2026-10-01',assignee:'e7'});
  s.inquiries[0].status='review';s.claims.push({id:'expense',staff:'e4',status:'pending'});
  const d=dashboardData(s,now);assert.ok(d.items.every(x=>x.ownerId==='e5'));assert.equal(d.counts.approval,0);assert.equal(d.counts.overdue,0);
  assert.ok(!d.projects.some(x=>x.name.includes('Kedai')));
  s.session={role:'customer',customerId:'c1',name:'C'};assert.deepEqual(dashboardData(s,now).items,[]);
});
test('approval metrics exclude self requests and another designated reviewer',()=>{
  const s=setup('manager');s.inquiries=[{id:'owner',customer:'C',status:'review',reviewer:'e1',plan:{}}];
  s.leave.push({id:'own',staff:'e2',status:'pending'},{id:'other',staff:'e5',status:'pending',from:'2026-10-24',to:'2026-10-25',days:2});
  assert.equal(dashboardData(s,now).counts.approval,1);
  s.session={role:'owner',name:'Owner'};assert.equal(dashboardData(s,now).counts.approval,3);
});
test('missing or invalid deadlines never create fabricated overdue urgency',()=>{
  const s=setup('finance');s.claims=[{id:'claim',staff:'e5',status:'pending',amount:20,merchant:'Shop'}];
  const d=dashboardData(s,now);assert.equal(d.items.length,1);assert.equal(d.items[0].due,null);assert.equal(d.counts.overdue,0);
  s.session={role:'employee',name:'E'};s.tasks=[{id:'missing',title:'No date',assignee:'e5',status:'进行中'},{id:'bad',title:'Bad date',assignee:'e5',status:'进行中',due:'2026-02-31'}];
  const tasks=dashboardData(s,now);assert.equal(tasks.counts.overdue,0);assert.equal(tasks.counts.soon,0);
});
test('explicit blocking reason is actionable even when task status still says in progress',()=>{
  const s=setup('employee');const d=dashboardData(s,now);
  assert.equal(d.counts.blocked,1);assert.match(d.items[0].detail,/客户确认/);assert.equal(d.items[0].operation,'detail');
  assert.deepEqual(filterDashboardItems(d,'blocked').map(x=>x.ref),['T-201']);
});
test('customer replies clear the support response item without marking a fake deadline',()=>{
  const s=setup('support');s.customers=[{id:'c1',name:'Client'}];s.customerMessages=[{id:'m1',customerId:'c1',from:'customer',text:'请报价'}];
  assert.equal(dashboardData(s,now).items.filter(x=>x.kind==='customer').length,1);
  s.customerMessages.push({id:'m2',customerId:'c1',from:'support',text:'收到'});
  assert.equal(dashboardData(s,now).items.filter(x=>x.kind==='customer').length,0);
});
test('project summaries derive counts from visible tasks and respect explicit project identity',()=>{
  const s=setup('manager');s.tasks.push({id:'new-project',title:'New order',assignee:'e5',customer:'Bunga Café',project:'独立订单',status:'待开始',due:'2026-10-25'});
  const before=JSON.stringify(s),d=dashboardData(s,now);assert.equal(JSON.stringify(s),before);
  const p=d.projects.find(x=>x.name==='独立订单');assert.equal(p.active,1);assert.equal(p.total,1);
  assert.deepEqual(filterDashboardItems(d,'all',p.key).map(x=>x.ref),['new-project']);
});
test('completed work disappears and genuinely empty dashboards stay empty',()=>{
  const s=setup('employee');s.tasks.forEach(x=>x.status='已完成');
  const d=dashboardData(s,now);assert.deepEqual(d.items,[]);assert.deepEqual(d.projects,[]);assert.deepEqual(d.counts,{approval:0,soon:0,overdue:0,blocked:0});
});
