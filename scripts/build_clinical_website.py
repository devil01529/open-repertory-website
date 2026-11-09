"""Create a local unpublished Glass web integration from packaged APK assets."""
import argparse,hashlib,json,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def build(source,output):
 source=source.resolve();output=output.resolve()
 if output.exists():raise ValueError('Output already exists')
 if output==ROOT or ROOT in output.parents:
  if output != ROOT/'dist':
   raise ValueError('Only ignored dist may contain clinical build output in this repository')
  ignored=subprocess.run(['git','check-ignore','--quiet','dist/'],cwd=ROOT)
  if ignored.returncode:
   raise ValueError('dist must be gitignored before clinical data is copied')
 shutil.copytree(source,output)
 inventory={}
 for p in sorted((source/'data').rglob('*')):
  if p.is_file():
   relative=p.relative_to(source)
   original=hashlib.sha256(p.read_bytes()).hexdigest()
   copied=hashlib.sha256((output/relative).read_bytes()).hexdigest()
   if copied!=original:raise ValueError('Copied data differs')
   inventory[str(relative)]=original
 shutil.copy2(ROOT/'website/glass-web.css',output/'css/glass-web.css')
 index=output/'index.html'
 text=index.read_text()
 text=text.replace('</head>','<link rel="stylesheet" href="css/glass-web.css">\n</head>')
 index.write_text(text)
 report={'status':'UNPUBLISHED_LOCAL_INTEGRATION_NOT_AUTHENTICATED_HOSTING','data_files':len(inventory),'data_sha256':inventory,'owner_management_embedded':False,'clinical_logic_changed':False,'provider_labels':'Existing display sanitizer retained; legal credits and raw source metadata retained'}
 (output/'WEB_BUILD_INVENTORY.json').write_text(json.dumps(report,indent=2)+'\n')
 return report
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
 r=build(a.source,a.output);print(r['status'],r['data_files'],'data files verified')
