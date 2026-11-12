import {readFile,writeFile,mkdir,cp,rm,readdir} from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {adaptAsset} from '../standalone/clinical-assets.mjs';
import {brandAsset,brandedAssets} from '../standalone/branding.mjs';

const root = new URL('../',import.meta.url).pathname;
const out = path.join(root,'cloudflare/.build/assets');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
await cp(path.join(root,'cloudflare/.build/baseline'),out+'/workspace',{recursive:true});
async function compress(dir) {
  for(const item of await readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,item.name);
    if(item.isDirectory()) await compress(file);
    else if(file.endsWith('.json')) {await writeFile(file+'.gz',gzipSync(await readFile(file)));await rm(file);}
  }
}
await compress(out+'/workspace/data');
const web=out+'/workspace';
await cp(root+'website/glass-web.css',web+'/css/glass-web.css');
for(const file of ['data-fetch.js','web-controls.js']) await cp(root+'website/'+file,web+'/js/'+file);
let html=await readFile(web+'/index.html','utf8');
html=html.replace('</head>','<link rel="stylesheet" href="css/glass-web.css"></head>')
  .replace('<script src="js/compat.js">','<script src="js/data-fetch.js"></script><script src="js/compat.js">')
  .replace('</body>','<script src="js/web-controls.js"></script></body>');
await writeFile(web+'/index.html',html);
const changed=new Set([...brandedAssets,'js/start.js']);
for(const file of changed) {
  let text=await readFile(web+'/'+file,'utf8');
  if(['index.html','js/platform.js','js/app.js','js/clinical-ui.js','js/start.js'].includes(file)) text=adaptAsset(file,text,'0'.repeat(32));
  text=brandAsset(file,text);
  if(file==='js/platform.js') text=text.replace('or_initials_v1_'+'0'.repeat(32),'or_initials_v1_SIMILORA_ACCOUNT_PLACEHOLDER');
  await writeFile(web+'/'+file,text);
}
for(const file of ['patients','lifecycle','recovery','clinician-tools']) await rm(web+'/js/'+file+'.js');
for(const file of ['boot.js','web-motion.js','case-policy.js','initials-workspace.js']) {
  let text=await readFile(root+'standalone/'+file,'utf8');
  if(file==='case-policy.js') text='window.ORWebsiteAccount = "SIMILORA_ACCOUNT_PLACEHOLDER";\n'+text;
  await writeFile(web+'/js/'+file,text);
}
for(const file of ['responsive-workspace.css','initials-workspace.css']) await cp(root+'standalone/'+file,web+'/css/'+file);
await writeFile(web+'/js/web-controls.js','window.ORStandalone = true;\n'+await readFile(root+'website/web-controls.js','utf8'));
await writeFile(web+'/js/search-worker.js','importScripts("data-fetch.js");\n'+await readFile(web+'/js/search-worker.js','utf8'));
let glass=await readFile(web+'/js/glass-ui.js','utf8');
glass=glass.replace('return !reduced.matches && body.dataset.motion !== "reduced" && !document.hidden;','return false; // Reduce stacked web animations.');
await writeFile(web+'/js/glass-ui.js',glass);
await writeFile(web+'/css/glass-web.css',(await readFile(web+'/css/glass-web.css','utf8'))+'\n#menuUpdates,#menuOnlineAi{display:none!important}\n');
for(const file of ['startup.js','startup.css','account.html','account.js','account-responsive.css','similora-mark-v1.png','google779fa91694e4480f.html']) await cp(root+'standalone/'+file,out+'/'+file);
console.log('Prepared protected clinical assets and shared account interface');

await cp(root+'standalone/similora-mark-v1.png',web+'/img/brandmark.png');
