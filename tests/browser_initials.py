"""Optional real-asset browser regression; requires Chromium, Python Playwright and private dist/."""
import os
import subprocess
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
if not (ROOT/'dist/index.html').exists():
    raise SystemExit('Build the private clinical snapshot first; it is not stored in public GitHub.')
with tempfile.TemporaryDirectory(prefix='or-initials-browser-') as tmp:
    script="""
import {createApp} from './standalone/server.mjs';
const app=await createApp({origin:'http://127.0.0.1:4457',database:process.env.TEST_CASE_DB,assets:'dist',ownerEmail:'test@example.invalid',ownerPassword:'local-test-password-only'});
app.listen(4457,'127.0.0.1',()=>console.log('ready'));
"""
    server=subprocess.Popen(['node','--input-type=module','-e',script],cwd=ROOT,env={**os.environ,'TEST_CASE_DB':str(Path(tmp)/'accounts.sqlite')},stdout=subprocess.PIPE,text=True)
    try:
        if server.stdout.readline().strip()!='ready':
            raise RuntimeError('Local test server failed to start')
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
         b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
         page=b.new_page(viewport={'width':412,'height':915})
         errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
         page.goto('http://127.0.0.1:4457/login')
         page.locator('#email').fill('test@example.invalid');page.locator('#password').fill('local-test-password-only');page.locator('#signin').click()
         page.wait_for_url('**/workspace/');page.locator('#bootContinue').click();page.wait_for_function("() => window.OR?.workspaceReady === true && !document.documentElement.classList.contains('workspace-booting')")
         assert page.locator('#patientNew').count()==0
         page.locator('[name=initials]').fill('AB');page.locator('[name=totality]').fill('Synthetic symptom totality');page.locator('[name=remedy]').fill('Test remedy')
         page.get_by_role('button',name='Save form',exact=True).click()
         first=page.evaluate('OR.state.activeCaseId')
         for initials in ['CD','EF','GH','IJ']:
          page.evaluate('(x)=>OR.newCase(x)',initials)
         assert page.evaluate('Object.keys(OR.state.cases).length')==5
         page.evaluate("window.newCasePromise=OR.newCase('KL'); void 0")
         page.get_by_role('button',name='Cancel',exact=True).click()
         assert page.evaluate('Object.keys(OR.state.cases).length')==5
         assert page.evaluate('(id)=>!!OR.state.cases[id]',first)
         page.evaluate("window.newCasePromise=OR.newCase('KL'); void 0")
         page.get_by_role('button',name='Delete oldest & continue',exact=True).click()
         page.wait_for_function("() => OR.activeCase().name==='KL'")
         assert page.evaluate('Object.keys(OR.state.cases).length')==5
         assert not page.evaluate('(id)=>!!OR.state.cases[id]',first)
         page.reload();page.locator('#bootContinue').click();page.wait_for_function("() => window.OR?.workspaceReady === true && !document.documentElement.classList.contains('workspace-booting')")
         assert page.evaluate('Object.keys(OR.state.cases).length')==5
         page.locator('#initialsRepertory').click()
         page.wait_for_timeout(1200)
         assert page.evaluate("OR.state.page === 'repertory'")
         page.evaluate("OR.showPage('mm')")
         page.wait_for_timeout(1000)
         assert page.evaluate("OR.state.page === 'mm'")
         page.evaluate("async()=>fetch('/api/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})")
         page.evaluate("dispatchEvent(new Event('focus'))")
         page.wait_for_url('**/account')
         assert not errors,errors
         print('Browser passed: login redirect, hidden patient flow, case form, five cases, cancel sixth, replace oldest, reload persistence, repertory and library; zero JS errors.')
         b.close()
    finally:
        server.terminate()
        server.wait(timeout=10)
