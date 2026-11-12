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
 for w,h,theme in [(390,844,'light'),(1366,768,'dark')]:
  page=b.new_page(viewport={'width':w,'height':h},color_scheme=theme);page.route('**/api/session',lambda r:r.fulfill(status=401,json={'error':'Sign in required'}));page.goto(url+'/account.html');page.wait_for_timeout(1200)
  assert page.locator('#accountStartup').is_visible();assert page.locator('video').count()==0
  assert page.locator('.logo-art img').evaluate('(i)=>getComputedStyle(i).backgroundColor==="rgba(0, 0, 0, 0)"')
  page.locator('#accountStartup').wait_for(state='detached',timeout=15000);assert page.locator('#login').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('main').evaluate('(m)=>parseFloat(getComputedStyle(m).borderRadius)>=28')
  page.screenshot(path=str(root/f'.private/glass-login-{w}.png'),full_page=True)
  page.goto(url+'/account.html');page.locator('#accountStartup').wait_for(state='detached',timeout=1500);page.close()
 page=b.new_page(reduced_motion='reduce');page.route('**/api/session',lambda r:r.fulfill(status=401,json={'error':'Sign in required'}));page.goto(url+'/account.html');page.locator('#accountStartup').wait_for(state='detached',timeout=1500);page.close()
 b.close()
server.shutdown();print('PASS logo-only intro, transparent image, full duration, same-tab no replay, reduced motion, rounded glass login, mobile/desktop and light/dark')
