// Temporary compatibility for already-installed 2.0.0 APKs during the hosting move.
// No local account writes: Cloudflare remains the sole approval authority.
export const ACCOUNT_ORIGIN='https://similora.similora-167bde6ed1.workers.dev';
export async function relayAccount(req,res,base,remoteFetch=fetch){
 const send=(status,error)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error}));};
 if(!['GET','POST'].includes(req.method))return send(405,'Method not allowed');
 if(req.method==='POST'&&(req.headers.origin!==base.origin||req.headers['content-type']?.split(';')[0]!=='application/json'))return send(403,'Invalid request origin or content type');
 let body='';for await(const part of req){body+=part;if(Buffer.byteLength(body)>16384)return send(413,'Request too large');}
 const headers={'Accept':'application/json','User-Agent':'Similora-Migration-Compatibility/1.0'};
 if(req.headers.cookie)headers.Cookie=req.headers.cookie;
 if(req.method==='POST'){headers.Origin=ACCOUNT_ORIGIN;headers['Content-Type']='application/json';}
 try{
  const upstream=await remoteFetch(ACCOUNT_ORIGIN+new URL(req.url,base).pathname,{method:req.method,headers,body:req.method==='POST'?body:undefined,redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(upstream.status>=300&&upstream.status<400)return send(502,'Account service temporarily unavailable');
  const result=await upstream.text();if(Buffer.byteLength(result)>1048576)return send(502,'Response too large');
  const cookies=upstream.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
  res.writeHead(upstream.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(result);
 }catch{return send(503,'Account service temporarily unavailable');}
}
