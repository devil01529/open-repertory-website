"""Notify IndexNow participants about the public landing page. No private URLs."""
import json,subprocess,urllib.request,urllib.error,urllib.parse,os,argparse
from pathlib import Path
root=Path(__file__).resolve().parents[1];cfg=json.loads((root/'cloudflare/search-config.json').read_text())
a=argparse.ArgumentParser();a.add_argument('--force',action='store_true');args=a.parse_args()
changed=subprocess.check_output(['git','diff-tree','--no-commit-id','--name-only','-r','HEAD'],cwd=root,text=True).splitlines()
public={'standalone/home.html','standalone/home.css','standalone/similora-launcher.png','standalone/similora-mark-v1.png','cloudflare/search.mjs','cloudflare/search-config.json'}
if not args.force and not public.intersection(changed):
 print('No public page change; skipping duplicate IndexNow submission.');raise SystemExit(0)
base=cfg['origin'];key=cfg['indexNowKey'];agent={'User-Agent':'Similora-Search-Submission/1.0','Accept':'application/json,text/plain,*/*'}
for path in ['/', '/robots.txt','/sitemap.xml','/'+key+'.txt']:
 with urllib.request.urlopen(urllib.request.Request(base+path,headers=agent),timeout=30) as response:
  body=response.read().decode();assert response.status==200
  if path=='/':assert '<h1>' in body and 'Similora' in body and 'rel="canonical"' in body
  if path=='/robots.txt':assert 'Sitemap: '+base+'/sitemap.xml' in body
  if path.endswith(key+'.txt'):assert body.strip()==key
payload={'host':urllib.parse.urlsplit(base).netloc,'key':key,'keyLocation':base+'/'+key+'.txt','urlList':[base+'/']}
request=urllib.request.Request('https://api.indexnow.org/indexnow',data=json.dumps(payload).encode(),headers={**agent,'Content-Type':'application/json'},method='POST')
try:
 with urllib.request.urlopen(request,timeout=45) as response:status=response.status
except urllib.error.HTTPError as error:
 raise SystemExit('IndexNow returned HTTP '+str(error.code)+'. Site deployment remains valid; submission needs retry.')
except urllib.error.URLError as error:
 raise SystemExit('IndexNow could not be reached. Site deployment remains valid; submission needs retry: '+str(error.reason))
assert status in (200,202),status
result={'engine':'IndexNow participants','httpStatus':status,'urls':payload['urlList'],'meaning':'Submission accepted; indexing is not guaranteed'}
(root/'cloudflare/.build/search-submission.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
if os.environ.get('GITHUB_STEP_SUMMARY'):
 with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as output:output.write('\n### Search discovery\n\nIndexNow HTTP '+str(status)+' accepted the public homepage URL. Acceptance does not guarantee indexing. Google discovers the sitemap through robots.txt; Search Console requires its owner account authorization.\n')
