(function(){
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function control(art){
  let seen=false;try{seen=sessionStorage.getItem('similora-logo-intro-v2')==='done'}catch(_){}
  if(!art||reduced.matches||seen)return {done:Promise.resolve(),stop(){}};
  const animations=[];let stopped=false,resolve;const done=new Promise(r=>resolve=r);
  const logo=art.querySelector('img'),title=art.querySelector('.intro-name'),caption=art.querySelector('.intro-caption');
  animations.push(logo.animate([{opacity:0,transform:'scale(.86)'},{opacity:1,transform:'scale(1)'}],{duration:3200,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'}));
  for(const [el,delay] of [[title,900],[caption,1500]])animations.push(el.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:1000,delay,fill:'both'}));
  const clock=art.animate([{opacity:1},{opacity:1}],{duration:10000});animations.push(clock);
  function visibility(){for(const a of animations)document.hidden?a.pause():a.play()}
  function stop(){if(stopped)return;stopped=true;document.removeEventListener('visibilitychange',visibility);for(const a of animations)a.cancel();resolve()}
  document.addEventListener('visibilitychange',visibility);visibility();
  clock.finished.then(()=>{try{sessionStorage.setItem('similora-logo-intro-v2','done')}catch(_){}stop()}).catch(()=>{});
  return {done,stop};
 }
 window.SimiloraStartup={control};
 const overlay=document.getElementById('accountStartup');if(!overlay)return;
 const controller=new URLSearchParams(location.search).get('nativeIntro')==='1'?{done:Promise.resolve(),stop(){}}:control(overlay.querySelector('.logo-art'));let finished=false,requested=false;
 window.SimiloraStartup.done=controller.done;
 controller.done.then(()=>{if(requested)return;overlay.classList.add('intro-ended');overlay.querySelector('.startup-status').textContent='Loading Similora…';});
 window.SimiloraStartup.finish=async function(){requested=true;await controller.done;if(finished)return;finished=true;overlay.classList.add('leaving');setTimeout(()=>overlay.remove(),reduced.matches?0:180)};
 overlay.querySelector('button').hidden=true;
})();
