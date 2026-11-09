import {createHash,timingSafeEqual} from 'node:crypto';
import {mkdir,mkdtemp,open,stat,rename,rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const execute=promisify(execFile);
export async function assetBootstrap(config) {
  let ready=await stat(path.join(config.assets,'index.html')).then(()=>true,()=>false), busy=false;
  const enabled=/^[a-f0-9]{64}$/.test(config.bootstrapHash||'') && (config.bootstrapToken||'').length>=32;
  if(!ready&&!enabled)throw Error('Clinical assets missing; configure a verified private bootstrap');
  return {
    ready:()=>ready,
    async upload(req,res) {
      const reply=(status,message)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({message}))};
      if(ready||!enabled)return reply(404,'Not found');
      const expected=Buffer.from('Bearer '+config.bootstrapToken), actual=Buffer.from(req.headers.authorization||'');
      if(actual.length!==expected.length || !timingSafeEqual(actual,expected))return reply(403,'Forbidden');
      if(busy)return reply(409,'Upload already running');
      busy=true;let temp;
      try {
        await mkdir(path.dirname(config.assets),{recursive:true});
        temp=await mkdtemp(path.join(path.dirname(config.assets),'.bootstrap-'));
        const archive=path.join(temp,'assets.tgz'),file=await open(archive,'wx',0o600),digest=createHash('sha256');
        let size=0;
        try {for await(const chunk of req){size+=chunk.length;if(size>64*1024*1024)throw Error('Archive too large');digest.update(chunk);await file.write(chunk)}}finally{await file.close()}
        if(digest.digest('hex')!==config.bootstrapHash)throw Error('Archive checksum mismatch');
        // Only the deployment-pinned archive can reach extraction. Never accept a caller-supplied digest.
        const unpack=path.join(temp,'unpacked');await mkdir(unpack);
        await execute('tar',['-xzf',archive,'--no-same-owner','--no-same-permissions','-C',unpack],{timeout:120000});
        await stat(path.join(unpack,'index.html'));
        await rename(unpack,config.assets);
        ready=true;
        return reply(201,'Verified clinical assets installed; upload endpoint disabled');
      } catch (_) {return reply(400,'Clinical archive could not be verified or installed')}
      finally{busy=false;if(temp)await rm(temp,{recursive:true,force:true})}
    }
  };
}
