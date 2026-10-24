/* Runs independently of app imports so the introduction can always be dismissed. */
(()=>{
  const screen=document.getElementById('launch-screen'),app=document.getElementById('app');
  if(!screen||!app)return;
  const button=screen.querySelector('button'),subtitle=document.getElementById('launch-tagline'),hint=document.getElementById('launch-hint'),label=document.getElementById('launch-enter-label');
  const words={
    'zh-CN':['让工作，自然流动。','进入 Nexus','即将进入你的工作空间','Nexus 开屏'],
    en:['Where work comes together.','Enter Nexus','Your workspace is just a moment away','Nexus welcome'],
    ms:['Kerja lancar. Pasukan terhubung.','Masuk Nexus','Ruang kerja anda akan dibuka sebentar lagi','Selamat datang ke Nexus']
  };
  let timer,deadline,cleanup,started=0,closed=false,ready=false;
  function localize(){let locale='zh-CN';try{locale=localStorage.getItem('nexus-interface-language')||locale;}catch{}const text=words[Object.hasOwn(words,locale)?locale:'zh-CN'];subtitle.textContent=text[0];label.textContent=text[1];hint.textContent=text[2];screen.setAttribute('aria-label',text[3]);screen.lang=Object.hasOwn(words,locale)?locale:'zh-CN';}
  function reduceMotion(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.reduceMotion==='true';}
  function finish(){
    if(closed)return;closed=true;clearTimeout(timer);clearTimeout(deadline);clearTimeout(cleanup);
    const focused=screen.contains(document.activeElement);
    screen.classList.add('is-leaving');screen.setAttribute('aria-hidden','true');screen.inert=true;app.inert=false;document.body.classList.remove('launching');
    if(focused)(document.querySelector('#main-content')||document.querySelector('#login-name')||document.querySelector('#customer-contact'))?.focus({preventScroll:true});
    cleanup=setTimeout(()=>{screen.hidden=true;},reduceMotion()?0:500);
  }
  function schedule(){
    localize();if(closed||!ready||document.visibilityState==='hidden')return;
    clearTimeout(timer);timer=setTimeout(finish,Math.max(0,(reduceMotion()?350:2100)-(performance.now()-started)));
  }
  function start(){
    clearTimeout(timer);clearTimeout(deadline);clearTimeout(cleanup);closed=false;started=performance.now();
    screen.hidden=false;screen.inert=false;screen.classList.remove('is-leaving');screen.removeAttribute('aria-hidden');document.body.classList.add('launching');app.inert=true;localize();
    deadline=setTimeout(finish,7500);schedule();
  }
  button.addEventListener('click',finish);
  document.addEventListener('keydown',event=>{
    if(closed)return;
    if(event.key==='Escape'){event.preventDefault();finish();}
    else if(event.key==='Tab'){event.preventDefault();button.focus({preventScroll:true});}
  });
  document.addEventListener('nexus:ready',()=>{ready=true;schedule();});
  document.addEventListener('visibilitychange',()=>{if(!closed&&document.visibilityState==='visible'){started=performance.now();schedule();}});
  window.addEventListener('pageshow',event=>{if(event.persisted){ready=app.childElementCount>0;start();}});
  ready=app.childElementCount>0;start();
})();
