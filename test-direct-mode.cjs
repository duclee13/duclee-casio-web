'use strict';
const assert=require('node:assert/strict');
for(const f of ['data','pdf-reference','engine'])require('./'+f+'.js');
const S=Spell,D=SPELL_DATA;
const repeat=(keys,n)=>Array.from({length:n},()=>keys).flat();
const modeKeys=[...D.BASIC_OVERFLOW,...D.AN_TAKE_KEYS,...repeat(D.BOLD_RECOVER,4),...repeat(['DEL'],10),...D.AN_ASSIGN_KEYS,...D.AN_ACTIVATE_KEYS];
const cKeys=S.conversionKeys('3C',{context:'FDFD'});
// Mode activation must be complete before recovering C; typing must wait
// until the final 3C 23 is ready. Test both literal and explicit-hex inputs.
const direct=S.entries.filter(e=>S.directKeys(e)&&e.hex!=='20');
const examples=['l','1','1234567890','ABC','lmnop','1 2 3',...direct.map(e=>'{'+e.hex+'}')];
for(const raw of examples)for(const center of [false,true]){
 const g=S.generate(raw,{center});
 assert.equal(g.strategy,'direct-overflow');assert.equal(g.mode,'110an');
 assert.deepEqual(g.assignments,[]);assert.equal(g.packing.count,0);
 assert.equal(g.steps.length,5);
 assert.match(g.steps[1].title,/Vào mode 110an/);assert.deepEqual(g.steps[1].segments.flat(),modeKeys);
 assert.match(g.steps[2].title,/Lấy C.*3C/);
 const take=g.steps[2].segments.flat();
 assert.deepEqual(take.slice(0,D.HALF_BASIC_OVERFLOW.length),D.HALF_BASIC_OVERFLOW);
 assert.deepEqual(take.slice(D.HALF_BASIC_OVERFLOW.length+D.BOLD_START.length,D.HALF_BASIC_OVERFLOW.length+D.BOLD_START.length+cKeys.length),cKeys);
 assert.deepEqual(take.slice(-5),['RIGHT',...D.TTK[':'],'LEFT','LEFT']);
 assert.match(g.steps[3].title,/Viết token/);
 assert.deepEqual(g.steps[3].segments[0],g.line.flatMap(e=>S.directKeys(e)));
 assert.deepEqual(g.editing.source.map(e=>e.hex),['3C','23']);assert.equal(g.editing.cursor,0);
 assert.equal(g.keyCount,g.steps.flatMap(s=>s.segments).flat().length);
 assert.ok(g.nums>=0);assert.equal(g.nums+g.line.reduce((n,e)=>n+(e.hex==='20'?2:1),0),34);
}
// A required hex glyph or compressed 01 must retain the assignment route.
for(const raw of ['à','a','{01}1','A A A A A A A A A A']){
 const g=S.generate(raw,{center:false});assert.notEqual(g.strategy,'direct-overflow');assert.ok(g.packing.count>0);
 assert.ok(g.steps.some(s=>/Vào mode 110an/.test(s.title)));
}
const guide=S.generate('l');
const exported=S.guideText(guide);
assert.ok(exported.indexOf('Vào mode 110an')<exported.indexOf('Lấy C (hex 3C)'));
assert.ok(exported.indexOf('Lấy C (hex 3C)')<exported.indexOf('Viết token'));
console.log('PASS: direct-input mode activation before C recovery and typing; all CT1 glyphs, centering, exact key totals and non-direct fallback.');
