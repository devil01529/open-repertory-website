'use strict';
const $ = id => document.getElementById(id);
let loading = false;
async function api(url, body) {
  const res = await fetch(url, body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {});
  const data = await res.json();
  if (!res.ok) throw Error(data.error || 'Request failed');
  return data;
}
async function accounts() {
  $('accounts').replaceChildren();
  for (const user of await api('/api/accounts')) {
    const row=document.createElement('li'),label=document.createElement('p');
    label.textContent=user.email+' · '+user.status;row.append(label);
    for(const status of ['approved','rejected','revoked']) {
      const b=document.createElement('button');b.textContent={approved:'Approve',rejected:'Reject',revoked:'Revoke'}[status];
      b.onclick=async()=>{b.disabled=true;try{await api('/api/decision',{id:user.id,status});await accounts()}catch(e){$('message').textContent=e.message;b.disabled=false}};
      row.append(b);
    }
    $('accounts').append(row);
  }
}
async function refresh(redirect=false) {
  try {
    const user=await api('/api/session');
    $('login').hidden=true;$('session').hidden=false;
    $('message').textContent=user.email+' · '+user.status;
    $('workspace').hidden=user.status!=='approved';
    $('owner').hidden=user.role!=='owner';
    if(user.role==='owner')await accounts();
    if(redirect && user.status==='approved')location.replace('/workspace/');
  } catch(e) {$('login').hidden=false;$('session').hidden=true;$('owner').hidden=true;$('message').textContent='Sign in with your website account.'}
}
async function auth(signup) {
  if(loading)return;loading=true;$('signin').disabled=true;$('signup').disabled=true;
  try {
    const result=await api(signup?'/api/signup':'/api/login',{email:$('email').value,password:$('password').value,remember:$('remember').checked});
    $('password').value='';
    if(signup)$('message').textContent=result.message;else await refresh(true);
  } catch(e){$('message').textContent=e.message}
  finally{loading=false;$('signin').disabled=false;$('signup').disabled=false}
}
$('login').onsubmit=e=>{e.preventDefault();auth(false)};
$('signup').onclick=()=>auth(true);
$('logout').onclick=async()=>{try{await api('/api/logout',{});location.replace('/login')}catch(e){$('message').textContent=e.message}};
$('refresh').onclick=()=>accounts().catch(e=>$('message').textContent=e.message);
refresh(location.pathname!=='/account');
setInterval(()=>{if(!$('session').hidden && $('workspace').hidden)refresh(true)},5000);
