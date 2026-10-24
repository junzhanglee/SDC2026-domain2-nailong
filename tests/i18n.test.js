import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../apps/web/assets/data.js';
import {copy,demoCopy,languages} from '../apps/web/assets/locales.js';
import {translate,validLanguage} from '../apps/web/assets/i18n.js';
import {currentProfile,saveLanguage,savePersonalPreferences} from '../apps/web/assets/preferences.js';
import {setLanguage} from '../apps/web/assets/i18n.js';
import {createDashboardUI} from '../apps/web/assets/dashboard-ui.js';
import {migrateCustomerService} from '../apps/web/assets/customer-service.js';

test('language preference is isolated per employee and rejects unsupported values atomically',()=>{
  const s=initialState();s.session={role:'employee',name:'Daniel'};
  saveLanguage(s,'ms');savePersonalPreferences(s,{compact:true});
  assert.equal(currentProfile(s).language,'ms');
  s.session={role:'owner',name:'Li Wei'};assert.equal(currentProfile(s).language,'zh-CN');
  saveLanguage(s,'en');assert.throws(()=>saveLanguage(s,'de'));assert.equal(currentProfile(s).language,'en');
  s.session={role:'employee',name:'Daniel'};assert.equal(currentProfile(s).language,'ms');
  const restored=JSON.parse(JSON.stringify(s));assert.equal(currentProfile(restored).language,'ms');
  s.session=null;assert.throws(()=>saveLanguage(s,'en'));
});
test('generated enquiry copy translates complete dynamic labels and stock checks in both locales',()=>{
  const samples=['Bunga Café · 客户待回复','Bunga Café · 需求待整理','Aisha · 休假申请','Bunga Café · 客户请求 Q-1042',
    '现货 80 个，需求 100 个，缺 20 个。','建议执行：Amir','审批负责人：管理者',
    '先补货，交期需人工确认；未承诺交期或报价。','Q-1042 · WhatsApp · 合成消息'];
  for(const language of ['en','ms'])for(const source of samples){
    const result=translate(source,language);
    assert.doesNotMatch(result,/[\u3400-\u9fff]/u,source+' in '+language);
    assert.equal(translate(source,'zh-CN'),source);
  }
  assert.equal(translate(samples[4],'en'),'Stock: 80; required: 100; shortage: 20.');
  assert.equal(translate('审批负责人：管理者','en'),'Approver: Manager');
});
test('dashboard localizes generated titles without rewriting customer names, task titles or stored records',()=>{
  const s=initialState();s.session={role:'support',name:'Nur'};migrateCustomerService(s);
  s.customerMessages.push({id:'language-fixture',customerId:'c1',from:'customer',by:'Bunga',text:'请先报价',createdAt:'2026-10-24T00:00:00Z'});
  const before=JSON.stringify(s);
  const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;');
  const ui=createDashboardUI({getState:()=>s,esc,btn:(text)=>`<button>${text}</button>`});
  for(const language of ['en','ms']){
    setLanguage(language);const markup=ui.render();
    assert.ok(markup.includes(language==='en'?'Awaiting reply':'Menunggu balasan'));
    assert.doesNotMatch(markup,/<h3>[^<]*客户待回复/);
    assert.ok(markup.includes('Bunga Café'));
    assert.equal(JSON.stringify(s),before);
  }
  setLanguage('zh-CN');assert.ok(ui.render().includes('客户待回复'));
});
test('all UI catalog entries have English and Malay copy, Chinese stays unchanged',()=>{
  assert.deepEqual(Object.keys(languages),['zh-CN','en','ms']);
  for(const [key,value] of Object.entries(copy)){
    assert.ok(value.en?.trim(),key+' missing English');assert.ok(value.ms?.trim(),key+' missing Malay');
    assert.equal(translate(key,'zh-CN'),key);
  }
  assert.equal(validLanguage('__proto__'),false);
  assert.equal(translate('设置','en'),'Settings');assert.equal(translate('设置','ms'),'Tetapan');
  assert.equal(translate('  工作概览 ','en'),'  Work overview ');
});
test('dynamic UI copy preserves names and counts; unknown business content remains untouched',()=>{
  assert.equal(translate('Li Wei，你好。','en'),'Hello, Li Wei.');
  assert.equal(translate('7 位成员','ms'),'7 ahli');
  assert.equal(translate('管理者 · 个人中心','en'),'Manager · My profile');
  const message='We need 100 cups, 请先报价 <script>';
  assert.equal(translate(message,'en'),message);assert.equal(translate(message,'ms'),message);
  assert.equal(translate('设置','unsupported'),'设置');
});
test('all built-in task, project, blocker and example copy has English and Malay display text',()=>{
  for(const [source,target] of Object.entries(demoCopy))for(const language of ['en','ms']){
    assert.ok(target[language]?.trim(),source);
    assert.doesNotMatch(translate(source,language),/[\u3400-\u9fff]/u,source);
    assert.equal(translate(source,'zh-CN'),source);
  }
  const s=initialState();s.session={role:'owner',name:'Li Wei'};const before=JSON.stringify(s);
  const ui=createDashboardUI({getState:()=>s,esc:String,btn:text=>`<button>${text}</button>`});
  for(const language of ['en','ms']){
    setLanguage(language);const markup=ui.render();
    assert.ok(markup.includes(language==='en'?'Store menu printing · Proofreading':'Percetakan menu kedai · Semakan pruf'));
    assert.ok(markup.includes(language==='en'?'Bunga Café brand materials':'Bahan jenama Bunga Café'));
    assert.equal(JSON.stringify(s),before);
    for(const project of s.projects)assert.doesNotMatch(translate(project.risk+'。这是合成项目基线，需结合实际工作记录确认。',language),/[\u3400-\u9fff]/u);
  }
  setLanguage('zh-CN');assert.ok(ui.render().includes('门店菜单印刷 · 校对'));
  const entered='客户自行填写的工作说明，保持原文';
  for(const language of ['en','ms'])assert.equal(translate(entered,language),entered);
});
