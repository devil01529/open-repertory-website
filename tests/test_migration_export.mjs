import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,privateDecrypt,createDecipheriv,constants} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {Readable} from 'node:stream';
import {migrationExport} from '../standalone/migration-export.mjs';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE users(id,email,password,role,status)');db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run('a'.repeat(32),'synthetic@example.invalid','synthetic-hash','owner','approved');
async function run(body,signed=true,key=publicKey){const raw=JSON.stringify(body);const req=Readable.from([raw]);req.method='POST';req.headers={'x-similora-migration':signed?sign('RSA-SHA256',Buffer.from(raw),privateKey).toString('base64'):''};let status,response;const res={writeHead(s){status=s},end(b){response=JSON.parse(b)}};await migrationExport(req,res,db,key);return{status,response}}
const payload={operation:'export-accounts',timestamp:Date.now(),nonce:'a'.repeat(64)};
assert.equal((await run(payload,false)).status,403);assert.equal((await run(payload,true,null)).status,404);
const result=await run(payload);assert.equal(result.status,200);assert.ok(!JSON.stringify(result.response).includes('synthetic'));
const blob=result.response,key=privateDecrypt({key:privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(blob.key,'base64'));
const cipher=createDecipheriv('aes-256-gcm',key,Buffer.from(blob.iv,'base64'));cipher.setAuthTag(Buffer.from(blob.tag,'base64'));
const data=JSON.parse(Buffer.concat([cipher.update(Buffer.from(blob.ciphertext,'base64')),cipher.final()]));assert.equal(data.users[0].id,'a'.repeat(32));
assert.equal((await run(payload)).status,403);assert.equal((await run({...payload,nonce:'b'.repeat(64),timestamp:0})).status,403);
db.close();console.log('PASS signed, encrypted migration export; disabled, unsigned, expired and replayed requests denied');
