'use strict';
const assert=require('node:assert/strict');
for(const f of ['data','pdf-reference','engine','server-multiline'])require('./'+f+'.js');
const M=SpellMulti,S=Spell,D=SPELL_DATA;
const poem='Dường như nắng đã\nlàm má em thêm hồng,\nLàn mây bay đã\nyêu tóc em';
const g=M.generate(poem,{lines:4,center:false}),r=g.packing;
assert.equal(g.duplication.length,2);assert.ok(g.keyCount<3505);assert.equal(g.conversions.length,8);
assert.ok(g.conversions.some(x=>x.hex==='4C'),'L is deferred to CT2');
assert.ok(Object.values(r.boundaryKeeps).some(n=>n>0),'Use boundary spaces');
// Validate emitted assignment slots without calling the packer.
for(const [i,c] of r.cells.entries()){
 assert.match(c.value,/^[0-9A-F]{2}$/);
 const rule=D.SLOTS[i][2];for(let j=0;j<2;j++)if(rule[j]!=='_')assert.match(c.value[j],/[0-9]/);
}
assert.equal(r.cells.at(-1).value,'23');
// Reconstruct the raw exported token stream and replay cleanup RIGHT/DEL.
const exported=[];
for(let v=0;v<r.count;v++){
 if(v)exported.push('01','01');
 const start=[0,6,14][v],cells=r.cells.slice(start,start+D.TEMPLATES[v][2].length);
 for(let i=0;i<cells.length;i++){
  const c=cells[i];if(!c.padding&&c.value.startsWith('F')){assert.ok(cells[i+1]);exported.push(c.value+cells[++i].value);}else exported.push(c.value);
 }
}
const cleanup=g.steps.find(s=>s.title.includes('Ghép tiền tố F và xóa byte đệm')).segments.flat();
assert.equal(cleanup[0],'RIGHT');let cursor=0;
for(const k of cleanup.slice(1)){
 if(k==='RIGHT')cursor++;else if(k==='DEL'){assert.ok(cursor>0);exported.splice(--cursor,1);}else assert.fail('Unexpected cleanup key '+k);
 assert.ok(cursor>=0&&cursor<=exported.length);
}
assert.deepEqual(exported,['FB01',...r.seeds,'62','19','23']);
// Independently apply each selection to both copies, preserving strict order.
let state=r.seeds.slice();
for(const pass of g.duplication){
 assert.deepEqual(pass.before,state);const both=state.concat(state);
 assert.ok(pass.keep.every((p,i)=>p>0&&p<=both.length&&(!i||p>pass.keep[i-1])));
 state=pass.keep.map(p=>both[p-1]);assert.deepEqual(state,pass.after);
}
assert.deepEqual(state,g.units.map(u=>u.raw));
assert.deepEqual(g.units.flatMap(u=>u.output),g.items.filter(e=>e.method==='packed').map(e=>e.hex));
// With this fixed prefix decomposition, even unlimited free 01 leaves a
// one-doubling frequency lower bound of 18 assigned bytes > the 17 available.
const frequency={};for(const h of state)frequency[h]=(frequency[h]||0)+1;
const lower=Object.entries(frequency).reduce((n,[h,c])=>n+(h==='01'?0:Math.ceil(c/2)*h.length/2),0);
assert.equal(lower,18);assert.equal(M.seedSearch(state).stats.completeThrough,1);
// A truncated search is explicitly labelled, never an impossibility proof.
const limited=M.seedSearch(state,{budget:1});assert.equal(limited.stats.truncated,true);
assert.ok(limited.stats.completeThrough<2);
// Check full final content, including all compressed and padded spaces.
assert.deepEqual(g.execution.tokens.filter(t=>t.role==='content').map(t=>t.hex),g.displayLines.slice().reverse().flat().map(t=>t.hex));
assert.equal(g.keyCount,g.steps.flatMap(s=>s.segments).flat().length);assert.ok(S.limitGuideSteps(g).steps.length<=15);
console.log('PASS: poem 2 doublings, compulsory symbols, real ABC slot rules, preserved boundary 01, cleanup replay, both-copy order, one-round lower bound, bounded-search honesty.');
