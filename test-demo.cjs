'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const api=require('./api-spell.js'),root=__dirname;
async function call(body,cookie='',headers={}){
 const req={method:body===undefined?'GET':'POST',body,headers:{host:'example.test','content-type':'application/json',cookie,...headers}};
 const result={headers:{}};
 const res={setHeader(k,v){result.headers[k]=v;},end(value){result.status=this.statusCode;result.body=JSON.parse(value);}};
 await api(req,res);return result;
}
(async()=>{
 const body={action:'generate',text:'Xin chào\nViệt Nam',options:{lines:2,center:true,compressSpaces:true}};
 delete process.env.SPELL_DEMO_REQUIRE_PASSWORD;
 assert.equal((await call()).body.unlocked,true);
 assert.equal((await call(body)).status,200,'Multi-line generation is public by default');
 assert.equal((await call({...body,options:{lines:99}})).status,400);
 assert.equal((await call(body,'',{origin:'https://attacker.test'})).status,403);
 process.env.SPELL_DEMO_REQUIRE_PASSWORD='true';
 assert.equal((await call()).body.unlocked,false);
 assert.equal((await call(body)).status,401);
 assert.equal((await call(body,'spell_demo=forged')).status,401);
 assert.equal((await call({action:'unlock',password:'wrong'})).status,401);
 assert.equal((await call({action:'unlock',password:'apple123'},'',{origin:'https://attacker.test'})).status,403);
 const login=await call({action:'unlock',password:'apple123'});assert.equal(login.status,200);
 const cookie=login.headers['Set-Cookie'].split(';')[0];
 assert.match(login.headers['Set-Cookie'],/HttpOnly/);assert.match(login.headers['Set-Cookie'],/Secure/);assert.match(login.headers['Set-Cookie'],/SameSite=Strict/);
 assert.equal((await call(undefined,cookie)).body.unlocked,true);
 const altered=cookie.slice(0,-1)+(cookie.endsWith('a')?'b':'a');assert.equal((await call(body,altered)).status,401);
 const config=require('./server-config.json'),value=String(Date.now()-1000)+'.'+'a'.repeat(32),sig=crypto.createHmac('sha256',config.sessionKey).update(value).digest('hex');
 assert.equal((await call(body,'spell_demo='+value+'.'+sig)).status,401);
 assert.equal((await call('{',cookie)).status,400);
 assert.equal((await call({...body,options:{lines:99}},cookie)).status,400);
 assert.equal((await call({...body,text:'a'.repeat(2049)},cookie)).status,400);
 assert.equal((await call({...body,text:'😀'},cookie)).status,422);
 for(const [lines,text] of [[2,body.text],[3,'Casio\nViệt Nam\nXin chào'],[4,'Casio\nViệt Nam\nLê Minh Đức\nXin chào']]){
  const r=await call({...body,text,options:{...body.options,lines}},cookie);assert.equal(r.status,200,JSON.stringify(r.body));
  const g=r.body.guide;assert.ok(g.steps.length<=15);assert.equal(g.keyCount,g.steps.flatMap(s=>s.segments).flat().length);
  assert.ok(!('config' in g)&&!('trace' in g));assert.match(g.assignments.join('\n'),/ˣ₁₀/);assert.doesNotMatch(g.assignments.join('\n'),/×10/);
  for(const s of g.steps)for(const p of s.parts||[s])assert.ok(!('note' in p));
 }
 const publicFiles=fs.readdirSync(path.join(root,'public'));
 assert.ok(!publicFiles.includes('server')&&!publicFiles.includes('README.txt')&&!publicFiles.includes('multiline-guide.pdf'));
 const publicCode=publicFiles.filter(f=>/\.(js|html|css|json)$/.test(f)).map(f=>fs.readFileSync(path.join(root,'public',f),'utf8')).join('\n');
 for(const privateValue of ['apple123',config.sessionKey,config.passwordHash,'class InputTape','function packSeeds','function duplicatePlan'])assert.ok(!publicCode.includes(privateValue),'Leaked '+privateValue.slice(0,14));
 console.log('PASS: public generation by default, optional password gate, signed/expired/tampered cookies, same-origin check, input validation, 2/3/4-line output, 15-step cap, exact key totals, ˣ₁₀, no private code in public assets.');
})().catch(e=>{console.error(e);process.exitCode=1;});
