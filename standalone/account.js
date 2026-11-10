'use strict';
const $ = id => document.getElementById(id);
let loading = false, refreshing = false, current = null;
function progress(message, busy=true) {
  $('message').textContent=message;
  $('progress').hidden=!busy;
  document.querySelector('main').setAttribute('aria-busy',String(busy));
}
async function api(url, body) {
  let res;
  const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),20000);
  try {res=await fetch(url,{...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),cache:'no-store',signal:controller.signal})}
  catch(error){throw Error(error.name==='TimeoutError'||error.name==='AbortError'?'Connection is taking too long. Please retry.':'Connection failed. Check your connection and retry.')}
  finally{clearTimeout(timeout)}
  const data=await res.json();
  if(!res.ok){const error=Error(data.error||'Request failed');error.status=res.status;throw error}
  return data;
}
let accountRows=[], accountsPending=null, accountSignature='';
async function accounts() {
  if(accountsPending)return accountsPending;
  accountsPending=(async()=>{
    const users=await api('/api/accounts'), signature=JSON.stringify(users);
    if(signature!==accountSignature){accountRows=users;accountSignature=signature;renderAccounts()}
  })();
  try {await accountsPending} finally {accountsPending=null}
}
function renderAccounts() {
  const query=$('accountSearch').value.trim().toLowerCase(), filter=$('accountFilter').value;
  const users=accountRows.filter(user=>user.email.toLowerCase().includes(query)&&(filter==='all'||user.status===filter)), fragment=document.createDocumentFragment();
  $('accountCount').textContent=users.length+' shown · '+accountRows.filter(user=>user.status==='pending').length+' pending · '+accountRows.length+' total';
  users.sort((a,b)=>(a.status==='pending'?-1:0)-(b.status==='pending'?-1:0)||a.email.localeCompare(b.email));
  if(!users.length){const item=document.createElement('li');item.textContent='No matching accounts. New registrations appear here automatically.';fragment.append(item)}
  for(const user of users) {
    const row=document.createElement('li'),label=document.createElement('p');
    label.textContent=user.email+' · '+user.status;row.append(label);
    for(const status of ['approved','rejected','revoked']) {
      const b=document.createElement('button');b.textContent={approved:'Approve',rejected:'Reject',revoked:'Remove access'}[status];b.disabled=user.status===status;
      b.onclick=async()=>{
        if(loading)return;loading=true;row.querySelectorAll('button').forEach(x=>x.disabled=true);progress('Updating account access…');
        try{await api('/api/decision',{id:user.id,status});await accounts();progress('Access updated.',false)}catch(error){progress(error.message,false);await accounts().catch(()=>{})}finally{loading=false;renderAccounts()}
      };
      row.append(b);
    }
    if(['rejected','revoked'].includes(user.status)) {
      const remove=document.createElement('button');remove.textContent='Delete account';
      remove.onclick=()=>{
        const dialog=$('removeDialog');$('removeEmail').textContent=user.email;dialog.showModal();
        $('confirmRemove').onclick=async()=>{
          if(loading)return;loading=true;dialog.close();progress('Deleting account…');
          try{await api('/api/remove-account',{id:user.id});await accounts();progress('Account deleted.',false)}catch(error){progress(error.message,false)}finally{loading=false}
        };
      };
      row.append(remove);
    }
    fragment.append(row);
  }
  $('accounts').textContent='';$('accounts').appendChild(fragment);
}
function enterWorkspace() {progress('Access confirmed. Opening your clinical workspace…');location.replace('/workspace/')}
async function refresh(redirect=false) {
  if(refreshing)return;refreshing=true;
  try {
    current=await api('/api/session');
    $('login').hidden=true;$('session').hidden=false;
    $('workspace').hidden=current.status!=='approved';
    $('owner').hidden=current.role!=='owner';
    const stateText={pending:'Your request is waiting for owner approval. This page checks automatically.',approved:'Your account is approved.',revoked:'Access has been removed. Contact the owner.',rejected:'Your request was declined. Contact the owner.'};
    progress(current.email+' — '+stateText[current.status],false);
    if(current.role==='owner')await accounts();
    if(redirect && current.status==='approved')enterWorkspace();
  } catch(error) {
    if(error.status===401){current=null;$('login').hidden=false;$('session').hidden=true;$('owner').hidden=true;accountRows=[];accountSignature='';$('accounts').textContent='';progress('Sign in with your Similora website account.',false)}
    else progress(error.message,false);
  } finally {refreshing=false}
}
async function auth(signup) {
  if(loading)return;loading=true;$('signin').disabled=true;$('signup').disabled=true;
  progress(signup?'Creating your account and requesting approval…':'Signing in securely…');
  try {
    const details={email:$('email').value,password:$('password').value,remember:$('remember').checked};
    if(signup)await api('/api/signup',details);
    await api('/api/login',details);
    $('password').value='';await refresh(true);
  } catch(error){progress(error.message,false)}
  finally{loading=false;$('signin').disabled=false;$('signup').disabled=false}
}
$('login').onsubmit=e=>{e.preventDefault();auth(false)};
$('signup').onclick=()=>{if($('login').reportValidity())auth(true)};
$('logout').onclick=async()=>{progress('Signing out…');try{await api('/api/logout',{});location.replace('/login')}catch(error){progress(error.message,false)}};
$('refresh').onclick=async()=>{progress('Checking account requests…');try{await accounts();progress('Account requests are up to date.',false)}catch(error){progress(error.message,false)}};
$('checkAccess').onclick=()=>{progress('Checking your approval…');refresh(true)};
$('workspace').onclick=e=>{e.preventDefault();enterWorkspace()};
$('passwordForm').onsubmit=async e=>{
  e.preventDefault();if(loading)return;loading=true;progress('Changing your password…');
  try{const result=await api('/api/password',{currentPassword:$('oldPassword').value,newPassword:$('newPassword').value});$('passwordForm').reset();progress(result.message,false)}catch(error){progress(error.message,false)}finally{loading=false}
};
$('accountSearch').oninput=renderAccounts;
$('accountFilter').onchange=renderAccounts;
refresh(location.pathname!=='/account');
setInterval(()=>{if(!loading&&current&&current.status==='pending')refresh(true)},5000);
setInterval(()=>{if(!loading&&current&&current.role==='owner'&&!document.hidden)accounts().catch(()=>{})},15000);

$('cancelRemove').onclick=()=>$('removeDialog').close();
