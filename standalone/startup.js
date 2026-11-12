(function(){
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function control(video){
  if(!video)return {done:Promise.resolve(),stop(){}};
  let stopped=false,resolve;const done=new Promise(r=>resolve=r);
  function complete(){if(stopped)return;stopped=true;video.pause();document.removeEventListener('visibilitychange',play);resolve();}
  function play(){if(stopped)return;if(document.hidden){video.pause();return}if(reduced.matches){complete();return}if(!video.getAttribute('src'))video.src=video.dataset.src;video.play().catch(()=>{if(!document.hidden)complete()});}
  video.loop=false;video.addEventListener('ended',complete,{once:true});video.addEventListener('error',complete,{once:true});document.addEventListener('visibilitychange',play);play();
  return {done,stop:complete};
 }
 window.SimiloraStartup={control};
 const overlay=document.getElementById('accountStartup');if(!overlay)return;
 const controller=new URLSearchParams(location.search).get('nativeIntro')==='1'?{done:Promise.resolve(),stop(){}}:control(overlay.querySelector('video'));let finished=false;
 window.SimiloraStartup.done=controller.done;
 controller.done.then(()=>{overlay.classList.add('intro-ended');overlay.querySelector('.startup-status').textContent='Loading Similora…';});
 window.SimiloraStartup.finish=async function(){await controller.done;if(finished)return;finished=true;overlay.classList.add('leaving');setTimeout(()=>overlay.remove(),reduced.matches?0:180);};
 overlay.querySelector('button').hidden=true;
})();
