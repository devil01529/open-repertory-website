import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import worker from '../cloudflare/worker.mjs';import {ORIGIN,INDEX_KEY,SCHEMA_JSON} from '../cloudflare/search.mjs';
let reads=0;const env={DB:{prepare(){reads++;throw Error('Public pages must not need accounts')}},ASSETS:{fetch:async request=>{const path=new URL(request.url).pathname;const bytes=await readFile(new URL('../cloudflare/.build/assets'+path,import.meta.url));return new Response(bytes,{headers:{'Content-Type':path.endsWith('.html')?'text/html; charset=utf-8':'text/plain'}})}}};
for(const method of ['GET','HEAD']){
 const home=await worker.fetch(new Request(ORIGIN+'/',{method}),env,{});assert.equal(home.status,200);assert.match(home.headers.get('X-Robots-Tag'),/^index, follow/);const text=await home.text();if(method==='GET'){assert.match(text,/<h1>Similora/);assert.ok(text.includes('rel="canonical" href="'+ORIGIN+'/"'));assert.ok(text.includes(SCHEMA_JSON));}else assert.equal(text,'');
 const robots=await worker.fetch(new Request(ORIGIN+'/robots.txt',{method}),env,{});assert.equal(robots.status,200);if(method==='GET')assert.match(await robots.text(),/Disallow: \/workspace\//);
}
assert.equal(reads,0);const map=await worker.fetch(new Request(ORIGIN+'/sitemap.xml'),env,{});const xml=await map.text();assert.ok(xml.includes('<loc>'+ORIGIN+'/</loc>'));assert.ok(!xml.includes('/account')&&!xml.includes('/workspace/'));
assert.equal(await (await worker.fetch(new Request(ORIGIN+'/'+INDEX_KEY+'.txt'),env,{})).text(),INDEX_KEY);
const account=await readFile(new URL('../standalone/account.html',import.meta.url),'utf8');assert.ok(account.includes('noindex,nofollow,noarchive'));assert.ok(JSON.parse(SCHEMA_JSON)['@graph'].length>=2);
console.log('PASS public crawlability, HEAD, canonical/schema, robots/sitemap, IndexNow proof and account noindex; public routes avoid DB reads');
