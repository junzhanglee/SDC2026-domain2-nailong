import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../apps/web/assets/data.js';
import {copy,languages} from '../apps/web/assets/locales.js';
import {translate,validLanguage} from '../apps/web/assets/i18n.js';
import {currentProfile,saveLanguage,savePersonalPreferences} from '../apps/web/assets/preferences.js';

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
