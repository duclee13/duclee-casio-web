'use strict';
const assert=require('node:assert/strict');
for(const f of ['data','pdf-reference','engine','layout'])require('./'+f+'.js');
require('./server-multiline.js');
const S=global.Spell,M=global.SpellMulti,config=M.MODES['198'];
const bytes=a=>a.reduce((n,h)=>n+h.length/2,0);
// Independent lower bound: count how many complete seed copies are needed
// to read the desired sequence from left to right without reordering.
for(const bank of [['61','62'],['61','F4F4','62'],['61','62','61']]){
 const alphabet=[...new Set(bank)];
 for(let n=1;n<=5;n++)for(let code=0;code<alphabet.length**n;code++){
  let v=code;const target=Array.from({length:n},()=>{const h=alphabet[v%alphabet.length];v=Math.floor(v/alphabet.length);return h;});
  let copies=1,cursor=0;
  for(const h of target){let found=bank.indexOf(h,cursor);if(found<0){copies++;found=bank.indexOf(h);}cursor=found+1;}
  const rounds=M.duplicatePlan(bank,target,config),same=bank.join()===target.join();
  assert.equal(rounds.length,same?0:Math.max(1,Math.ceil(Math.log2(copies))));
  let state=bank;
  for(const r of rounds){
   assert.deepEqual(r.before,state);const doubled=state.concat(state);
   assert.ok(r.keep.every((p,i)=>p>=1&&p<=doubled.length&&(!i||p>r.keep[i-1])));
   state=r.keep.map(p=>doubled[p-1]);assert.deepEqual(state,r.after);assert.ok(bytes(state)+4<=config.cache);
  }
  assert.deepEqual(state,target);
 }
}
// Replay the established F-prefix recipes as bytes, independent of InputTape.
const suffixes=[];
for(const h of S.byHex.keys())if(h.length===2){const keys=S.f4SuffixKeys(h);if(keys)suffixes.push({h,keys});}
suffixes.sort((a,b)=>b.keys.length-a.keys.length);
function replayExpansion(expansion){
 const tape=expansion.raw.match(/../g);let cursor=0,at=0;
 const back=()=>cursor>=2&&tape[cursor-2].startsWith('F')?2:1;
 while(at<expansion.keys.length){
  const key=expansion.keys[at];
  if(key==='RIGHT'){cursor+=tape[cursor]?.startsWith('F')?2:1;at++;}
  else if(key==='LEFT'){cursor-=back();at++;}
  else if(key==='DEL'){const n=back();tape.splice(cursor-n,n);cursor-=n;at++;}
  else{const entry=suffixes.find(e=>e.keys.every((k,i)=>expansion.keys[at+i]===k));assert.ok(entry,'Unknown suffix keys');tape.splice(cursor++,0,entry.h);at+=entry.keys.length;}
  assert.ok(cursor>=0&&cursor<=tape.length);
 }
 assert.equal(tape.join(''),expansion.output.join(''));assert.equal(cursor,tape.length);
}
const poem='Dường như nắng đã\nlàm má em thêm hồng,\nLàn mây bay đã\nyêu tóc em';
const examples=[poem,'Casio\nViệt Nam\nLê Minh Đức\nXin chào','àáâãàáâã\nãâáàãâáà','{F430}{F060}\n{F430}{F060}'];
for(const text of examples){
 const guide=M.generate(text,{lines:text.split('\n').length,center:false});
 assert.deepEqual(guide.execution.tokens.filter(t=>t.role==='content').map(t=>t.hex),guide.items.map(t=>t.hex));
 assert.equal(guide.keyCount,guide.steps.flatMap(s=>s.segments).flat().length);
 assert.ok(guide.execution.bytes<=200);assert.ok(S.limitGuideSteps(guide).steps.length<=15);
 for(const pass of guide.duplicationPasses)assert.equal(pass.savedBytes+pass.fill,200);
 for(const expansion of guide.expansions){replayExpansion(expansion);assert.ok(expansion.peakBytes<=200);}
 if(guide.units&&!Object.keys(guide.packing.macros).length){
  const raw=guide.packing.cells.filter(c=>!c.padding).map(c=>c.value).join('');
  assert.equal(raw,'FB01'+(guide.packing.assignedSeeds||guide.packing.seeds).join('')+'621923');
 }
 console.log(text.split('\n')[0]+': '+guide.duplication.length+' duplications, '+guide.keyCount+' keys, '+guide.conversions.length+' content CT2');
}
const optimized=M.generate(examples[1],{lines:4,center:false});assert.ok(optimized.duplication.length<=2);assert.ok(optimized.keyCount<5209);
// Layout preserves every non-spacing calculator token, including explicit
// hex aliases and multi-code-point glyphs, and never exceeds 17 1/3 cells.
for(const text of [poem.replaceAll('\n',' '),'Xin chào Việt Nam tôi yêu bạn','{F060} {F430} Xin chào Việt Nam','a'.repeat(68),'a  b   c','a{01}b c']){
 const layout=SpellLayout.arrange(text),rows=layout.text.split('\n');
 assert.equal(layout.lines,rows.length);assert.ok(layout.lines<=4);
 const nonspace=t=>S.parseText(t.replaceAll('\n',' ')).filter(e=>e.hex!=='20'&&e.hex!=='01').map(e=>e.hex);
 assert.deepEqual(nonspace(layout.text),nonspace(text));
 rows.forEach(row=>assert.ok(S.fitInput(S.parseText(row)).fits));
}
assert.equal(SpellLayout.arrange('Xin chào').lines,1);
assert.equal(SpellLayout.arrange('Xin chào Việt Nam tôi yêu bạn').lines,2);
assert.throws(()=>SpellLayout.arrange('a'.repeat(69)),/4 dòng/);
console.log('PASS: minimum copy rounds for fixed seeds, ancestor selection, byte-level prefix expansion, full output, assignment bytes, physical-key counts, auto layout.');
