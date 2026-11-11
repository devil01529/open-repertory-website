"""Provision only the intended free Workers/D1 resources using the workflow secret."""
import json,os,sys,urllib.request,urllib.error
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from check_cloudflare_connection import select_account

token=os.environ['CLOUDFLARE_API_TOKEN']
def call(path, method='GET', body=None, missing=False):
    req=urllib.request.Request('https://api.cloudflare.com/client/v4'+path,method=method,
      headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req,timeout=60) as res: data=json.load(res)
    except urllib.error.HTTPError as error:
        if missing and error.code==404:return None
        raise SystemExit(f'Cloudflare {method} {path} returned HTTP {error.code}; no credentials logged')
    if not data.get('success'):raise SystemExit('Cloudflare operation failed; inspect permissions and service status')
    return data.get('result')

account=select_account(call('/accounts?per_page=50'),os.environ.get('CLOUDFLARE_ACCOUNT_ID') or None)
base='/accounts/'+account
databases=call(base+'/d1/database?per_page=100')
matches=[d for d in databases if d['name']=='similora-accounts']
if len(matches)>1:raise SystemExit('Ambiguous database identity')
database=matches[0] if matches else call(base+'/d1/database','POST',{'name':'similora-accounts'})
subdomain=call(base+'/workers/subdomain',missing=True)
if not subdomain or not subdomain.get('subdomain'):
    subdomain=call(base+'/workers/subdomain','PUT',{'subdomain':'similora-'+account[:10]})
config={'name':'similora','main':'worker.mjs','compatibility_date':'2026-11-10','account_id':account,
  'workers_dev':True,'assets':{'directory':'.build/assets','binding':'ASSETS','run_worker_first':True},
  'd1_databases':[{'binding':'DB','database_name':'similora-accounts','database_id':database['uuid']}],
  'triggers':{'crons':['17 3 * * *']},'observability':{'enabled':False}}
Path('cloudflare/wrangler.generated.json').write_text(json.dumps(config,indent=2)+'\n')
url='https://similora.'+subdomain['subdomain']+'.workers.dev'
Path('cloudflare/.build/deployment.json').write_text(json.dumps({'url':url,'accountId':account,'databaseId':database['uuid']})+'\n')
print('Free-tier deployment target:',url)
print('No billing plan change or custom domain purchase requested.')
