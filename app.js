'use strict';
const $=id=>document.getElementById(id),S=globalThis.Spell,M=globalThis.SpellMotion;
let activeGroup='base',currentGuide=null,selection={start:0,end:0},toastTimer,selectedHex='41';
const sprite={base:{url:'font-base.png',w:868,h:711,x:123,y:[76,121,165,209,254,298,343,387,431,476,520,565,609,653]},f0:{url:'font-f0.png',w:867,h:255,x:124,y:[95,139,183]},f4:{url:'font-f4.png',w:865,h:514,x:122,y:[87,132,176,221,265,310,354,398,443]}};
function glyph(e,size,light=false){
 const d=sprite[e.group],col=e.offset%16,row=Math.floor(e.offset/16);
 if(light){
  // Crop by source pixels, without nested CSS calc() or blend-mode isolation.
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),img=document.createElementNS(ns,'image');
  svg.setAttribute('class','glyph preview-glyph');svg.setAttribute('viewBox',`${d.x+44.45*col} ${d.y[row]} 44 44`);
  svg.setAttribute('width','44');svg.setAttribute('height','44');svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.dataset.hex=e.hex;
  svg.style.width='100%';svg.style.height='100%';
  img.setAttribute('href',d.url);img.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',d.url);
  img.setAttribute('x','0');img.setAttribute('y','0');img.setAttribute('width',d.w);img.setAttribute('height',d.h);
  img.setAttribute('filter','url(#spell-preview-ink)');svg.append(img);return svg;
 }
 const span=document.createElement('span');
 span.className='glyph';span.style.setProperty('--g',size);span.style.width='var(--g)';span.style.height='var(--g)';span.style.backgroundImage=`url('${d.url}')`;
 span.style.backgroundSize=`calc(var(--g) * ${d.w/44}) calc(var(--g) * ${d.h/44})`;
 span.style.backgroundPosition=`calc(var(--g) * ${-(d.x+44.45*col)/44}) calc(var(--g) * ${-d.y[row]/44})`;
 span.setAttribute('aria-hidden','true');return span;
}
function notify(text){$('toast').textContent=text;$('toast').hidden=false;M?.toast();clearTimeout(toastTimer);toastTimer=setTimeout(()=>{if(M)M.toastExit(()=>$('toast').hidden=true);else $('toast').hidden=true;},2400);}
function paletteGlyph(e,size){
 // The image stays visible until the actual bundled font loads successfully.
 const span=glyph(e,size),text=globalThis.SPELL_PALETTE_FONT?.[e.hex];
 if(text!==undefined){
  span.classList.add('glyph-font-candidate');
  const label=document.createElement('span');label.className='glyph-font-text';label.textContent=text;span.append(label);
 }
 return span;
}
async function loadPaletteFont(){
 if(!document.fonts?.load)return;
 try{
  const faces=await document.fonts.load('16px "ClassWiz X Display"','Aạ\uE018');
  if(faces.length)document.documentElement.classList.add('palette-font-ready');
 }catch{ /* Offline/missing/corrupt font: the original PNGs remain usable. */ }
}
function saveDraft(){try{localStorage.setItem('casio-spell-draft',$('editor').value);}catch{}}
function setKeyFontSize(value){const size=[16,18,20,22].includes(Number(value))?Number(value):18;$('key-font-size').value=String(size);document.documentElement.style.setProperty('--key-size',size+'px');try{localStorage.setItem('casio-spell-key-size',String(size));}catch{}}
function invalidate(){currentGuide=null;$('guide').hidden=true;$('guide-placeholder').hidden=false;$('copy-all').disabled=true;$('download').disabled=true;M?.invalidate();}
function updateEditor(){
 const previous=M?.capturePreview();saveDraft();invalidate();$('error').hidden=true;let input=[],line=[];
 try{input=S.parseText($('editor').value);line=S.prepareLine(input,{center:$('center').checked});}catch(e){$('error').textContent=e.message;$('error').hidden=false;line=input.slice(0,S.COMPLETE_CELLS);}
 $('preview').replaceChildren();for(const e of line){const cell=document.createElement('span');cell.className='spell-cell';cell.dataset.hex=e.hex;cell.append(glyph(e,'var(--glyph-size)',true));$('preview').append(cell);}
 $('preview').setAttribute('aria-label','Chữ sẽ spell: '+input.map(e=>e.char||`mã ${e.hex}`).join(''));
 $('generate').disabled=!$('error').hidden||!input.length||input.every(e=>e.hex==='20');
 M?.preview(previous);if(!$('error').hidden)M?.error();
}
function rememberSelection(){selection={start:$('editor').selectionStart,end:$('editor').selectionEnd};}
function insert(hex,button){const origin=M?.captureGlyph(button);showReference(hex);const editor=$('editor'),value=S.insertion(hex);editor.setRangeText(value,selection.start,selection.end,'end');rememberSelection();updateEditor();editor.focus({preventScroll:true});M?.fly(origin,hex);M?.reference();}
function selectGroup(group){activeGroup=group;document.querySelectorAll('[data-group]').forEach(b=>{const active=b.dataset.group===group;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});M?.tab();}
function renderPalette(changed=true){
 const query=$('search').value.trim().normalize('NFC'),q=query.toUpperCase().replace(/^0X/,'');
 const matrix=S.paletteMatrix(activeGroup),fragment=document.createDocumentFragment();let total=0,matches=0;
 function axis(text){const item=document.createElement('span');item.className='hex-axis';item.textContent=text;return item;}
 fragment.append(axis({base:'00',f0:'F0',f4:'F4'}[activeGroup]));for(let col=0;col<16;col++)fragment.append(axis(col.toString(16).toUpperCase()));
 for(let row=0;row<16;row++){
  fragment.append(axis(row.toString(16).toUpperCase()));
  for(const {hex,entry:e} of matrix[row]){
   const cell=document.createElement('div');cell.className='glyph-cell';cell.dataset.address=hex;
   if(!e){cell.classList.add('empty');cell.setAttribute('aria-hidden','true');}
   else{
    total++;const match=!query||hex.includes(q)||(e.char||'').includes(query)||(S.referenceFor(e).display||'').toLowerCase().includes(query.toLowerCase());if(match)matches++;
    const b=document.createElement('button');b.type='button';b.className='glyph-button';b.dataset.hex=hex;
    b.classList.toggle('dimmed',!!query&&!match);b.classList.toggle('matched',!!query&&match);
    const name=e.char===' '?'Dấu cách':e.char||'Ký hiệu';b.title=`${name} · ${hex}`;b.setAttribute('aria-label',`${name} · hex ${hex}`);
    b.append(paletteGlyph(e,'calc(var(--grid-size) / 17 - 1px)'));cell.append(b);
   }
   fragment.append(cell);
  }
 }
 $('glyph-grid').replaceChildren(fragment);$('shown').textContent=query?`${matches} kết quả trong bảng`:`${total} ký tự`; $('glyph-info').textContent='Chạm ký tự để chèn';
 M?.palette(changed);
}
async function copy(text){try{await navigator.clipboard.writeText(text);notify('Đã sao chép');}catch{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.left='-9999px';document.body.append(area);area.select();const success=document.execCommand('copy');area.remove();notify(success?'Đã sao chép':'Không thể sao chép tự động. Bạn có thể tải TXT.');}}
function renderGuide(){if(!currentGuide)return;const compact=$('compact').checked,g=currentGuide,root=$('guide');root.replaceChildren();const pre=document.createElement('pre');pre.className='assign-block';pre.textContent=g.assignments.join('\n');root.append(pre);
 for(const s of g.steps){const section=document.createElement('section');section.className='step';const head=document.createElement('div');head.className='step-head';const title=document.createElement('h3');title.textContent=s.title;const b=document.createElement('button');b.textContent='Sao chép';b.addEventListener('click',()=>copy(s.title+'\n'+s.segments.map(k=>S.formatKeys(k,compact)).join('\n')));head.append(title,b);const keys=document.createElement('div');keys.className='step-keys';for(const segment of s.segments){const p=document.createElement('p');p.textContent=S.formatKeys(segment,compact);keys.append(p);}section.append(head,keys);root.append(section);}
 root.hidden=false;$('guide-placeholder').hidden=true;$('copy-all').disabled=false;$('download').disabled=false;
 M?.guide();
}
function generate(){try{currentGuide=S.generate($('editor').value,{center:$('center').checked});$('error').hidden=true;renderGuide();$('guide-scroll').scrollTop=0;M?.generated();}catch(e){$('error').textContent=e.message;$('error').hidden=false;invalidate();M?.error();}}
function formulasText(variants){return variants.map(keys=>S.formatKeys(keys)).join(' hoặc ');}
function showReference(hex){
 selectedHex=hex;const e=S.byHex.get(hex),r=S.referenceFor(e),char=e.char===' '?'Dấu cách':e.char||'Ký hiệu';
 $('reference-selected').textContent=hex+' · '+char;$('reference-title').textContent='Hex '+hex+' · '+char;
 $('reference-glyph').replaceChildren(glyph(e,'30px'));
 $('reference-token').textContent=r.display?'Khi nhập trên máy: '+r.display:(r.must_pack?'Ký tự hai byte':'');
 const absent=r.formula_status==='documented'?'Không':'PDF không nêu';
 $('formula-one').textContent=r.formula1.length?formulasText(r.formula1):absent;
 $('formula-two').textContent=r.formula2.length?formulasText(r.formula2)+' · cần FDFD':absent;
 const notes=[];
 if(r.correction)notes.push('Áp dụng: '+formulasText(r.effective_formula1)+'. '+r.correction);
 if(r.source_note)notes.push(r.source_note);
 if(r.spell_override)notes.push('Trong spell một dòng, dấu cách dùng '+S.formatKeys(r.spell_override.keys)+' (2 byte).');
 else if(r.must_pack)notes.push('Luôn gán hex hai byte theo quy tắc F… đã thống nhất.');
 else if(!S.directKeys(e)&&r.formula2.length)notes.push('Trong luồng spell hiện tại: gán hex. Công thức 2 dùng khi đã chuẩn bị FDFD.');
 else if(!S.directKeys(e))notes.push('Gán hex vào biến.');
 else notes.push('Dùng công thức 1 khi viết token, không cần gán hex.');
 $('reference-note').textContent=notes.join(' ');
 $('reference-source').hidden=!r.source_page;
 if(r.source_page){$('reference-source').href='reference/all.pdf#page='+r.source_page;$('reference-source').textContent='PDF · tr. '+r.source_page+' ↗';}
}
$('copy-formulas').addEventListener('click',()=>{const r=S.referenceFor(S.byHex.get(selectedHex)),absent=r.formula_status==='documented'?'Không':'PDF không nêu';copy('Hex '+r.hex+' · '+(r.char||'Ký hiệu')+'\nCông thức 1: '+(formulasText(r.formula1)||absent)+'\nCông thức 2 (cần FDFD): '+(formulasText(r.formula2)||absent)+(r.correction?'\n'+r.correction:'')+(r.spell_override?'\nDấu cách trong spell: '+S.formatKeys(r.spell_override.keys):''));});
$('editor').addEventListener('input',()=>{rememberSelection();updateEditor();});for(const event of ['select','click','keyup','blur'])$('editor').addEventListener(event,rememberSelection);
$('center').addEventListener('change',()=>{const hadGuide=!!currentGuide;updateEditor();if(hadGuide&&!$('generate').disabled)generate();});
$('glyph-grid').addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault();});$('glyph-grid').addEventListener('click',e=>{const button=e.target.closest('button[data-hex]');if(button)insert(button.dataset.hex,button);});
for(const event of ['pointerover','focusin'])$('glyph-grid').addEventListener(event,e=>{const b=e.target.closest('button[data-hex]');if(b){$('glyph-info').textContent=b.title;showReference(b.dataset.hex);}});
$('search').addEventListener('input',()=>{const previousGroup=activeGroup,q=$('search').value.trim().toUpperCase().replace(/^0X/,'');if(/^F[04][0-9A-F]{0,2}$/.test(q))selectGroup(q.startsWith('F4')?'f4':'f0');renderPalette(previousGroup!==activeGroup);});
document.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{selectGroup(b.dataset.group);renderPalette();}));
$('clear').addEventListener('click',()=>{$('editor').value='';selection={start:0,end:0};updateEditor();$('editor').focus();});document.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>{$('editor').value=b.dataset.example;selection={start:$('editor').value.length,end:$('editor').value.length};updateEditor();}));
$('generate').addEventListener('click',generate);$('compact').addEventListener('change',renderGuide);$('copy-all').addEventListener('click',()=>{if(currentGuide)copy(S.guideText(currentGuide,$('compact').checked));});$('download').addEventListener('click',()=>{if(!currentGuide)return;const blob=new Blob(['\ufeff'+S.guideText(currentGuide,$('compact').checked)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='huong-dan-spell.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('key-font-size').addEventListener('change',e=>setKeyFontSize(e.target.value));
try{setKeyFontSize(localStorage.getItem('casio-spell-key-size'));}catch{setKeyFontSize(18);}
try{const saved=localStorage.getItem('casio-spell-draft');if(saved!==null)$('editor').value=saved;}catch{}
selection={start:$('editor').value.length,end:$('editor').value.length};renderPalette();updateEditor();showReference(selectedHex);M?.boot();
loadPaletteFont();
