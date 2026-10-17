'use strict';
const assert=require('node:assert/strict');
for(const f of ['data','pdf-reference','engine','server-multiline'])require('./'+f+'.js');
const M=SpellMulti,D=SPELL_DATA;
// All CT1 symbols must stay outside every proposed raw base. CT2-only
// symbols can be entirely deferred, entirely retained or selectively kept.
const base=M.prepare('ALMabàá\nNghàê',{lines:2,center:false});
const {variants}=M.tokenVariants(base,{limit:100});
const optional=base.items.filter(e=>e.method==='packed'&&e.hex.length===2&&PDF_REFERENCE.rows[e.hex]?.formula2?.length);
assert.ok(optional.length>=2);
assert.ok(variants.some(v=>optional.every(e=>v.items[e.index].method==='ct2')));
assert.ok(variants.some(v=>optional.some(e=>v.items[e.index].method==='packed')&&optional.some(e=>v.items[e.index].method==='ct2')));
for(const v of variants){
 for(const u of v.units)for(const index of u.indices){assert.equal(v.items[index].method,'packed');assert.equal(Spell.directKeys(v.items[index]),null);}
 assert.deepEqual(v.units.flatMap(u=>u.indices),v.items.filter(e=>e.method==='packed').map(e=>e.index));
 assert.deepEqual(v.units.flatMap(u=>u.output),v.items.filter(e=>e.method==='packed').map(e=>e.hex));
}
assert.ok(variants.some(v=>v.kind==='mixed'));
// Independent interval calculation: fit the most non-overlapping F4F4
// pairs in ABC after FB01, reserving three numeric ending slots. This is
// not the SCS search and proves a hard four-token base maximum here.
const allowed=[];
for(let p=2;p<=17;p++)if(D.SLOTS[p][0]===D.SLOTS[p+1][0]&&[p,p+1].every(i=>D.SLOTS[i][2]==='__'))allowed.push(p);
let last=-1,maxPairs=0;for(const p of allowed)if(p>last){maxPairs++;last=p+1;}
assert.equal(maxPairs,4);
const target=Array(32).fill('F4F4');
const found=M.seedSearch(target,{budget:150000,maxRounds:6,maxResults:1});
assert.equal(found.stats.truncated,false);assert.equal(found.stats.completeThrough,2);
assert.ok(found.packings.length);
const pack=found.packings[0],rounds=M.duplicatePlan(pack.seeds,target,M.MODES['198']);
assert.equal(rounds.length,Math.ceil(Math.log2(target.length/maxPairs)));assert.equal(rounds.length,3);
let state=pack.seeds;
for(const r of rounds){const doubled=state.concat(state);state=r.keep.map(i=>doubled[i-1]);}
assert.deepEqual(state,target);
// The partition generation itself must respect cancellation; an interrupted
// higher-round search is not reported as an infeasibility proof.
const timeout=M.seedSearch(Array.from({length:49},(_,i)=>String(61+(i*11)%7)),{budget:10000,maxRounds:6,deadline:Date.now()-1,maxResults:2});
assert.equal(timeout.stats.truncated,true);assert.equal(timeout.stats.reason,'time-budget');
// End-to-end API algorithm result and a scoped, never-global proof label.
const guide=M.generate('Dường như nắng đã\nlàm má em thêm hồng,\nLàn mây bay đã\nyêu tóc em',{lines:4,center:false});
assert.equal(guide.duplication.length,2);assert.ok(guide.keyCount<=3107);
assert.equal(guide.optimization.globalOptimalityProven,false);
assert.equal(guide.optimization.scope,'fixed raw-token representation');
console.log('PASS: CT1 exclusion, selective CT2, mixed representations, exact 3-round fixture, bounded partition generation and scoped optimality metadata.');
