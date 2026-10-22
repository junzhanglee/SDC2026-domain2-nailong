import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../apps/web/assets/data.js';
import {reviewRequest,can} from '../apps/web/assets/engine.js';
import {currentProfile,saveProfile,savePersonalPreferences,saveCompanySettings,companySettings,savePolicies,policy,personalExport,saveAvatar} from '../apps/web/assets/preferences.js';
const setup=role=>{const s=initialState();s.session={role,name:'Test'};return s;};
test('all logged-in roles can access personal center and settings; logged-out cannot',()=>{
 for(const role of ['owner','manager','hr','finance','employee','support']){const s=setup(role);assert.ok(can(s,'profile'));assert.ok(can(s,'settings'));}const s=initialState();assert.equal(can(s,'settings'),false);assert.throws(()=>saveProfile(s,{displayName:'No'}));
});
test('profile updates are scoped to the current employee and cannot change privilege',()=>{
 const s=setup('employee');saveProfile(s,{displayName:'Daniel Tan',email:'daniel@example.test',phone:'0123456789',bio:'Print team',role:'owner'});assert.equal(currentProfile(s).displayName,'Daniel Tan');assert.equal(s.staff.find(x=>x.id==='e5').name,'Daniel Tan');assert.equal(s.session.role,'employee');assert.equal(can(s,'broadcast'),false);assert.throws(()=>saveProfile(s,{displayName:'',email:'bad'}));s.session={role:'finance',name:'Kumar'};assert.equal(currentProfile(s).displayName,'Kumar');
});
test('personal preferences are per employee and cannot disable mandatory broadcasts',()=>{
 const s=setup('employee');savePersonalPreferences(s,{compact:'on',reducedMotion:'on',broadcasts:false});assert.equal(currentProfile(s).compact,true);assert.equal(currentProfile(s).reducedMotion,true);assert.equal(currentProfile(s).chatBadges,false);assert.equal(currentProfile(s).broadcasts,undefined);s.session={role:'finance',name:'Kumar'};assert.equal(currentProfile(s).compact,false);
});
test('only owner and manager can modify company settings and valid values update workspace data',()=>{
 const fields={name:'Nexus Studio',industry:'Design',state:'Johor',email:'studio@example.test',phone:'',address:''};for(const role of ['employee','hr','finance','support'])assert.throws(()=>saveCompanySettings(setup(role),fields),/权限/);for(const role of ['owner','manager']){const s=setup(role);saveCompanySettings(s,fields);assert.equal(companySettings(s).name,'Nexus Studio');assert.equal(s.state,'Johor');}assert.throws(()=>saveCompanySettings(setup('owner'),{...fields,state:'Unknown'}));
});
test('saved leave policy is enforced at approval time; invalid policies are rejected atomically',()=>{
 const s=setup('owner');savePolicies(s,{annualLeaveDays:'2',claimLimit:'300',overtimeHours:'5'});assert.equal(policy(s).claimLimit,300);s.leave.push({id:'new',staff:'e5',days:2,status:'pending'});assert.throws(()=>reviewRequest(s,'leave','new',true),/余额/);const before={...s.policies};assert.throws(()=>savePolicies(s,{annualLeaveDays:'-1',claimLimit:'1',overtimeHours:'1'}));assert.deepEqual(s.policies,before);assert.throws(()=>savePolicies(setup('employee'),{annualLeaveDays:20,claimLimit:100,overtimeHours:4}),/权限/);
});
test('personal export excludes other employee requests and rejects executable avatars',()=>{
 const s=setup('employee');s.claims.push({staff:'e4',amount:100},{staff:'e5',amount:20});assert.equal(personalExport(s).requests.claims.length,1);assert.equal(personalExport(s).requests.claims[0].amount,20);assert.throws(()=>saveAvatar(s,'data:image/svg+xml;base64,aaaa'));assert.throws(()=>saveAvatar(s,'https://unknown.example/avatar.png'));saveAvatar(s,'');assert.equal(currentProfile(s).avatar,'');
});
