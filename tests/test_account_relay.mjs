import assert from 'node:assert/strict';import {Readable} from 'node:stream';import {relayAccount,ACCOUNT_ORIGIN} from '../standalone/account-relay.mjs';
const base=new URL('https://old.example');
async function run(method,origin,text,remote){let status,body,headers={};const req=Readable.from([text]);Object.assign(req,{method,url:'/api/decision',headers:{origin,'content-type':'application/json',cookie:'__Host-or_session=fixture'}});const res={setHeader:(k,v)=>headers[k]=v,writeHead:(s,h)=>{status=s;Object.assign(headers,h)},end:b=>body=b};await relayAccount(req,res,base,remote);return {status,body,headers};}
let called=false;const remote=async(url,options)=>{called=true;assert.equal(url,ACCOUNT_ORIGIN+'/api/decision');assert.equal(options.headers.Origin,ACCOUNT_ORIGIN);assert.equal(options.headers.Cookie,'__Host-or_session=fixture');assert.equal(options.redirect,'manual');return new Response('{"ok":true}',{headers:{'Set-Cookie':'__Host-or_session=new; Secure; HttpOnly; Path=/'}})};
assert.equal((await run('POST','https://attacker.example','{}',remote)).status,403);assert.equal(called,false);
assert.equal((await run('POST',base.origin,'x'.repeat(16385),remote)).status,413);assert.equal(called,false);
const result=await run('POST',base.origin,'{}',remote);assert.equal(result.status,200);assert.equal(result.headers['Set-Cookie'].length,1);
assert.equal((await run('POST',base.origin,'{}',async()=>new Response(null,{status:302,headers:{location:'https://evil.example'}}))).status,502);
assert.equal((await run('POST',base.origin,'{}',async()=>{throw Error('offline')})).status,503);
console.log('PASS compatibility relay: trusted target, CSRF, bounded body, secure cookies, redirect denial and failure handling');
