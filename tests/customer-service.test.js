import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../apps/web/assets/data.js';
import {can,approveInquiry,planInquiry,visibleTasks,visibleRequests,visibleLogs,publicBroadcasts,sendMessage,staffId} from '../apps/web/assets/engine.js';
import {migrateCustomerService,sendCustomerMessage,visibleCustomerMessages,customerRequestSummaries,createSupportInquiry,visibleHandoffs} from '../apps/web/assets/customer-service.js';
const setup=role=>{const s=initialState();s.session={role,name:'Demo'};migrateCustomerService(s);return s;};
const fields={customerId:'c1',text:'请安排 100 个定制杯',qty:'100',due:'2026-10-26',assignee:'e7',reviewer:'e2'};
test('only support can create customer requests; every other staff role is denied',()=>{
  for(const role of ['owner','manager','hr','finance','employee']){const s=setup(role);assert.equal(can(s,'create-inquiry'),false);assert.throws(()=>createSupportInquiry(s,fields),/权限/);assert.equal(s.inquiries.length,1);}
  assert.equal(createSupportInquiry(setup('support'),fields).status,'review');
});
test('customer messages go to support and remain scoped to the customer account',()=>{
  const s=setup('customer');s.session.customerId='c1';
  const message=sendCustomerMessage(s,'c1','我要询价');
  assert.equal(message.from,'customer');assert.equal(s.chats.length,2);assert.equal(publicBroadcasts(s).length,0);
  assert.throws(()=>sendCustomerMessage(s,'c2','Wrong customer'),/其他客户/);
  assert.throws(()=>visibleCustomerMessages(s,'c2'),/其他客户/);
  s.session={role:'support',name:'Nur'};assert.equal(visibleCustomerMessages(s,'c1')[0].id,message.id);
  sendCustomerMessage(s,'c1','请确认数量');
  s.session={role:'customer',customerId:'c1',name:'Bunga'};
  assert.equal(visibleCustomerMessages(s,'c1').at(-1).from,'support');
});
test('owners, managers and other internal roles cannot read or send customer service messages',()=>{
  for(const role of ['owner','manager','employee','finance','hr']){const s=setup(role);assert.throws(()=>visibleCustomerMessages(s,'c1'),/权限/);assert.throws(()=>sendCustomerMessage(s,'c1','Not support'),/权限/);}
});
test('customer identities have no internal modules, records, private chats or broadcasts',()=>{
  const s=setup('customer');s.session.customerId='c1';
  for(const permission of ['dashboard','inbox','people','work','profile','settings','approvals','create-inquiry','chat'])assert.equal(can(s,permission),false);
  s.logs.push({staff:undefined,visibility:'operations'});
  assert.deepEqual(visibleTasks(s),[]);assert.deepEqual(visibleRequests(s,'leave'),[]);assert.deepEqual(visibleLogs(s),[]);assert.deepEqual(visibleHandoffs(s),[]);
  assert.throws(()=>sendMessage(s,'全员交流','Intrusion'),/权限/);
  assert.throws(()=>createSupportInquiry(s,fields),/权限/);
});
test('support handoff is visible to designated employee and manager, but creates no task until approved',()=>{
  const s=setup('support'),count=s.tasks.length;
  const q=createSupportInquiry(s,fields);
  assert.equal(q.plan.assignee,'e7');assert.equal(q.reviewer,'e2');assert.equal(s.tasks.length,count);
  s.session={role:'employee',name:'Daniel'};assert.equal(staffId(s),'e5');assert.deepEqual(visibleHandoffs(s),[]);
  // Employee e5 gets a request only when explicitly assigned and available.
  s.session={role:'support',name:'Nur'};const daniel=createSupportInquiry(s,{...fields,assignee:'e5',due:'2026-10-24'});
  s.session={role:'employee',name:'Daniel'};assert.equal(visibleHandoffs(s)[0].id,daniel.id);assert.throws(()=>approveInquiry(s,q.id),/权限/);
  s.session={role:'manager',name:'Aisha'};assert.equal(visibleHandoffs(s).length,2);approveInquiry(s,q.id);
  assert.equal(s.tasks.length,count+1);assert.equal(s.tasks.at(-1).inquiryId,q.id);assert.equal(s.tasks.at(-1).assignee,'e7');
  assert.equal(s.tasks.at(-1).status,'受阻');assert.throws(()=>approveInquiry(s,q.id),/已审批/);
});
test('handoff validates source linkage, assigned reviewer and requested employee availability atomically',()=>{
  const s=setup('support'),n=s.inquiries.length,logs=s.logs.length;
  for(const changes of [{qty:0},{due:'2026-02-31'},{reviewer:'e5'},{assignee:'e3'},{assignee:'e5'},{sourceMessageId:'missing'}])assert.throws(()=>createSupportInquiry(s,{...fields,...changes}));
  assert.equal(s.inquiries.length,n);assert.equal(s.logs.length,logs);
  const q=createSupportInquiry(s,{...fields,reviewer:'e1'});
  s.session={role:'manager',name:'Aisha'};assert.throws(()=>approveInquiry(s,q.id),/指定负责人/);
  s.session={role:'owner',name:'Li Wei'};approveInquiry(s,q.id);assert.equal(q.status,'approved');
});
test('customer message converts once and customer summaries exclude internal decision data',()=>{
  const s=setup('customer');s.session.customerId='c1';const m=sendCustomerMessage(s,'c1','100 个杯子');
  s.session={role:'support',name:'Nur'};const q=createSupportInquiry(s,{...fields,sourceMessageId:m.id});
  assert.throws(()=>createSupportInquiry(s,{...fields,sourceMessageId:m.id}),/已建立/);
  assert.throws(()=>createSupportInquiry(s,{...fields,customerId:'c2',sourceMessageId:m.id}),/不匹配/);
  s.session={role:'customer',name:'Bunga',customerId:'c1'};
  assert.deepEqual(Object.keys(customerRequestSummaries(s)[0]).sort(),['id','text','qty','due','status'].sort());
  assert.equal(customerRequestSummaries(s)[0].id,q.id);
  s.session.customerId='c2';assert.deepEqual(customerRequestSummaries(s),[]);
});
test('approval rechecks the specifically selected employee instead of silently changing assignment',()=>{
  const s=setup('support'),q=createSupportInquiry(s,{...fields,due:'2026-10-24',assignee:'e5'});
  s.leave.push({staff:'e5',from:q.due,to:q.due,status:'approved'});s.session={role:'manager',name:'Aisha'};
  const count=s.tasks.length;assert.throws(()=>approveInquiry(s,q.id),/没有可用/);assert.equal(s.tasks.length,count);assert.equal(q.status,'review');
});
test('old states get customer defaults without resetting existing business data',()=>{
  const s=initialState(),old=s.inquiries;delete s.customerMessages;delete s.customers;
  migrateCustomerService(s);migrateCustomerService(s);assert.equal(s.customers.length,2);assert.equal(s.inquiries,old);
  s.session={role:'customer',customerId:'unknown'};assert.throws(()=>sendCustomerMessage(s,'c1','Hello'),/客户入口/);
});
