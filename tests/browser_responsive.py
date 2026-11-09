"""Real clinical assets: layout, entry notice and slow-start regression."""
import os,subprocess,tempfile,time
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='or-responsive-') as tmp:
 code="""import {createApp} from './standalone/server.mjs'; const s=await createApp({origin:'http://127.0.0.1:4458',database:process.env.TEST_DB,assets:'dist',ownerEmail:'test@example.invalid',ownerPassword:'test-only-password-12345'});s.listen(4458,'127.0.0.1',()=>console.log('ready'));"""
 server=subprocess.Popen(['node','--input-type=module','-e',code],cwd=ROOT,env={**os.environ,'TEST_DB':str(Path(tmp)/'db.sqlite')},stdout=subprocess.PIPE,text=True)
 try:
  assert server.stdout.readline().strip()=='ready'
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
   context=browser.new_context();page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://127.0.0.1:4458/login');page.locator('#email').fill('test@example.invalid');page.locator('#password').fill('test-only-password-12345');page.locator('#signin').click();page.wait_for_url('**/workspace/')
   expect(page.locator('#workspaceBoot')).to_be_visible();expect(page.locator('#toolbar')).to_be_hidden()
   assert 'not stored in our server database' in page.locator('#bootMessage').inner_text()
   assert page.evaluate('() => OR.workspaceReady') is False
   page.locator('#bootContinue').click();expect(page.locator('#workspaceBoot')).to_have_count(0,timeout=30000)
   assert page.evaluate('() => !!OR.state.repertory')
   for width,height in [(360,800),(412,915),(768,1024),(1024,768),(1366,768),(1920,1080)]:
    page.set_viewport_size({'width':width,'height':height})
    for theme in ['light','dark']:
     page.evaluate('(theme)=>{document.body.dataset.theme=theme;document.documentElement.dataset.theme=theme}',theme)
     page.evaluate("() => OR.showPage('dashboard')")
     page.wait_for_timeout(100)
     assert page.evaluate('() => document.documentElement.scrollWidth<=innerWidth'),(width,theme,'horizontal overflow')
     form=page.locator('#initialsForm').bounding_box();nav=page.locator('#bottomNav').bounding_box();root=page.locator('#dashboardRoot').bounding_box()
     assert form['x']>=0 and form['x']+form['width']<=width+1,(width,theme,form)
     if width>=1050:assert root['x']>=nav['x']+nav['width'],(width,'sidebar overlap')
     else:assert root['y']+root['height']<=nav['y']+1,(width,'bottom navigation overlap',root,nav)
     assert page.locator('.brand-name').bounding_box()['height']<35,(width,'wrapped brand')
     page.evaluate("() => OR.showPage('repertory')")
     search=page.locator('#searchWrap').bounding_box();assert search['width']>140,(width,'compressed search')
     if width in [412,1366] and theme=='light':page.screenshot(path=str(ROOT/f'.private/responsive-{width}.png'))
   page.set_viewport_size({'width':360,'height':800});page.goto('http://127.0.0.1:4458/account')
   # Synthetic members exercise long-email wrapping and compact card actions.
   page.evaluate("""async()=>{for(const email of ['long-account-name-for-layout-testing@example.invalid','second-test@example.invalid'])await fetch('/api/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'test-only-member-password'})})}""")
   page.locator('#refresh').click();expect(page.locator('#accounts li')).to_have_count(2)
   assert page.evaluate('() => document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(ROOT/'.private/account-mobile.png'),full_page=True)
   # Delay the initial repertory: keep the complete loading surface, never a partial header.
   page.route('**/data/kent_english_oorep.json.gz',lambda route:(time.sleep(1),route.continue_()))
   page.goto('http://127.0.0.1:4458/workspace/');page.locator('#bootContinue').click()
   expect(page.locator('#workspaceBoot')).to_be_visible();expect(page.locator('#toolbar')).to_be_hidden()
   expect(page.locator('#workspaceBoot')).to_have_count(0,timeout=30000)
   assert not errors,errors
   print('Responsive PASS: six viewport sizes, light/dark, no rail overlap, compact accounts, privacy gate and slow-start cover; no JS errors.')
   browser.close()
 finally:
  server.terminate();server.wait(timeout=10)
