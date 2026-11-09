import { createApp } from '../standalone/server.mjs';
import { mkdtemp,writeFile,mkdir,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=await mkdtemp(path.join(tmpdir(),'clinical-test-'));
await mkdir(path.join(dir,'assets'));
await writeFile(path.join(dir,'assets','index.html'),'private clinical fixture');
const origin='http://127.0.0.1:3456';
const server=await createApp({origin,database:path.join(dir,'test.sqlite'),assets:path.join(dir,'assets'),ownerEmail:'owner@example.invalid',ownerPassword:'fixture-owner-password-only'});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
async function call(url,body,cookie,customOrigin=origin){
 return fetch(base+url,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:customOrigin}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
}
try {
 assert.equal((await call('/workspace/')).status,401);
 assert.equal((await call('/api/signup',{email:'member@example.invalid',password:'fixture-member-password'})).status,201);
 const login=await call('/api/login',{email:'member@example.invalid',password:'fixture-member-password'});
 const member=login.headers.get('set-cookie').split(';')[0];
 assert.equal((await call('/workspace/',null,member)).status,403);
 assert.equal((await call('/api/accounts',null,member)).status,403);
 assert.equal((await call('/api/decision',{id:'x',status:'approved'},member)).status,403);
 const ownerLogin=await call('/api/login',{email:'owner@example.invalid',password:'fixture-owner-password-only'});
 const owner=ownerLogin.headers.get('set-cookie').split(';')[0];
 const list=await (await call('/api/accounts',null,owner)).json();
 assert.equal(list.length,1);
 assert.equal((await call('/api/decision',{id:list[0].id,status:'approved'},owner,'https://evil.invalid')).status,403);
 assert.equal((await call('/api/decision',{id:list[0].id,status:'approved'},owner)).status,200);
 assert.equal((await call('/workspace/',null,member)).status,200);
 assert.equal(await (await call('/workspace/',null,member)).text(),'private clinical fixture');
 await call('/api/decision',{id:list[0].id,status:'revoked'},owner);
 assert.equal((await call('/workspace/',null,member)).status,403);
 await call('/api/logout',{},owner);
 assert.equal((await call('/api/accounts',null,owner)).status,403);
 console.log('Standalone signup, pending gate, owner approval, CSRF, revocation and logout checks passed.');
}finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true})}
