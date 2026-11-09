"""Package website-owned clinical snapshot for owner-private static hosting."""
import gzip,hashlib,json,shutil,tarfile
from pathlib import Path
from build_clinical_website import build,ROOT
output=ROOT/'dist'
if output.exists():shutil.rmtree(output)
report=build(ROOT/'.private/clinical-assets',output)
for p in (output/'data').rglob('*.json'):
 raw=p.read_bytes();packed=gzip.compress(raw,mtime=0)
 if gzip.decompress(packed)!=raw:raise ValueError('Compression changed data')
 p.with_suffix(p.suffix+'.gz').write_bytes(packed);p.unlink()
for name in ['data-fetch.js','web-controls.js']:
 shutil.copy2(ROOT/'website'/name,output/'js'/name)
index=output/'index.html'
html=index.read_text().replace('<script src="js/compat.js">','<script src="js/data-fetch.js"></script>\n  <script src="js/compat.js">')
html=html.replace('</body>','<script src="js/web-controls.js"></script>\n</body>')
index.write_text(html)
glass=output/'js/glass-ui.js'
glass_text=glass.read_text()
old='return !reduced.matches && body.dataset.motion !== "reduced" && !document.hidden;'
if old not in glass_text:raise ValueError('Expected animation guard changed')
glass.write_text(glass_text.replace(old,'return false; // Web: immediate transitions avoid stacking animations.'))
html_path=output/'index.html'
html_text=html_path.read_text().replace('<meta charset="UTF-8">','<meta charset="UTF-8">\\n<meta name="referrer" content="no-referrer">')
html_path.write_text(html_text)
worker=output/'js/search-worker.js'
worker.write_text('importScripts("data-fetch.js");\n'+worker.read_text())
with (output/'css/glass-web.css').open('a') as f:
 f.write('\n#menuUpdates,#menuOnlineAi{display:none!important}\n')
# Require deployment metadata, and never package account credentials or local records.
manifest=json.loads((ROOT/'.openai/hosting.json').read_text())
assert manifest['static']['directory']=='dist'
for p in output.rglob('*'):
 if p.is_file() and p.stat().st_size>24*1024*1024:raise ValueError('Asset too large: '+p.name)
archive=ROOT/'.private/deployment.tar.gz'
with tarfile.open(archive,'w:gz') as tar:
 tar.add(ROOT/'.openai/hosting.json',arcname='.openai/hosting.json')
 tar.add(output,arcname='dist')
print('Packed',report['data_files'],'verified data files;',archive.stat().st_size,'archive bytes')
