(function(){
 'use strict';
 let resolveConsent,animation;
 const consent=new Promise(resolve=>resolveConsent=resolve);
 window.ORBoot={
  async start(run){
   await consent;
   document.getElementById('workspaceBoot').classList.add('boot-playing');
   let handedOff=false;try{handedOff=Date.now()-Number(sessionStorage.getItem('similora-intro-handoff'))<60000;sessionStorage.removeItem('similora-intro-handoff')}catch(_){}
   animation=handedOff?{done:Promise.resolve(),stop(){}}:window.SimiloraStartup?.control(document.querySelector('#workspaceBoot .logo-art'));
   const title=document.getElementById('bootTitle'),message=document.getElementById('bootMessage');
   title.textContent='Preparing your workspace';message.textContent='Loading the repertory, remedies and clinical controls…';
   document.getElementById('bootContinue').hidden=true;document.getElementById('bootSpinner').hidden=false;
   try {
    animation?.done.then(()=>document.getElementById('workspaceBoot')?.classList.add('intro-ended'));
    await Promise.all([run(),animation?.done]);
    if(document.fonts)await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('.brand-mark')].map(img=>img.decode?img.decode().catch(()=>{}):Promise.resolve()));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    document.documentElement.classList.remove('workspace-booting');
    animation?.stop();document.getElementById('workspaceBoot').remove();
    window.dispatchEvent(new Event('or-workspace-revealed'));
   } catch(error){window.ORBoot.fail(error)}
  },
  async fail(error){
   if(animation)await animation.done;
   animation?.stop();document.getElementById('workspaceBoot')?.classList.remove('boot-playing');
   const message=document.getElementById('bootMessage');if(!message)return;
   document.getElementById('bootTitle').textContent='Workspace could not load';
   message.textContent='Your saved cases have not been deleted. Check your connection and select Retry.';
   document.getElementById('bootSpinner').hidden=true;
   const button=document.getElementById('bootContinue');button.hidden=false;button.textContent='Retry';button.onclick=()=>location.reload();
  }
 };
 addEventListener('error',()=>{if(document.documentElement.classList.contains('workspace-booting'))window.ORBoot.fail()});
 document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('bootContinue').onclick=()=>resolveConsent();
 });
})();
