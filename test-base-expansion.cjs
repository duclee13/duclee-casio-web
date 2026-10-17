'use strict';
const assert=require('node:assert/strict');
for(const f of ['data','pdf-reference','engine','server-multiline'])require('./'+f+'.js');
const M=SpellMulti,S=Spell,D=SPELL_DATA;
const suffixes=[...S.byHex.keys()].filter(h=>h.length===2).map(h=>({h,keys:S.f4SuffixKeys(h)})).filter(e=>e.keys).sort((a,b)=>b.keys.length-a.keys.length);
// Replay the actual exported bytes, prefix insertion and padding deletion.
// This does not reuse the generator's token/macro cleanup implementation.
function replayOpening(g){
 const r=g.packing,bytes=[];
 for(let v=0;v<r.count;v++){
  if(v)bytes.push('01','01');
  const start=[0,6,14][v];bytes.push(...r.cells.slice(start,start+D.TEMPLATES[v][2].length).map(c=>c.value));
 }
 let cursor=0;
 const back=()=>cursor>=2&&bytes[cursor-2].startsWith('F')?2:1;
 const keys=g.steps.find(s=>s.title.includes('Ghép tiền tố F và xóa byte đệm')).segments.flat();
 assert.equal(keys[0],'RIGHT'); // Initial recall at the beginning.
 for(let i=1;i<keys.length;){
  const key=keys[i];
  if(key==='RIGHT'){cursor+=bytes[cursor]?.startsWith('F')?2:1;i++;}
  else if(key==='LEFT'){cursor-=back();i++;}
  else if(key==='DEL'){const n=back();bytes.splice(cursor-n,n);cursor-=n;i++;}
  else{const suffix=suffixes.find(e=>e.keys.every((k,j)=>keys[i+j]===k));assert.ok(suffix,'Unrecognized suffix recipe');bytes.splice(cursor++,0,suffix.h);i+=suffix.keys.length;}
  assert.ok(cursor>=0&&cursor<=bytes.length);
 }
 assert.equal(bytes.join(''),'FB01'+r.seeds.join('')+'621923');assert.equal(cursor,bytes.length);
 const opening=g.steps.find(s=>s.title.includes('nhập 1'));
 for(const key of opening.segments[0]){assert.equal(key,'LEFT');cursor-=back();assert.ok(cursor>=0);}
 assert.equal(cursor,0,'The guard must be typed at the actual first position');
 assert.deepEqual(opening.segments[1],['1']);bytes.splice(cursor,0,'31');
 assert.equal(bytes.join(''),'31FB01'+r.seeds.join('')+'621923');
 assert.equal(opening.segments[2].length,23);assert.ok(opening.segments[2].every(k=>k==='EXEC'));
 assert.deepEqual(g.execution.tokens.filter(t=>t.role==='content').map(t=>t.hex),g.items.map(t=>t.hex));
 assert.equal(g.keyCount,g.steps.flatMap(s=>s.segments).flat().length);
 assert.ok(!g.execution.tokens.some(t=>t.role==='guard'));
}
const full=M.generate(Array(2).fill('à'.repeat(17)).join('\n'),{lines:2,center:false});
assert.equal(full.duplication.length,2);assert.equal(full.packing.seeds.length,9);
assert.ok(Object.keys(full.packing.macros).length>0,'Expand prefixes BEFORE doubling');
assert.ok(full.packing.seeds.every(h=>h==='F470'));assert.equal(full.conversions.length,0);
assert.ok(full.keyCount<2462);replayOpening(full);
// Independent slot bound: literal F470 emits one à; F4F4 emits at most two.
// Tail 62 19 23 requires at least three remaining slots. The maximum is 12,
// so even one doubling cannot supply the required 34 characters.
const best=Array(23).fill(-Infinity);best[2]=0;
const fits=(b,rule)=>[...rule].every((c,i)=>c==='_'||/\d/.test(b[i]));
for(let p=2;p<19;p++)if(Number.isFinite(best[p])){
 best[p+1]=Math.max(best[p+1],best[p]);
 for(const [bytes,count] of [[['F4','70'],1],[['F4','F4'],2]]){
  const end=p+bytes.length;
  if(end<=19&&D.SLOTS[p][0]===D.SLOTS[end-1][0]&&bytes.every((b,i)=>fits(b,D.SLOTS[p+i][2])))best[end]=Math.max(best[end],best[p]+count);
 }
}
const maximum=Math.max(...best);assert.equal(maximum,12);assert.ok(maximum*2<34);
for(const [text,lines] of [['àáâãàáâã\nãâáàãâáà',2],['{F430}{F060}\n{F430}{F060}',2],['àá\nâã\nèé',3],['Casio\nViệt Nam\nLê Minh Đức\nXin chào',4]])replayOpening(M.generate(text,{lines,center:false}));
// Reinserted guards elsewhere in the cache workflow also use just one key.
const tape=new M.InputTape([{hex:'62',bytes:1,role:'q'}],1);tape.guard();
assert.deepEqual(tape.take(),['LEFT','1']);assert.equal(tape.tokens[0].hex,'31');assert.equal(tape.bytes(),2);
console.log('PASS: 34 à in 2 doublings, ABC slot bound, byte-level pre-expansion, true-start guard 1, 2/3/4-line output.');
