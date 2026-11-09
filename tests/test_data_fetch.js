const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { gzipSync } = require('node:zlib');
(async () => {
  const payload = '{"remedies":[{"r":"Acon.","g":4}]}';
  let status = 200;
  let called;
  const context = {
    Request, Response, URL, DecompressionStream,
    location: { origin: 'https://clinical.example' },
    fetch: async (url) => {
      called = url;
      return new Response(status === 200 ? gzipSync(payload) : 'Denied', { status });
    }
  };
  vm.runInNewContext(fs.readFileSync('website/data-fetch.js', 'utf8'), context);
  const decoded = await context.fetch('https://clinical.example/data/book.json');
  assert.equal(await decoded.text(), payload);
  assert.equal(called, 'https://clinical.example/data/book.json.gz');
  status = 403;
  const denied = await context.fetch('https://clinical.example/data/book.json');
  assert.equal(denied.status, 403);
  await context.fetch('https://external.example/data/book.json');
  assert.equal(called, 'https://external.example/data/book.json');
  console.log('Compressed clinical fetch checks passed, including denied responses.');
})().catch(e => { console.error(e); process.exit(1); });
