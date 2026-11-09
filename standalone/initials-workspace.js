(function () {
  'use strict';
  const app = window.OR, esc = app.escapeHTML;
  window.ORRecovery = {show(error) {document.body.replaceChildren();const message=document.createElement('p');message.textContent='Workspace could not open: '+error.message;document.body.append(message)}};
  let busy = false;
  async function newCase() {
    if (busy) return;
    busy = true;
    try {
      const initials = await app.ask('New private case', '', 'Initials only (1–4 letters). Never enter names or contact details.');
      if (initials !== null) await app.newCase(initials);
    } catch (error) {app.toast(error.message)} finally {busy = false;}
  }
  app.renderInitialsToday = function () {
    const root=document.getElementById('dashboardRoot'), cases=Object.values(app.state.cases), c=app.activeCase();
    root.innerHTML='<div class="dashboard-head"><div><div class="eyebrow">PRIVATE CLINICAL WORKSPACE</div><h1>My cases</h1><p id="casePrivacyStatus">'+cases.length+' of 5 cases · Initials only · Saved in this browser for this account</p></div></div>'+
      '<p>Do not enter names, contact details or identifying history. A sixth case replaces the oldest only after confirmation.</p><div class="case-actions"><button class="primary-btn" id="initialsNew">New case</button><button class="ghost-btn" id="initialsRepertory">Find rubrics</button><button class="ghost-btn" id="initialsAnalysis">Analysis</button></div>'+
      '<div>'+cases.map(x=>'<button class="ghost-btn case-card" data-private-case="'+esc(x.id)+'">'+esc(x.name)+' · '+x.analysis.length+' rubrics</button>').join('')+'</div>'+
      (c?'<section class="case-card"><h2>Case form</h2><form id="initialsForm" class="initials-form"><label>Initials<input name="initials" value="'+esc(c.name)+'" maxlength="4" pattern="[A-Za-z]{1,4}" required autocomplete="off"></label><label>Symptom totality<textarea name="totality" maxlength="4000">'+esc(c.totality||'')+'</textarea></label><label>Remedy considered<input name="remedy" maxlength="120" value="'+esc(c.remedyConsidered||'')+'" autocomplete="off"></label><p>Remedy choice is your clinical assessment. Analysis ranks recorded rubric matches.</p><button class="primary-btn">Save form</button><p id="caseSaved" role="status"></p></form></section>':'');
    document.getElementById('initialsNew').onclick=newCase;
    document.getElementById('initialsRepertory').onclick=()=>app.showPage('repertory');
    document.getElementById('initialsAnalysis').onclick=()=>app.showPage('analysis');
    root.querySelectorAll('[data-private-case]').forEach(b=>b.onclick=async()=>{await app.openCase(b.dataset.privateCase);app.showPage('dashboard')});
    const form=document.getElementById('initialsForm');
    if(form)form.onsubmit=e=>{
      e.preventDefault();
      try {
        const fields=new FormData(form);
        c.name=ORCasePolicy.initials(fields.get('initials'));
        c.totality=String(fields.get('totality')).slice(0,4000);
        c.remedyConsidered=String(fields.get('remedy')).slice(0,120);
        app.saveCases();app.renderCaseSelect();app.toast('Case form saved.');
      } catch(error){app.toast(error.message)}
    };
  };
  app.hooks.casesChanged.push(app.renderInitialsToday);
  app.hooks.start.push(app.renderInitialsToday);
  // Replace old new/rename listeners so invalid initials and cancellation have clean feedback.
  for (const id of ['caseNew','caseRename']) {
    const old=document.getElementById(id), button=old.cloneNode(true);old.replaceWith(button);
    button.onclick=id==='caseNew'?newCase:async()=>{
      try {const c=app.activeCase(), value=await app.ask('Edit initials',c.name,'Initials only (1–4 letters)');if(value===null)return;c.name=ORCasePolicy.initials(value);app.saveCases();app.renderCaseSelect()}catch(error){app.toast(error.message)}
    };
  }
  // Expiry/revocation and account switching must stop an already-open workspace.
  const expectedAccount=window.ORWebsiteAccount;
  let checking=false;
  async function checkSession() {
    if(checking)return;checking=true;
    try {
      const response=await fetch('/api/session',{cache:'no-store'}), user=await response.json();
      if(!response.ok || user.status!=='approved' || (expectedAccount && user.id!==expectedAccount)) {
        // Keep layout-observer targets mounted until navigation completes.
        document.body.inert=true;document.body.style.visibility='hidden';location.replace('/account');return;
      }

    } catch (_) {
      // Do not silently continue editing when approval cannot be verified.
      document.body.inert=true;
      document.title='Connection required — Open Repertory';
      return;
    } finally {checking=false}
    document.body.inert=false;
  }
  checkSession();setInterval(checkSession,30000);
  addEventListener('focus',checkSession);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkSession()});
})();
