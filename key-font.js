/* Verified against CASIO ClassWiz.ttf glyphs, not the characters' normal meaning.
 * Presentation only. Engine keys, clipboard and TXT remain human-readable. */
(function(root){
'use strict';
const glyphs=Object.freeze({
 SHIFT:'q',ALPHA:'Q',MENU:'w',ON:'W',LEFT:'!',RIGHT:'$',UP:'E',DOWN:'R',
 OPTN:'T',CALC:'r',INTEGRAL:'y',X:'[',FRACTION:'a',SQRT:'s',SQUARE:'d',
 POWER:'^',LOG:'i',LN:'h',NEG:'z',DMS:'x',RECIPROCAL:'u',SIN:'j',COS:'k',
 TAN:'l',STO:'J',ENG:'b',LPAREN:'(',RPAREN:')',S_D:'n',M_PLUS:'m',
 DEL:'o',AC:'C',MULTIPLY:'O',DIVIDE:'P',PLUS:'+',MINUS:'p',DOT:'.',EXP:'K',
 ANS:'M',EXEC:'=',...Object.fromEntries(Array.from({length:10},(_,i)=>[String(i),String(i)]))
});
const labels=new Map(Object.entries(root.SPELL_DATA.KEYBOARD).map(([key,label])=>[label,key]));
function renderInto(node,text){
 node.replaceChildren();let end=0;
 function punctuation(value){
  for(const part of value.split(/([()])/)){
   if(!part)continue;
   if(/^[()]$/.test(part)||/^[ \t]+$/.test(part)){
    const span=document.createElement('span');span.className=/^[()]$/.test(part)?'key-pattern-bracket':'key-gap';span.textContent=part;node.append(span);
   }else node.append(document.createTextNode(part));
  }
 }
 function cap(key,fallback){
  const icon=glyphs[key];if(!icon){node.append(document.createTextNode(fallback));return;}
  const span=document.createElement('span');span.className='keycap';span.dataset.glyph=icon;span.dataset.key=key;
  span.setAttribute('role','img');span.setAttribute('aria-label',root.SPELL_DATA.KEYBOARD[key]);span.title=root.SPELL_DATA.KEYBOARD[key];
  const label=document.createElement('span');label.className='key-label';label.textContent=fallback;span.append(label);node.append(span);
 }
 for(const match of text.matchAll(/\[([^\]]+)\]/g)){
  punctuation(text.slice(end,match.index));
  const label=match[1];
  // Each digit is a real keycap and may wrap on mobile; textual grouping is
  // retained exactly for fallback, selection, accessibility and copy helpers.
  if(/^\d+$/.test(label))Array.from(label).forEach((digit,i)=>cap(digit,(i===0?'[':'')+digit+(i===label.length-1?']':'')));
  else cap(labels.get(label),match[0]);
  end=match.index+match[0].length;
 }
 punctuation(text.slice(end));
}
root.SpellKeyFont=Object.freeze({glyphs,renderInto});
if(document.fonts?.load)document.fonts.load('24px "CASIO Keycaps"','qrKo').then(faces=>{
 if(faces.length)document.documentElement.classList.add('key-font-ready');
}).catch(()=>{});
})(globalThis);
