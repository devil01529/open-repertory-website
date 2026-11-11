import {verify,randomBytes,createCipheriv,publicEncrypt,constants} from 'node:crypto';

// Temporary, explicitly enabled export. Responses are encrypted to the migration key.
export async function migrationExport(req,res,db,publicKey) {
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  if(!publicKey || req.method!=='POST') return send(404,{error:'Not found'});
  let raw='';
  for await(const part of req){raw+=part;if(Buffer.byteLength(raw)>4096)return send(413,{error:'Too large'});}
  try {
    const signature=req.headers['x-similora-migration'] || '';
    if(signature.length>1024 || !verify('RSA-SHA256',Buffer.from(raw),publicKey,Buffer.from(signature,'base64')))return send(403,{error:'Forbidden'});
    const input=JSON.parse(raw);
    if(input.operation!=='export-accounts' || Math.abs(Date.now()-input.timestamp)>120000 || !/^[a-f0-9]{64}$/.test(input.nonce))return send(403,{error:'Invalid request'});
    db.exec('CREATE TABLE IF NOT EXISTS migration_exports(nonce TEXT PRIMARY KEY,at INTEGER)');
    db.prepare('INSERT INTO migration_exports VALUES (?,?)').run(input.nonce,Date.now());
    const users=db.prepare('SELECT id,email,password,role,status FROM users ORDER BY id').all();
    const key=randomBytes(32),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
    const ciphertext=Buffer.concat([cipher.update(JSON.stringify({users}),'utf8'),cipher.final()]);
    const encryptedKey=publicEncrypt({key:publicKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key);
    return send(200,{key:encryptedKey.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')});
  }catch(_){return send(403,{error:'Export could not be authorized'});}
}
