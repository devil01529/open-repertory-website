import {createApp} from '../standalone/server.mjs';
import {mkdtemp,writeFile,mkdir,readFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir=await mkdtemp('/tmp/or-bootstrap-test-');
await mkdir(dir+'/source');await writeFile(dir+'/source/index.html','fixture');
execFileSync('tar',['-czf',dir+'/bundle.tgz','-C',dir+'/source','.']);
const archive=await readFile(dir+'/bundle.tgz'),secret='test-bootstrap-token-'.repeat(4);
const server=await createApp({origin:'http://127.0.0.1',database:dir+'/accounts.sqlite',assets:dir+'/assets',ownerEmail:'owner@example.invalid',ownerPassword:'test-only-password-12345',bootstrapToken:secret,bootstrapHash:createHash('sha256').update(archive).digest('hex')});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
try{
 assert.equal((await fetch(base+'/login')).status,503);
 assert.equal((await (await fetch(base+'/healthz')).json()).clinicalReady,false);
 assert.equal((await fetch(base+'/_bootstrap/clinical',{method:'POST',body:archive})).status,403);
 assert.equal((await fetch(base+'/_bootstrap/clinical',{method:'POST',headers:{Authorization:'Bearer '+secret},body:'wrong archive'})).status,400);
 assert.equal((await fetch(base+'/_bootstrap/clinical',{method:'POST',headers:{Authorization:'Bearer '+secret},body:archive})).status,201);
 assert.equal((await (await fetch(base+'/healthz')).json()).clinicalReady,true);
 assert.equal((await fetch(base+'/_bootstrap/clinical',{method:'POST',headers:{Authorization:'Bearer '+secret},body:archive})).status,404);
 assert.equal((await fetch(base+'/workspace/')).status,401);
 console.log('Private bootstrap: token, checksum, one-time installation and protected assets passed.');
}finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true})}
