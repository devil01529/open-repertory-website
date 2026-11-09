const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Element{
 constructor(){this.children=[];this.dataset={};this.hidden=false;this.value='';this.textContent='';this.attrs={};this.disabled=false;this.classList={toggle(){}}}
 append(...x){this.children.push(...x)}replaceChildren(){this.children=[]}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}
}
const ids=Object.fromEntries(['rows','analysisRows','search','count','empty','pageName','hide','clear','approve','revoke','status'].map(id=>[id,new Element()]));
const pages=['today','repertory','analysis','library','access'].map(id=>Object.assign(new Element(),{id}));
const nav=pages.map(p=>Object.assign(new Element(),{dataset:{nav:p.id}}));
const document={querySelector:s=>ids[s.slice(1)],querySelectorAll:s=>s==='section'?pages:s==='[data-nav]'?nav:[],createElement:()=>new Element()};
vm.runInNewContext(fs.readFileSync('designs/app.js','utf8'),{document,Set});
assert.equal(ids.rows.children.length,3);
nav[1].onclick();assert.equal(pages[1].hidden,false);
ids.rows.children[0].children[0].children[1].onclick();
assert.equal(ids.count.textContent,1);assert.equal(ids.analysisRows.children.length,1);
ids.hide.onclick();assert.equal(ids.rows.children[0].children[1].hidden,true);
ids.hide.onclick();assert.equal(ids.rows.children[0].children[1].hidden,false);
ids.search.value='sleep';ids.search.oninput();assert.equal(ids.rows.children.length,1);
ids.search.value='<script>';ids.search.oninput();assert.equal(ids.rows.children.length,0);
ids.approve.onclick();assert.equal(ids.status.textContent,'Approved · sample only');assert.equal(ids.approve.disabled,true);
ids.revoke.onclick();assert.equal(ids.status.textContent,'Revoked · sample only');
ids.clear.onclick();assert.equal(ids.analysisRows.children.length,0);
for(const theme of ['glass','editorial','workbench']){
 const html=fs.readFileSync('designs/'+theme+'.html','utf8');
 for(const id of Object.keys(ids)) assert(html.includes('id="'+id+'"'),theme+' missing '+id);
 assert(!html.includes('type="password"'));assert(html.includes('rel="noopener noreferrer"'));
}
console.log('Website sample interaction and HTML checks passed (DOM harness, not browser rendering).');
