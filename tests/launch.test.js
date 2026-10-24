import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../apps/web/assets/launch.js',import.meta.url),'utf8');
function setup({ready=true,reduced=false,locale='en'}={}){
  let now=0,id=0;const timers=new Map();
  const events=()=>({listeners:{},addEventListener(name,callback){(this.listeners[name]??=[]).push(callback);},emit(name,event={}){for(const callback of this.listeners[name]||[])callback(event);}});
  const classes=()=>{const values=new Set();return {add:x=>values.add(x),remove:x=>values.delete(x),contains:x=>values.has(x)};};
  const button={...events(),focus(){document.activeElement=this;}};
  const screen={classList:classes(),attributes:{},hidden:false,inert:false,querySelector:()=>button,contains:node=>node===button,setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}};
  const app={childElementCount:ready?1:0,inert:false};
  const nodes={'launch-screen':screen,app,'launch-tagline':{},'launch-hint':{},'launch-enter-label':{}};
  const main={focused:false,focus(){this.focused=true;}};
  const document={...events(),visibilityState:'visible',activeElement:button,documentElement:{dataset:{reduceMotion:String(reduced)}},body:{classList:classes()},getElementById:id=>nodes[id],querySelector:selector=>selector==='#main-content'?main:null};
  const window={...events(),matchMedia:()=>({matches:reduced})};
  runInNewContext(source,{document,window,localStorage:{getItem:()=>locale},performance:{now:()=>now},setTimeout:(callback,wait)=>{timers.set(++id,{at:now+wait,callback});return id;},clearTimeout:id=>timers.delete(id)});
  function advance(ms){const target=now+ms;for(;;){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>target)break;now=next[1].at;timers.delete(next[0]);next[1].callback();}now=target;}
  return {screen,app,button,document,window,nodes,main,advance};
}
test('launch auto-enters after a short introduction and returns keyboard access to the app',()=>{
  const view=setup();assert.equal(view.app.inert,true);assert.equal(view.nodes['launch-enter-label'].textContent,'Enter Nexus');
  view.advance(2099);assert.equal(view.app.inert,true);view.advance(1);assert.equal(view.app.inert,false);assert.ok(view.main.focused);
  view.advance(500);assert.equal(view.screen.hidden,true);assert.equal(view.document.body.classList.contains('launching'),false);
  view.window.emit('pageshow',{persisted:true});assert.equal(view.screen.hidden,false);assert.equal(view.app.inert,true);
  view.advance(2600);assert.equal(view.app.inert,false);
});
test('manual skip, Escape and a missing app-ready event never trap the user',()=>{
  const manual=setup({ready:false});manual.button.emit('click');assert.equal(manual.app.inert,false);manual.advance(8000);assert.equal(manual.screen.hidden,true);
  const keyboard=setup();let prevented=false;keyboard.document.emit('keydown',{key:'Escape',preventDefault(){prevented=true;}});assert.ok(prevented);assert.equal(keyboard.app.inert,false);
  const fallback=setup({ready:false});fallback.advance(8000);assert.equal(fallback.app.inert,false);assert.equal(fallback.screen.hidden,true);
});
test('reduced motion shortens the introduction; supported languages and unknown-locale fallback work',()=>{
  const reduced=setup({reduced:true,locale:'ms'});assert.equal(reduced.nodes['launch-enter-label'].textContent,'Masuk Nexus');reduced.advance(350);assert.equal(reduced.app.inert,false);
  const chinese=setup({locale:'__proto__'});assert.equal(chinese.nodes['launch-enter-label'].textContent,'进入 Nexus');
  const waiting=setup({ready:false});waiting.advance(1500);waiting.document.emit('nexus:ready');waiting.advance(600);assert.equal(waiting.app.inert,false);
});
