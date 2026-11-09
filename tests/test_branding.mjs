import assert from 'node:assert/strict';
import {brandAsset} from '../standalone/branding.mjs';
assert.match(brandAsset('index.html','<title>Open Repertory — Repertory, Cases &amp; Patients</title><img src="img/brandmark.png">'),/Similora — Clinical workspace/);
assert.match(brandAsset('index.html','img/brandmark.png'),/\/similora-mark-v1.png/);
assert.equal(brandAsset('data/book.json','Open Repertory'), 'Open Repertory');
assert.equal(brandAsset('NOTICE.txt','Open Repertory'), 'Open Repertory');
assert.equal(brandAsset('js/platform.js','Open Repertory report openrepertory_browser_store_v2 ORBK2'), 'Similora report openrepertory_browser_store_v2 ORBK2');
assert.equal(brandAsset('js/app.js','Open Repertory source Original authors Kent'), 'Similora source Original authors Kent');
console.log('Branding checks passed: presentation changed, data/notices/storage identity preserved.');
