/* Text layout only: word boundaries and the calculator's 52-third-cell width. */
(function(root){
'use strict';
const S=root.Spell,blank=e=>e.hex==='20'||e.hex==='01';
function arrange(raw,{compressSpaces=true}={}){
 const input=S.parseText(raw.replace(/\r\n?/g,'\n').replace(/\n/g,' '));
 if(input.length>400)throw Error('Văn bản quá dài để xếp trong 4 dòng.');
 while(input.length&&blank(input[0]))input.shift();
 while(input.length&&blank(input.at(-1)))input.pop();
 if(!input.length)return {text:'',lines:1,rows:['']};
 const words=[];let at=0,gap=[];
 while(at<input.length){
  if(blank(input[at])){gap.push(input[at++]);continue;}
  const word=[];while(at<input.length&&!blank(input[at]))word.push(input[at++]);
  // Split a single overlong word only when it cannot fit on any line.
  let chunk=[],width=0;
  for(const e of word){
   if(width+S.cellThirds(e)>52){words.push({tokens:chunk,gap});gap=[];chunk=[];width=0;}
   chunk.push(e);width+=S.cellThirds(e);
  }
  words.push({tokens:chunk,gap});gap=[];
 }
 const segments=new Map();
 for(let start=0;start<words.length;start++){
  let tokens=[];
  for(let end=start;end<words.length;end++){
   tokens.push(...(end===start?[]:words[end].gap),...words[end].tokens);
   const fit=S.fitInput(tokens,{compressSpaces});if(!fit.fits)break;
   segments.set(start+','+(end+1),{text:tokens.map(e=>S.insertion(e.hex)).join(''),width:fit.thirds,compressed:fit.compressedSpaces});
  }
 }
 for(let count=1;count<=4;count++){
  const memo=new Map();
  const solve=(start,left)=>{
   if(!left)return start===words.length?{score:0,rows:[]}:null;
   if(words.length-start<left)return null;
   const id=start+','+left;if(memo.has(id))return memo.get(id);let best=null;
   for(let end=start+1;end<=words.length;end++){
    const line=segments.get(start+','+end);if(!line)break;
    const rest=solve(end,left-1);if(!rest)continue;
    const score=rest.score+(52-line.width)**2+line.compressed*9;
    if(!best||score<best.score)best={score,rows:[line.text,...rest.rows]};
   }
   memo.set(id,best);return best;
  };
  const best=solve(0,count);if(best)return {text:best.rows.join('\n'),lines:count,rows:best.rows};
 }
 throw Error('Văn bản không vừa 4 dòng. Hãy rút ngắn nội dung.');
}
root.SpellLayout={arrange};
})(globalThis);
