import http from 'node:http';
import { assetBootstrap } from './bootstrap.mjs';
import { adaptAsset } from './clinical-assets.mjs';
import { promisify } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const deriveKey = promisify(scrypt);

export async function createApp(config) {
  const base = new URL(config.origin);
  if (base.protocol !== 'https:' && base.hostname !== '127.0.0.1') throw Error('HTTPS origin required');
  const assets = await assetBootstrap(config);
  await mkdir(path.dirname(config.database), { recursive: true });
  const db = new DatabaseSync(config.database);
  db.exec("PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE,password TEXT,role TEXT,status TEXT); CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT,expires INTEGER);");
  const hash = token => createHash('sha256').update(token).digest('hex');
  const password = async text => {
    const salt = randomBytes(16).toString('hex');
    return salt + ':' + (await deriveKey(text, salt, 64)).toString('hex');
  };
  const validPassword = async (text, stored) => {
    const [salt, value] = stored.split(':');
    return timingSafeEqual(await deriveKey(text, salt, 64), Buffer.from(value, 'hex'));
  };
  if (config.ownerEmail && config.ownerPassword) {
    if (config.ownerPassword.length < 16) throw Error('Owner password must have at least 16 characters');
    const email = config.ownerEmail.trim().toLowerCase();
    const owner = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!owner) db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(randomBytes(16).toString('hex'), email, await password(config.ownerPassword), 'owner', 'approved');
    else if (owner.role !== 'owner') throw Error('Configured owner email already belongs to a member');
  }
  if (!db.prepare("SELECT id FROM users WHERE role='owner'").get()) throw Error('Configure owner credentials securely before startup');
  db.exec('CREATE TABLE IF NOT EXISTS access_audit(actor TEXT, member TEXT, status TEXT, at INTEGER)');
  const attempts = new Map();
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    const send = (status, body) => {
      res.writeHead(status, {'Content-Type':'application/json'});
      res.end(JSON.stringify(body));
    };
    try {
      const url = new URL(req.url, base);
      if (base.protocol === 'https:') res.setHeader('Strict-Transport-Security','max-age=31536000');
      if (req.method === 'GET' && url.pathname === '/healthz') return send(200,{service:'ready',clinicalReady:assets.ready()});
      if (req.method === 'POST' && url.pathname === '/_bootstrap/clinical') return await assets.upload(req,res);
      if (!assets.ready()) return send(503,{error:'Website preparation is in progress. Please retry shortly.'});
      const cookieName = base.protocol === 'https:' ? '__Host-or_session' : 'or_dev_session';
      const token = (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
      const user = token ? db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?').get(hash(token),Date.now()) : null;
      const cookie = (value,age) => cookieName+'='+value+'; HttpOnly; SameSite=Lax; Path=/; Max-Age='+age+(base.protocol==='https:'?'; Secure':'');
      if (req.method === 'POST') {
        if (req.headers.origin !== base.origin || req.headers['content-type']?.split(';')[0] !== 'application/json') return send(403,{error:'Invalid request origin or content type'});
        let raw = '';
        for await (const part of req) {
          raw += part;
          if (Buffer.byteLength(raw)>16384) return send(413,{error:'Request too large'});
        }
        const body = JSON.parse(raw || '{}');
        if (url.pathname === '/api/signup' || url.pathname === '/api/login') {
          const key = req.socket.remoteAddress;
          const now = Date.now();
          for (const [k,v] of attempts) if (v.until<now) attempts.delete(k);
          const rate = attempts.get(key) || {count:0,until:now+300000};
          if (++rate.count>20) return send(429,{error:'Too many attempts. Try again later.'});
          attempts.set(key,rate);
          const email = String(body.email||'').trim().toLowerCase();
          const pw = String(body.password||'');
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || pw.length<12 || pw.length>256) return send(400,{error:'Use a valid email and a password of 12–256 characters'});
          if (url.pathname === '/api/signup') {
            if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return send(400,{error:'Cannot create this account'});
            db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(randomBytes(16).toString('hex'),email,await password(pw),'member','pending');
            return send(201,{message:'Account created. Sign in to view approval status.'});
          }
          const account = db.prepare('SELECT * FROM users WHERE email=?').get(email);
          const dummy = '00000000000000000000000000000000:'+ '00'.repeat(64);
          if (!await validPassword(pw,account?.password || dummy) || !account) return send(401,{error:'Invalid email or password'});
          if (token) db.prepare('DELETE FROM sessions WHERE hash=?').run(hash(token));
          db.prepare('DELETE FROM sessions WHERE expires<?').run(now);
          const fresh = randomBytes(32).toString('hex');
          // Explicit opt-in for a private device; server approval is still checked on every request.
          const lifetime = body.remember === true ? 30*24*3600 : 8*3600;
          db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(fresh),account.id,now+lifetime*1000);
          res.setHeader('Set-Cookie',cookie(fresh,lifetime));
          return send(200,{status:account.status,role:account.role});
        }
        if (!user) return send(401,{error:'Sign in required'});
        if (url.pathname === '/api/logout') {
          db.prepare('DELETE FROM sessions WHERE hash=?').run(hash(token));
          res.setHeader('Set-Cookie',cookie('',0));
          return send(200,{ok:true});
        }
        if (url.pathname === '/api/password') {
          const pw = String(body.newPassword || '');
          if (pw.length < 12 || pw.length > 256 || String(body.currentPassword||'').length>256) return send(400,{error:'Use a new password of 12–256 characters'});
          if (!await validPassword(String(body.currentPassword||''),user.password)) return send(403,{error:'Current password is incorrect'});
          db.prepare('UPDATE users SET password=? WHERE id=?').run(await password(pw),user.id);
          db.prepare('DELETE FROM sessions WHERE user_id=? AND hash!=?').run(user.id,hash(token));
          return send(200,{message:'Password changed. Other sessions have been signed out.'});
        }
        if (url.pathname === '/api/remove-account') {
          if (user.role!=='owner' || user.status!=='approved') return send(403,{error:'Owner access required'});
          const member=db.prepare("SELECT id FROM users WHERE id=? AND role='member' AND status IN ('rejected','revoked')").get(String(body.id));
          if (!member) return send(409,{error:'Remove access or reject this member before deleting the account'});
          db.exec('BEGIN IMMEDIATE');
          try {
            db.prepare('DELETE FROM sessions WHERE user_id=?').run(member.id);
            db.prepare('DELETE FROM users WHERE id=?').run(member.id);
            db.prepare('INSERT INTO access_audit VALUES (?,?,?,?)').run(user.id,member.id,'deleted',Date.now());
            db.exec('COMMIT');
          } catch(error) {db.exec('ROLLBACK');throw error}
          return send(200,{message:'Account deleted'});
        }
        if (url.pathname === '/api/decision') {
          if (user.role!=='owner' || user.status!=='approved') return send(403,{error:'Owner access required'});
          if (!['approved','rejected','revoked'].includes(body.status)) return send(400,{error:'Invalid decision'});
          const result = db.prepare("UPDATE users SET status=? WHERE id=? AND role='member'").run(body.status,String(body.id));
          if (result.changes) db.prepare('INSERT INTO access_audit VALUES (?,?,?,?)').run(user.id,String(body.id),body.status,Date.now());
          return send(result.changes?200:404,{ok:!!result.changes});
        }
        return send(404,{error:'Not found'});
      }
      if (req.method !== 'GET') return send(405,{error:'Method not allowed'});
      if (url.pathname === '/api/session') return user ? send(200,{id:user.id,email:user.email,role:user.role,status:user.status}) : send(401,{error:'Sign in required'});
      if (url.pathname === '/api/accounts') {
        if (user?.role!=='owner' || user.status!=='approved') return send(403,{error:'Owner access required'});
        return send(200,db.prepare("SELECT id,email,status FROM users WHERE role='member' ORDER BY email").all());
      }
      if (url.pathname.startsWith('/workspace/')) {
        const navigation=req.headers['sec-fetch-dest']==='document' || (req.headers.accept||'').includes('text/html');
        if ((!user || user.status!=='approved') && navigation) {res.writeHead(303,{Location:user?'/account':'/login'});return res.end()}
        if (!user) return send(401,{error:'Sign in required'});
        if (user.status!=='approved') return send(403,{error:'Owner approval required'});
        const relative = decodeURIComponent(url.pathname.slice('/workspace/'.length)) || 'index.html';
        const root = path.resolve(config.assets);
        const target = path.resolve(root,relative);
        if (!target.startsWith(root+path.sep)) return send(403,{error:'Invalid asset path'});
        const privateScripts = ['js/patients.js', 'js/lifecycle.js', 'js/recovery.js', 'js/clinician-tools.js'];
        if (privateScripts.includes(relative)) return send(404,{error:'Unavailable in the initials-only website'});
        const webAssets = {'js/web-motion.js':'web-motion.js','js/case-policy.js':'case-policy.js','js/initials-workspace.js':'initials-workspace.js','css/initials-workspace.css':'initials-workspace.css'};
        if (webAssets[relative]) {
          let content = await readFile(new URL(webAssets[relative],import.meta.url),'utf8');
          if (relative === 'js/case-policy.js') content = 'window.ORWebsiteAccount = '+JSON.stringify(user.id)+';\n'+content;
          res.writeHead(200,{'Content-Type':relative.endsWith('.css')?'text/css':'text/javascript'});
          return res.end(content);
        }
        if (relative === 'js/web-controls.js') {
          res.writeHead(200,{'Content-Type':'text/javascript'});
          const controls = await readFile(new URL('../website/web-controls.js', import.meta.url), 'utf8');
          return res.end("window.ORStandalone = true;\n" + controls);
        }
        const ext = path.extname(target);
        const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.gz':'application/gzip','.json':'application/json','.txt':'text/plain'};
        await stat(target);
        let content = await readFile(target);
        if (['index.html','js/platform.js','js/app.js','js/clinical-ui.js'].includes(relative)) content = adaptAsset(relative, content.toString('utf8'), user.id);
        res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});
        return res.end(content);
      }
      if (['/','/login','/account'].includes(url.pathname)) {
        res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
        res.writeHead(200,{'Content-Type':'text/html'});
        return res.end(await readFile(new URL('./account.html',import.meta.url)));
      }
      if (url.pathname === '/account.js') {
        res.writeHead(200,{'Content-Type':'text/javascript'});
        return res.end(await readFile(new URL('./account.js',import.meta.url)));
      }
      return send(404,{error:'Not found'});
    } catch (e) {
      return send(e.code==='ENOENT'?404:400,{error:'Request could not be completed'});
    }
  });
  server.on('close',()=>db.close());
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await createApp({
    origin:process.env.PUBLIC_ORIGIN,
    database:process.env.DATABASE_PATH || '.private/website.sqlite',
    assets:process.env.CLINICAL_ASSETS || 'dist',
    ownerEmail:process.env.OWNER_EMAIL,
    ownerPassword:process.env.OWNER_PASSWORD,
    bootstrapToken:process.env.ASSET_BOOTSTRAP_TOKEN,
    bootstrapHash:process.env.ASSET_ARCHIVE_SHA256,
  });
  server.listen(Number(process.env.PORT||3000),'0.0.0.0');
}
