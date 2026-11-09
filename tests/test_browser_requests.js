const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
(async () => {
  let user = { id: 'account-1', name: 'Test clinician', email: 'test@example.invalid' };
  let existing = null;
  let created = null;
  const storage = new Map();
  const source = fs.readFileSync('apper-integration/src/services/websiteAccess.js', 'utf8')
    .replace(/import[\s\S]*?from "[^"]+";/g, '').replace(/export /g, '');
  const context = {
    crypto: webcrypto,
    localStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v) },
    identity: () => user,
    validDevice: v => /^[a-f0-9]{64}$/.test(v),
    validRequest: r => r.Owner === user.id && r.account_id_c === user.id,
    ownRequest: async () => existing,
    written: r => r.data[0],
    grantsFor: async () => [],
    selectGrant: () => null,
    sdk: { table: () => ({ create: async row => { created = row; return { data: [row] }; } }) },
  };
  vm.createContext(context);
  vm.runInContext(source + '\nglobalThis.api={browserId,requestWebsiteAccess,websiteStatus};', context);
  const id = context.api.browserId();
  assert.match(id, /^[a-f0-9]{64}$/);
  assert.equal(id, context.api.browserId());
  await context.api.requestWebsiteAccess();
  assert.equal(created.platform_c, 'Website');
  assert.equal(created.account_id_c, user.id);
  assert.equal(created.device_id_c, id);
  existing = { Owner: user.id, account_id_c: user.id, platform_c: 'Android' };
  await assert.rejects(context.api.requestWebsiteAccess(), /another access type/);
  await assert.rejects(context.api.websiteStatus(), /not a valid website/);
  user = { ...user, id: 'account-2' };
  assert.notEqual(context.api.browserId(), id);
  user = null;
  await assert.rejects(context.api.requestWebsiteAccess(), /Sign in/);
  console.log('Browser request identity, type-separation and persistence checks passed.');
})().catch(e => { console.error(e); process.exit(1); });
