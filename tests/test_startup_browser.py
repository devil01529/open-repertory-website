"""Browser checks for startup artwork; no live accounts or clinical records required."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root/'cloudflare/.build/assets')))
Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(390,844),(1366,768)]:
  page=browser.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/account.js',lambda r:r.fulfill(body='',content_type='text/javascript'))
  page.goto(url+'/account.html');page.wait_for_function('()=>document.querySelector("video").currentTime > .1')
  assert page.locator('#accountStartup').is_visible()
  assert page.locator('video').evaluate('(v)=>v.muted && v.playsInline')
  assert page.evaluate('()=>document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(root/f'.private/startup-{width}.png'))
  page.get_by_role('button',name='Skip animation').click();page.locator('#accountStartup').wait_for(state='detached');assert not errors,errors
  page.close()
 page=browser.new_page(reduced_motion='reduce');page.route('**/account.js',lambda r:r.fulfill(body='',content_type='text/javascript'));page.goto(url+'/account.html')
 assert page.locator('video').evaluate('(v)=>v.paused && !v.getAttribute("src")');page.evaluate('SimiloraStartup.finish()');page.locator('#accountStartup').wait_for(state='detached');page.close()
 page=browser.new_page();page.route('**/account.js',lambda r:r.fulfill(body='',content_type='text/javascript'));page.route('**/similora-startup.mp4',lambda r:r.abort());page.goto(url+'/account.html');page.get_by_role('button',name='Skip animation').click();page.locator('#accountStartup').wait_for(state='detached');page.close()
 # Actual boot coordinator: consent is not bypassed; completion and failure release media.
 page=browser.new_page();page.goto(url+'/account.html');page.set_content('<div id="workspaceBoot"><video data-src="'+url+'/similora-startup.mp4" muted loop></video><section><h1 id="bootTitle"></h1><p id="bootMessage"></p><button id="bootContinue">Continue</button><div id="bootSpinner" hidden></div></section></div>')
 page.add_script_tag(url=url+'/startup.js');page.add_script_tag(url=url+'/workspace/js/boot.js');page.evaluate('document.dispatchEvent(new Event("DOMContentLoaded")); window.ran=false; void ORBoot.start(async()=>{window.ran=true; await new Promise(r=>window.complete=r)})')
 assert page.evaluate('window.ran') is False
 page.locator('#bootContinue').click();page.wait_for_function('()=>window.ran');assert page.locator('#workspaceBoot').evaluate('(e)=>e.classList.contains("boot-playing")');page.evaluate('window.complete()');page.locator('#workspaceBoot').wait_for(state='detached');page.close()
 browser.close()
server.shutdown();print('PASS startup video: mobile/desktop playback, muted, no overflow, skip, reduced motion, media failure, consent gate and readiness cleanup')
