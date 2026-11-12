from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root/'cloudflare/.build/assets')));Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(390,844),(1366,768)]:
  page=b.new_page(viewport={'width':w,'height':h});page.route('**/account.js',lambda r:r.fulfill(body='',content_type='text/javascript'));page.goto(url+'/account.html')
  page.evaluate('void SimiloraStartup.finish()');page.wait_for_function('()=>document.querySelector("video").currentTime>1')
  assert page.locator('#accountStartup').is_visible();assert page.locator('video').evaluate('(v)=>!v.loop && v.muted')
  page.wait_for_function('()=>!document.querySelector("#accountStartup")',timeout=20000)
  page.close()
 page=b.new_page();page.route('**/account.js',lambda r:r.fulfill(body='',content_type='text/javascript'));page.goto(url+'/account.html');page.wait_for_function('()=>document.querySelector("#accountStartup").classList.contains("intro-ended")',timeout=20000);assert page.locator('#accountStartup').is_visible();assert page.get_by_text('Loading Similora…').is_visible();page.evaluate('void SimiloraStartup.finish()');page.locator('#accountStartup').wait_for(state='detached');page.close()
 page=b.new_page(reduced_motion='reduce');page.route('**/account.js',lambda r:r.fulfill(body='',content_type='text/javascript'));page.goto(url+'/account.html');page.evaluate('void SimiloraStartup.finish()');page.locator('#accountStartup').wait_for(state='detached');page.close()
 b.close()
server.shutdown();print('PASS complete one-shot playback before fast-ready reveal, slow-loading screen after completion, desktop/mobile and reduced-motion fallback')
