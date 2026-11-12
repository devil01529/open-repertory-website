(function(){
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function control(video){
  if(!video)return {stop(){}};
  let stopped=false;
  const play=()=>{if(stopped||document.hidden||reduced.matches){video.pause();return}if(!video.getAttribute('src'))video.src=video.dataset.src;video.play().catch(()=>{});};
  const stop=()=>{stopped=true;video.pause();video.removeAttribute('src');video.load();document.removeEventListener('visibilitychange',play);reduced.removeEventListener?.('change',play)};
  video.addEventListener('error',()=>{video.pause();},{once:true});
  document.addEventListener('visibilitychange',play);reduced.addEventListener?.('change',play);
  // Do not even download video when motion reduction is enabled.
  if(!reduced.matches){video.src=video.dataset.src;play();}
  return {stop};
 }
 window.SimiloraStartup={control};
 const overlay=document.getElementById('accountStartup');if(!overlay)return;
 const controller=control(overlay.querySelector('video'));let finished=false;
 function finish(){if(finished)return;finished=true;controller.stop();overlay.classList.add('leaving');setTimeout(()=>overlay.remove(),reduced.matches?0:180);}
 window.SimiloraStartup.finish=finish;
 overlay.querySelector('button').onclick=finish;
 setTimeout(finish,23000); // An unavailable session endpoint must never trap the login screen.
})();
