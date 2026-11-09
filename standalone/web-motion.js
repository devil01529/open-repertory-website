(function(){
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), status=document.createElement('div');
  status.id='websiteLoadStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  status.textContent='Preparing your clinical workspace…';document.body.append(status);
  let active=0,timer=null,ready=false;
  const originalFetch=window.fetch;
  window.fetch=async function(...args){
    active++;
    if(!timer)timer=setTimeout(()=>{if(active){status.hidden=false;status.textContent=ready?'Loading content…':'Preparing your clinical workspace…'}},180);
    try{return await originalFetch.apply(this,args)}
    finally{active--;if(!active){clearTimeout(timer);timer=null;if(ready)status.hidden=true}}
  };
  const markReady=()=>{if(OR.workspaceReady){ready=true;status.hidden=true;clearInterval(startup)}};
  const startup=setInterval(markReady,100);
  window.ORTransition=(message)=>{status.textContent=message;status.hidden=false};
  const toolbar=document.getElementById('toolbar');
  let page=toolbar.dataset.page;
  new MutationObserver(()=>{
    const next=toolbar.dataset.page;if(next===page)return;page=next;
    const panel=document.getElementById('page-'+next);
    if(panel&&!reduced.matches&&typeof panel.animate==='function')panel.animate([{opacity:.55,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:180,easing:'ease-out'});
  }).observe(toolbar,{attributes:true,attributeFilter:['data-page']});
  document.addEventListener('click',e=>{if(e.target.closest('#menuAccount,.website-session button'))window.ORTransition('Opening Account & access…')},true);
})();
