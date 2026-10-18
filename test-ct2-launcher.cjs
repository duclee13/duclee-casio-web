'use strict';
const assert=require('node:assert/strict');
for(const f of ['data','pdf-reference','engine','server-multiline'])require('./'+f+'.js');
const M=SpellMulti,S=Spell,D=SPELL_DATA;
function validate(g){
 assert.deepEqual(g.execution.tokens.filter(t=>t.role==='content').map(t=>t.hex),g.displayLines.flat().map(t=>t.hex));
 for(const e of g.items)if(e.method==='packed'){
  assert.equal(S.directKeys(e),null);assert.ok(!PDF_REFERENCE.rows[e.hex]?.formula2?.length,'CT2 belongs outside base');
 }
 assert.deepEqual(g.exportOrder,['4D','4E','4F'].slice(0,g.packing.count));
 assert.deepEqual(g.assignments.slice(1).map(s=>s.match(/^@<([0-9A-F]+)>/)[1]),g.exportOrder);
 const assign=g.steps.find(s=>s.title.includes('Gán hex trực tiếp'));
 const expectedPrefix=[...D.BOLD_START,...[...'ABC'.slice(0,g.packing.count)].flatMap(c=>D.EXTRACT_KEYS[c])];
 assert.deepEqual(assign.segments[0].slice(0,expectedPrefix.length),expectedPrefix);
 assert.deepEqual(assign.segments.at(-1).slice(0,11),[...'1234567890','X']);
 const execute=g.steps.find(s=>s.title.includes('Thực thi và mở chuỗi')).segments.flat();
 assert.equal(execute.filter(k=>k==='EXEC').length,2*(g.packing.count+1)+1);
 assert.equal(g.steps.find(s=>s.title.includes('Mở dữ liệu và bỏ FB01')).segments[0][0],'UP');
 const conversions=g.cachePasses.flatMap(p=>p.targetIds);
 assert.equal(new Set(conversions).size,conversions.length,'Each CT2 converts once');
 assert.deepEqual(conversions.filter(id=>id.startsWith('item')),g.conversions.map(e=>'item'+e.index));
 assert.equal(g.cachePasses.at(-1).launcherConverted,g.lines===2?1:2*g.lines-1);
 assert.ok(g.cachePasses.slice(0,-1).every(p=>p.launcherConverted===0));
 for(const p of g.cachePasses){assert.equal(p.firstFill+p.sourceBytes,p.saveBytes);assert.equal(p.saveBytes+p.secondFill,200);assert.equal(p.deletedFiller,p.firstFill);}
 for(const token of g.execution.tokens.filter(t=>t.role==='control'||g.conversions.some(e=>t.id==='item'+e.index))){assert.equal(token.bytes,1);assert.equal(token.converted,true);}
 assert.equal(g.keyCount,g.steps.flatMap(s=>s.segments).flat().length);assert.ok(S.limitGuideSteps(g).steps.length<=15);
 return g;
}
const raw='Nói rằng mình là\nngười Thanh Hóa';
const mandatory=['F483','F432','67','F47C','F470','67','F46F','F446','61','F483','61'];
for(const mode of ['194','198']){
 const g=validate(M.generate(raw,{lines:2,center:false,mode}));
 assert.deepEqual(g.items.filter(e=>e.method==='packed').map(e=>e.hex),mandatory);
 assert.deepEqual(g.packing.seeds,mandatory);assert.equal(g.duplication.length,0);
 assert.deepEqual(g.conversions.map(e=>e.hex),['4E','54']);
 assert.equal(g.cachePasses.length,1);assert.equal(g.cachePasses[0].contentConverted,2);assert.equal(g.cachePasses[0].launcherConverted,1);
 assert.ok(g.keyCount<2100);
}
const long=validate(M.generate(Array(4).fill('L'.repeat(17)).join('\n'),{lines:4,center:false}));
assert.equal(long.conversions.length,68);assert.equal(long.packing.seeds.length,0);assert.equal(long.duplication.length,0);
assert.equal(long.cachePasses.length,2,'Unconverted CT2 exceed one cache; split instead of overflow');
for(const [text,lines] of [['Nói\nThanh\nLà',3],['N\nT\nL\nM',4],['123\n456',2]])validate(M.generate(text,{lines,center:false}));
console.log('PASS: fixed @ address order, exact 11-symbol base, N/T with launcher in one pass, 68 CT2 across two passes, output and cache accounting.');
