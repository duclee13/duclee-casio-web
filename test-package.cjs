'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=__dirname,out=path.join(root,'.vercel/output'),config=JSON.parse(fs.readFileSync(path.join(out,'config.json')));
assert.equal(config.version,3);
const fn=path.join(out,'functions/api/spell.func'),fc=JSON.parse(fs.readFileSync(path.join(fn,'.vc-config.json')));
assert.equal(fc.handler,'api-spell.js');assert.equal(fc.shouldAddHelpers,true);
const stat=path.join(out,'static');
assert.deepEqual(fs.readdirSync(stat).filter(n=>/^(server-|api-spell|test-|README)/.test(n)),[]);
assert.equal(JSON.parse(fs.readFileSync(path.join(stat,'version.json'))).version,'20261018-ui-v7');
const html=fs.readFileSync(path.join(stat,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g)){
 if(!/^(?:https?:|#|data:)/.test(m[1]))assert.ok(fs.existsSync(path.join(stat,m[1])),m[1]);
}
const isolated=fs.mkdtempSync(path.join(os.tmpdir(),'spell-function-'));
try{
 fs.cpSync(fn,isolated,{recursive:true});
 const code=`const assert=require('node:assert/strict'),handler=require('./api-spell.js');
 async function call(body){let status,result;await handler({method:body?'POST':'GET',headers:{host:'test.local','content-type':'application/json'},body},{setHeader(){},set statusCode(x){status=x},end(x){result=JSON.parse(x)}});return {status,result}}
 (async()=>{const health=await call();assert.equal(health.status,200);assert.equal(health.result.version,'20261018-ui-v7');assert.equal(health.result.unlocked,true);
 for(const lines of [2,3,4]){const r=await call({action:'generate',text:['Casio','Việt Nam','Xin chào','Lê Minh Đức'].slice(0,lines).join('\\n'),options:{lines,center:false}});assert.equal(r.status,200,JSON.stringify(r));assert.ok(r.result.guide.keyCount>0);assert.ok(r.result.guide.steps.length<=15)}
 })().catch(e=>{console.error(e);process.exitCode=1});`;
 cp.execFileSync(process.execPath,['-e',code],{cwd:isolated,env:{...process.env,SPELL_DEMO_REQUIRE_PASSWORD:'false'},stdio:'inherit'});
}finally{fs.rmSync(isolated,{recursive:true,force:true})}
console.log('PASS: Build Output API structure, all HTML assets, no private static files, isolated packaged API GET and 2/3/4-line POST.');
