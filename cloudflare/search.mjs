import config from './search-config.json' with {type:'json'};
export const ORIGIN=config.origin;
export const INDEX_KEY=config.indexNowKey;
export const publicFiles=new Map([
 ['/','/home.html'],['/updates.atom','/updates.atom'],['/home.css','/home.css'],['/similora-launcher.png','/similora-launcher.png'],['/similora-mark-v1.png','/similora-mark-v1.png'],['/google779fa91694e4480f.html','/google779fa91694e4480f.html']
]);
export function updateFeed(updated) {
 if(!Number.isFinite(Date.parse(updated)))throw Error('A real public-content modification date is required');
 return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><id>${ORIGIN}/</id><title>Similora website updates</title><updated>${new Date(updated).toISOString()}</updated><author><name>Similora</name></author><link rel="self" href="${ORIGIN}/updates.atom"/><link rel="hub" href="https://pubsubhubbub.appspot.com/"/><link rel="alternate" href="${ORIGIN}/"/><entry><id>${ORIGIN}/#public-website</id><title>Similora — Homeopathic Repertory and Materia Medica</title><updated>${new Date(updated).toISOString()}</updated><link rel="alternate" href="${ORIGIN}/"/><summary>The public Similora website describes repertory search, rubric analysis, materia medica and approved access for web and Android.</summary></entry></feed>`;
}
export function crawlFile(path){
 if(path==='/robots.txt')return {type:'text/plain; charset=utf-8',body:`User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /login\nDisallow: /workspace/\nDisallow: /api/\nDisallow: /__migration\nSitemap: ${ORIGIN}/sitemap.xml\n`};
 if(path==='/sitemap.xml')return {type:'application/xml; charset=utf-8',body:`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${ORIGIN}/</loc></url></urlset>`};
 if(path===`/${INDEX_KEY}.txt`)return {type:'text/plain; charset=utf-8',body:INDEX_KEY};
 return null;
}
export const SCHEMA_JSON=JSON.stringify({'@context':'https://schema.org','@graph':[
 {'@type':'WebSite','@id':ORIGIN+'/#website',url:ORIGIN+'/',name:'Similora',alternateName:['Similora Repertory','Open Repertory'],inLanguage:'en'},
 {'@type':'WebPage','@id':ORIGIN+'/#webpage',url:ORIGIN+'/',name:'Similora — Homeopathic Repertory & Materia Medica',isPartOf:{'@id':ORIGIN+'/#website'},about:{'@id':ORIGIN+'/#software'}},
 {'@type':'SoftwareApplication','@id':ORIGIN+'/#software',name:'Similora',alternateName:'Open Repertory',applicationCategory:'MedicalApplication',operatingSystem:'Android, Web',url:ORIGIN+'/',description:'A clinical reference workspace for homeopathic repertory search, symptom totality, remedy comparison and materia medica reading.'}
]});
