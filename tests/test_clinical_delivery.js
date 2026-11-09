const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
async function check(options = {}) {
  let handler;
  let reads = 0;
  let fetches = 0;
  const device = 'a'.repeat(64);
  const request = { Id: 'request', Owner: { Id: 'user' }, account_id_c: 'user', device_id_c: device, platform_c: options.platform || 'Website' };
  const grant = { request_c: { Id: 'request' }, device_id_c: device, status_c: options.status || 'approved', version_c: 1 };
  const context = {
    Response, Uint8Array, Number, String, Set,
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    apper: {
      serve: fn => handler = fn,
      getSecret: async () => options.secret ? 'fixture-only-not-a-real-token' : ''
    },
    sdk: {
      core: { eq: () => ({}), and: () => ({}) },
      table: () => {
        const q = {
          select: () => q, where: () => q, limit: () => q,
          fetch: async () => {
            reads++;
            return { success: true, data: reads === 1 ? (options.denied ? [] : [request]) : options.duplicate ? [grant,grant] : [grant] };
          }
        };
        return q;
      }
    },
    fetch: async () => { fetches++; return new Response('clinical fixture', { headers: { 'Content-Type': 'text/plain' } }); }
  };
  vm.runInNewContext(fs.readFileSync('apper-integration/functions/clinical-asset.js', 'utf8'), context);
  const response = await handler({
    method: options.method || 'POST',
    json: async () => ({ browserId: device, requestId: 'request', path: options.path || 'index.html' })
  });
  return { code: response.status, data: await response.json(), fetches };
}
(async () => {
  for (const status of ['pending','rejected','revoked']) {
    const r = await check({status,secret:true});assert.equal(r.code,403);assert.equal(r.fetches,0);
  }
  assert.equal((await check({platform:'Android',secret:true})).code,403);
  assert.equal((await check({denied:true,secret:true})).code,403);
  assert.equal((await check({duplicate:true,secret:true})).code,403);
  assert.equal((await check({path:'../.env',secret:true})).code,400);
  assert.equal((await check({method:'GET'})).code,405);
  assert.equal((await check()).code,503);
  const ok=await check({secret:true});assert.equal(ok.code,200);assert.equal(ok.fetches,1);
  assert.equal(Buffer.from(ok.data.data.contentBase64,'base64').toString(),'clinical fixture');
  console.log('10 protected delivery scenarios passed (mock runtime; no live credentials).');
})().catch(e=>{console.error(e);process.exit(1)});
