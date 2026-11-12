import { randomBytes, scrypt, timingSafeEqual, createHash, verify } from 'node:crypto';
import { promisify } from 'node:util';
import { MIGRATION_PUBLIC_KEY } from './migration-public-key.mjs';

const deriveKey = promisify(scrypt);
const hash = text => createHash('sha256').update(text).digest('hex');
const cookieName = '__Host-or_session';
const cookie = (value, age) => `${cookieName}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${age}`;
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000',
};
function reply(status, value, extra = {}) {
  return new Response(JSON.stringify(value), {status, headers: {...headers, 'Content-Type': 'application/json', ...extra}});
}
export async function password(text) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + (await deriveKey(text, salt, 64)).toString('hex');
}
export async function validPassword(text, stored) {
  const [salt, value] = stored.split(':');
  return timingSafeEqual(await deriveKey(text, salt, 64), Buffer.from(value, 'hex'));
}
async function boundedBody(req, limit) {
  const reader = req.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let length = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) { await reader.cancel(); throw Error('Request too large'); }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString('utf8');
}
async function allowedAttempt(db, key, maximum, now) {
  const until = now + 300000;
  const row = await db.prepare(`INSERT INTO rate_limits(key,count,until) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.until<=? THEN 1 ELSE rate_limits.count+1 END,
    until=CASE WHEN rate_limits.until<=? THEN excluded.until ELSE rate_limits.until END RETURNING count`).bind(key, until, now, now).first();
  return row.count <= maximum;
}
export function validateImport(body) {
  if (!Array.isArray(body.users) || !body.users.length || body.users.length > 500) throw Error('Invalid import');
  const ids = new Set(), emails = new Set();
  for (const user of body.users) {
    if (!/^[a-f0-9]{32}$/.test(user.id) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) || user.email.length > 254 ||
        !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(user.password) || !['member','owner'].includes(user.role) ||
        !['pending','approved','rejected','revoked'].includes(user.status) || ids.has(user.id) || emails.has(user.email)) throw Error('Invalid account record');
    if (user.role === 'owner' && user.status !== 'approved') throw Error('Invalid owner');
    ids.add(user.id); emails.add(user.email);
  }
  if (body.users.filter(user => user.role === 'owner').length !== 1) throw Error('Exactly one owner required');
}
async function migrate(req, env) {
  // Short-lived signed import, disabled permanently by the atomic completion marker.
  if (await env.DB.prepare("SELECT value FROM metadata WHERE key='migration-complete'").first()) return reply(410, {error:'Migration is closed'});
  const raw = await boundedBody(req, 262144);
  const signature = req.headers.get('X-Similora-Migration') || '';
  if (signature.length > 1024 || !verify('RSA-SHA256', Buffer.from(raw), MIGRATION_PUBLIC_KEY, Buffer.from(signature,'base64'))) return reply(403, {error:'Invalid migration authorization'});
  const body = JSON.parse(raw);
  if (Math.abs(Date.now() - body.timestamp) > 120000) return reply(403, {error:'Migration request expired'});
  if (body.operation === 'probe') {
    const encoded = await password('synthetic-free-tier-security-probe');
    return reply(200, {passwordRoundtrip: await validPassword('synthetic-free-tier-security-probe', encoded)});
  }
  if (body.operation !== 'import') return reply(400, {error:'Invalid operation'});
  validateImport(body);
  if (await env.DB.prepare('SELECT id FROM users LIMIT 1').first()) return reply(409, {error:'Existing accounts must not be overwritten'});
  const statements = [env.DB.prepare("INSERT INTO metadata(key,value) VALUES ('migration-complete',?)").bind(String(Date.now()))];
  for (let offset = 0; offset < body.users.length; offset += 20) {
    const group = body.users.slice(offset, offset + 20);
    statements.push(env.DB.prepare('INSERT INTO users(id,email,password,role,status) VALUES '+group.map(() => '(?,?,?,?,?)').join(','))
      .bind(...group.flatMap(user => [user.id,user.email,user.password,user.role,user.status])));
  }
  await env.DB.batch(statements);
  return reply(200, {imported:body.users.length,sealed:true});
}
async function serveAsset(req, env, path, account) {
  const assetUrl = new URL(req.url); assetUrl.pathname = path; assetUrl.search = '';
  const source = await env.ASSETS.fetch(new Request(assetUrl));
  if (source.status !== 200) return reply(404, {error:'Not found'});
  const h = new Headers(source.headers);
  for (const [key,value] of Object.entries(headers)) h.set(key,value);
  h.delete('ETag'); h.delete('Last-Modified');
  if (['/login','/account','/'].includes(new URL(req.url).pathname)) h.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  if (account && ['/workspace/js/platform.js','/workspace/js/case-policy.js'].includes(path)) {
    h.delete('Content-Length'); h.delete('Content-Encoding');
    return new Response((await source.text()).replaceAll('SIMILORA_ACCOUNT_PLACEHOLDER', account), {headers:h});
  }
  return new Response(source.body, {headers:h});
}
export default {
  async fetch(req, env, ctx) {
    try {
      const url = new URL(req.url), now = Date.now();
      if (req.method === 'POST' && url.pathname === '/__migration') return await migrate(req, env);
      if (req.method === 'GET' && url.pathname === '/healthz') {
        const ready = !!await env.DB.prepare("SELECT value FROM metadata WHERE key='migration-complete'").first();
        return reply(ready ? 200 : 503, {service:ready?'ready':'awaiting account migration',clinicalReady:ready});
      }
      const token = (req.headers.get('Cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(cookieName+'='))?.slice(cookieName.length+1);
      const user = token && /^[a-f0-9]{64}$/.test(token) ? await env.DB.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?').bind(hash(token),now).first() : null;
      if (req.method === 'POST') {
        if (req.headers.get('Origin') !== url.origin || req.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return reply(403,{error:'Invalid request origin or content type'});
        const body = JSON.parse(await boundedBody(req,16384) || '{}');
        if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(400,{error:'Expected a JSON object'});
        if (['/api/signup','/api/login'].includes(url.pathname)) {
          if (!await env.DB.prepare("SELECT value FROM metadata WHERE key='migration-complete'").first()) return reply(503,{error:'Account migration is being completed. Please retry shortly.'});
          const email = String(body.email || '').trim().toLowerCase(), pw = String(body.password || '');
          if (!await allowedAttempt(env.DB,'account:'+hash(email),20,now) || !await allowedAttempt(env.DB,'peer:'+hash(req.headers.get('CF-Connecting-IP') || 'unknown'),200,now)) return reply(429,{error:'Too many attempts. Please wait five minutes and retry.'},{'Retry-After':'300'});
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || pw.length<12 || pw.length>256) return reply(400,{error:'Use a valid email and a password of 12–256 characters'});
          if (url.pathname === '/api/signup') {
            if (await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first()) return reply(400,{error:'Cannot create this account'});
            await env.DB.prepare('INSERT INTO users VALUES (?,?,?,?,?)').bind(randomBytes(16).toString('hex'),email,await password(pw),'member','pending').run();
            return reply(201,{message:'Account created. Sign in to view approval status.'});
          }
          const account = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
          if (!await validPassword(pw,account?.password || '0'.repeat(32)+':'+'0'.repeat(128)) || !account) return reply(401,{error:'Invalid email or password'});
          const fresh = randomBytes(32).toString('hex'), lifetime = body.remember === true ? 30*86400 : 8*3600;
          await env.DB.batch([
            env.DB.prepare('DELETE FROM sessions WHERE hash=?').bind(hash(token || '')),
            env.DB.prepare('INSERT INTO sessions VALUES (?,?,?)').bind(hash(fresh),account.id,now+lifetime*1000),
          ]);
          return reply(200,{status:account.status,role:account.role},{'Set-Cookie':cookie(fresh,lifetime)});
        }
        if (!user) return reply(401,{error:'Sign in required'});
        if (url.pathname === '/api/logout') {
          await env.DB.prepare('DELETE FROM sessions WHERE hash=?').bind(hash(token)).run();
          return reply(200,{ok:true},{'Set-Cookie':cookie('',0)});
        }
        if (url.pathname === '/api/password') {
          if (!await allowedAttempt(env.DB,'password:'+user.id,10,now)) return reply(429,{error:'Too many attempts. Please retry in five minutes.'},{'Retry-After':'300'});
          const pw = String(body.newPassword || '');
          if (pw.length<12 || pw.length>256 || String(body.currentPassword || '').length>256) return reply(400,{error:'Use a new password of 12–256 characters'});
          if (!await validPassword(String(body.currentPassword || ''),user.password)) return reply(403,{error:'Current password is incorrect'});
          await env.DB.batch([
            env.DB.prepare('UPDATE users SET password=? WHERE id=?').bind(await password(pw),user.id),
            env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND hash!=?').bind(user.id,hash(token)),
          ]);
          return reply(200,{message:'Password changed. Other sessions have been signed out.'});
        }
        if (['/api/decision','/api/remove-account'].includes(url.pathname)) {
          if (user.role!=='owner' || user.status!=='approved') return reply(403,{error:'Owner access required'});
          const member = await env.DB.prepare("SELECT id,status FROM users WHERE id=? AND role='member'").bind(String(body.id)).first();
          if (!member) return reply(404,{error:'Member not found'});
          if (url.pathname === '/api/decision') {
            if (!['approved','rejected','revoked'].includes(body.status)) return reply(400,{error:'Invalid decision'});
            await env.DB.batch([
              env.DB.prepare("UPDATE users SET status=? WHERE id=? AND role='member'").bind(body.status,member.id),
              env.DB.prepare('INSERT INTO access_audit VALUES (?,?,?,?)').bind(user.id,member.id,body.status,now),
            ]);
            return reply(200,{ok:true});
          }
          if (!['rejected','revoked'].includes(member.status)) return reply(409,{error:'Remove access or reject this member before deleting the account'});
          await env.DB.batch([
            env.DB.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE id=? AND role='member' AND status IN ('rejected','revoked'))").bind(member.id),
            env.DB.prepare("INSERT INTO access_audit SELECT ?,id,'deleted',? FROM users WHERE id=? AND role='member' AND status IN ('rejected','revoked')").bind(user.id,now,member.id),
            env.DB.prepare("DELETE FROM users WHERE id=? AND role='member' AND status IN ('rejected','revoked')").bind(member.id),
          ]);
          return reply(200,{message:'Account deleted'});
        }
        return reply(404,{error:'Not found'});
      }
      if (req.method !== 'GET') return reply(405,{error:'Method not allowed'});
      if (url.pathname === '/api/session') return user ? reply(200,{id:user.id,email:user.email,role:user.role,status:user.status}) : reply(401,{error:'Sign in required'});
      if (url.pathname === '/api/accounts') {
        if (user?.role !== 'owner' || user.status !== 'approved') return reply(403,{error:'Owner access required'});
        return reply(200,(await env.DB.prepare("SELECT id,email,status FROM users WHERE role='member' ORDER BY email").all()).results);
      }
      if (url.pathname.startsWith('/workspace/')) {
        const navigation = req.headers.get('Sec-Fetch-Dest') === 'document' || (req.headers.get('Accept') || '').includes('text/html');
        if ((!user || user.status !== 'approved') && navigation) return new Response(null,{status:303,headers:{...headers,Location:user?'/account':'/login'}});
        if (!user) return reply(401,{error:'Sign in required'});
        if (user.status !== 'approved') return reply(403,{error:'Owner approval required'});
        const relative = decodeURIComponent(url.pathname.slice('/workspace/'.length)) || 'index.html';
        if (relative.includes('\\') || relative.includes('\0') || relative.split('/').some(part => ['.','..',''].includes(part))) return reply(400,{error:'Invalid asset path'});
        if (['js/patients.js','js/lifecycle.js','js/recovery.js','js/clinician-tools.js'].includes(relative)) return reply(404,{error:'Unavailable in the initials-only website'});
        return await serveAsset(req,env,'/workspace/'+relative,user.id);
      }
      if (['/','/login','/account'].includes(url.pathname)) return await serveAsset(req,env,'/account.html');
      if (['/similora-launcher.png','/startup.js','/startup.css','/account.js','/account-responsive.css','/similora-mark-v1.png','/google779fa91694e4480f.html'].includes(url.pathname)) return await serveAsset(req,env,url.pathname);
      return reply(404,{error:'Not found'});
    } catch (_) { return reply(400,{error:'Request could not be completed'}); }
  },
  async scheduled(event, env) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()),
      env.DB.prepare('DELETE FROM rate_limits WHERE until<?').bind(Date.now()),
    ]);
  },
};
