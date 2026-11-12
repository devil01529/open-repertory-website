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
  page.locator('#password').fill('synthetic-password-only');page.locator('#passwordToggle').click();assert page.locator('#password').get_attribute('type')=='text';page.locator('#passwordToggle').click();assert page.locator('#password').get_attribute('type')=='password';page.locator('#password').fill('')
  page.screenshot(path=str(root/f'.private/glass-login-{w}.png'),full_page=True)
  page.goto(url+'/account.html');page.locator('#accountStartup').wait_for(state='detached',timeout=1500);page.close()
 page=b.new_page(reduced_motion='reduce');page.route('**/api/session',lambda r:r.fulfill(status=401,json={'error':'Sign in required'}));page.goto(url+'/account.html');page.locator('#accountStartup').wait_for(state='detached',timeout=1500);page.close()
 page=b.new_page(reduced_motion='reduce');page.route('**/api/session',lambda r:r.abort());page.goto(url+'/account.html');page.locator('#accountStartup').wait_for(state='detached');page.locator('#retrySession').wait_for(state='visible');page.unroute('**/api/session');page.route('**/api/session',lambda r:r.fulfill(status=401,json={'error':'Sign in required'}));page.locator('#retrySession').click();page.locator('#login').wait_for(state='visible');assert page.locator('#retrySession').is_hidden();page.close()
 # Owner refresh/deletion overlap: the action must wait for refresh, then unlock controls.
 rows=[{'id':'a'*32,'email':'busy-test@example.invalid','status':'revoked'},{'id':'b'*32,'email':'other@example.invalid','status':'pending'}];pending=[];calls=[0]
 page=b.new_page(reduced_motion='reduce');page.route('**/account',lambda r:r.fulfill(body=(root/'standalone/account.html').read_text(),content_type='text/html'));page.route('**/api/session',lambda r:r.fulfill(json={'id':'c'*32,'email':'owner@example.invalid','role':'owner','status':'approved'}))
 def account_route(route):
  calls[0]+=1
  if calls[0]==2:pending.append(route)
  else:route.fulfill(json=rows)
 page.route('**/api/accounts',account_route)
 def remove_route(route):
  rows.pop(0);route.fulfill(json={'message':'Account deleted'})
 page.route('**/api/remove-account',remove_route);page.goto(url+'/account');page.locator('#owner').wait_for(state='visible');page.locator('#accountStartup').wait_for(state='detached');page.locator('#refresh').click()
 from playwright.sync_api import expect
 expect(page.get_by_role('button',name='Delete account',exact=True)).to_be_disabled();assert pending;pending.pop().fulfill(json=rows)
 page.get_by_role('button',name='Delete account',exact=True).click();page.locator('#confirmRemove').click();page.locator('#accounts li').filter(has_text='busy-test@example.invalid').wait_for(state='detached');expect(page.locator('#refresh')).to_be_enabled();expect(page.get_by_role('button',name='Approve',exact=True)).to_be_enabled();page.close()
 b.close()
server.shutdown();print('PASS logo-only intro, transparent image, full duration, same-tab no replay, reduced motion, rounded glass login, mobile/desktop and light/dark')
