'use strict';
const $=id=>document.getElementById(id),S=globalThis.Spell,M=globalThis.SpellMotion;
let activeGroup='base',currentGuide=null,selection={start:0,end:0},toastTimer,selectedHex='41';
let demoUnlocked=true,pendingMode='2',generationVersion=0,unlockVersion=0;
const demo=globalThis.SpellDemoTransport;
let effectiveText='';
let composing=false,acceptedInput={value:'',start:0,end:0};
function validInput(value){try{value.replace(/\r\n?/g,'\n').split('\n').forEach(line=>S.parseText(line));return true;}catch{return false;}}
function spellOptions(){return {lines:Number($('line-mode').value),center:$('center').checked,compressSpaces:$('compress-spaces').checked};}
function rejectInput(){notify('Không nhận ký tự hoặc mã hex ngoài bảng Casio.');}

function insertText(text,start=$('editor').selectionStart,end=$('editor').selectionEnd){
 if(!text)return false;
 const value=$('editor').value;
 if(!validInput(value.slice(0,start)+text+value.slice(end))){rejectInput();return false;}
 $('editor').setRangeText(text,start,end,'end');rememberSelection();updateEditor();return true;
}
const sprite={base:{url:'font-base.png',w:868,h:711,x:123,y:[76,121,165,209,254,298,343,387,431,476,520,565,609,653]},f0:{url:'font-f0.png',w:867,h:255,x:124,y:[95,139,183]},f4:{url:'font-f4.png',w:865,h:514,x:122,y:[87,132,176,221,265,310,354,398,443]}};
function glyph(e,size,light=false){
 if(e.group==='raw'){
  const unknown=document.createElement('span');unknown.className='glyph unknown-glyph';unknown.textContent='?';unknown.title='Chưa có hình ký tự '+e.hex;unknown.setAttribute('aria-hidden','true');return unknown;
 }
 if(e.hex==='01'){const blank=document.createElement('span');blank.className='glyph narrow-space';blank.setAttribute('aria-hidden','true');return blank;}
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
function paletteGlyph(e,size,light=false){
 if(e.hex==='01'&&!light){const mark=document.createElement('span');mark.className='glyph narrow-marker';mark.textContent='⅓';mark.setAttribute('aria-hidden','true');return mark;}
 // The image stays visible until the actual bundled font loads successfully.
 const fallback=glyph(e,size,light),text=globalThis.SPELL_PALETTE_FONT?.[e.hex];
 if(text===undefined)return fallback;
 const span=light?document.createElement('span'):fallback;
 if(light){span.className='glyph preview-font';span.style.setProperty('--g',size);span.style.width='100%';span.style.height='100%';span.setAttribute('aria-hidden','true');fallback.classList.add('glyph-fallback');span.append(fallback);}
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
function saveDraft(){try{localStorage.setItem('casio-spell-draft',$('editor').value);localStorage.setItem('casio-spell-layout',JSON.stringify({lines:$('line-mode').value,auto:$('auto-layout').checked}));}catch{}}
function setKeyFontSize(value){const size=[16,18,20,22].includes(Number(value))?Number(value):18;$('key-font-size').value=String(size);document.documentElement.style.setProperty('--key-size',size+'px');try{localStorage.setItem('casio-spell-key-size',String(size));}catch{}}
function setGenerating(busy){
 $('generation-loading').hidden=!busy;
 $('generate').querySelector('.button-label').textContent=busy?'Đang tìm dãy base…':'Tạo hướng dẫn';
 if(busy){$('generate').disabled=true;$('generate').setAttribute('aria-busy','true');}
 else $('generate').removeAttribute('aria-busy');
}
function invalidate(){generationVersion++;setGenerating(false);currentGuide=null;$('guide-meta').hidden=true;$('guide').hidden=true;$('guide-placeholder').hidden=false;$('copy-all').disabled=true;$('copy-keys').disabled=true;$('download').disabled=true;$('export-pdf').disabled=true;M?.invalidate();}
function updateEditor(){
 const editor=$('editor');
 if(!validInput(editor.value)){
  editor.value=acceptedInput.value;editor.selectionStart=acceptedInput.start;editor.selectionEnd=acceptedInput.end;
  rememberSelection();rejectInput();return;
 }
 acceptedInput={value:editor.value,start:editor.selectionStart,end:editor.selectionEnd};
 selection={start:editor.selectionStart,end:editor.selectionEnd};
 const previous=M?.capturePreview();saveDraft();invalidate();$('error').hidden=true;
 let layoutError=null;effectiveText=editor.value;
 const automatic=$('auto-layout').checked;$('line-mode').disabled=automatic;
 if(automatic){
  try{const layout=SpellLayout.arrange(editor.value,{compressSpaces:$('compress-spaces').checked});effectiveText=layout.text;$('line-mode').value=String(layout.lines);
   if(layout.lines>1&&!demoUnlocked){pendingMode=String(layout.lines);$('demo-gate').hidden=false;}
   else if(layout.lines===1){$('demo-gate').hidden=true;$('demo-password').value='';}
  }catch(e){layoutError=e;}
 }
 saveDraft();
 const options=spellOptions(),multi=options.lines>1;
 $('multiline-hint').hidden=!multi;$('multiline-hint').textContent=automatic?'Web tự ngắt dòng; xem bố cục ở màn hình bên dưới.':'Mỗi dòng trong ô soạn là một dòng trên máy. Dùng Enter để xuống dòng.';
 editor.rows=multi?options.lines:2;
 editor.placeholder=multi?'Dòng 1\nDòng 2'+(options.lines>2?'\nDòng 3':'')+(options.lines>3?'\nDòng 4':''):'Gõ văn bản hoặc chọn ký tự…';
 const width=thirds=>{const whole=Math.floor(thirds/3),fraction=['','⅓','⅔'][thirds%3];return (whole||!fraction?String(whole):'')+fraction;};
 const rawLines=effectiveText.replace(/\r\n?/g,'\n').split('\n'),inputs=rawLines.map(t=>S.parseText(t));
 let displayLines=[],fitted=inputs.map(a=>S.fitInput(a,options)),plan;
 $('editor').setAttribute('aria-invalid','false');
 try{
  if(layoutError)throw layoutError;
  if(multi){plan=SpellMulti.prepare(effectiveText,{...options,mode:'198'});displayLines=plan.displayLines;fitted=plan.spacing;
  }else{
   if(rawLines.length>1)throw Error('Văn bản có nhiều dòng. Hãy chọn chế độ 2, 3 hoặc 4 dòng.');
   displayLines=[S.prepareLine(inputs[0],options)];
  }
 }catch(e){$('error').textContent=e.message;$('error').hidden=false;$('editor').setAttribute('aria-invalid','true');}
 $('character-count').textContent=fitted.map((f,i)=>(multi?`D${i+1}: `:'')+(f.compressedSpaces?width(f.originalThirds)+' → ':'')+width(f.thirds)+' / 17⅓').join(' · ');
 $('character-count').title='Mỗi dòng tối đa 17⅓ ô; 01 rộng ⅓ ô.';
 $('character-count').classList.toggle('over-limit',fitted.some(f=>!f.fits)||!$('error').hidden);
 const preview=$('preview');preview.classList.toggle('multi-preview',multi);preview.classList.toggle('spell-line',!multi);preview.replaceChildren();
 for(const line of displayLines){
  const row=multi?document.createElement('div'):preview;
  if(multi)row.className='spell-line preview-row';
  row.style.setProperty('--line-cells','17.3333333333');
  for(const e of line){const cell=document.createElement('span');cell.className='spell-cell';cell.classList.toggle('narrow-cell',e.hex==='01');cell.dataset.hex=e.hex;cell.append(paletteGlyph(e,'var(--glyph-size)',true));row.append(cell);}
  if(multi)preview.append(row);
 }
 preview.setAttribute('aria-label','Chữ sẽ spell: '+inputs.map(line=>line.map(e=>e.char||`mã ${e.hex}`).join('')).join('; dòng tiếp: '));
 $('generate').disabled=!$('error').hidden||inputs.flat().every(e=>e.hex==='20'||e.hex==='01');
 M?.preview(previous);if(!$('error').hidden)M?.error();
}
function rememberSelection(){selection={start:$('editor').selectionStart,end:$('editor').selectionEnd};if($('editor').value===acceptedInput.value)Object.assign(acceptedInput,selection);}
function insert(hex,button,touch=false){const origin=M?.captureGlyph(button);showReference(hex);if(!insertText(S.insertion(hex),selection.start,selection.end))return;if(!touch)$('editor').focus({preventScroll:true});M?.fly(origin,hex);M?.reference();}
function characterName(e){return e.hex==='01'?'Khoảng trắng ⅓':e.char===' '?'Dấu cách':e.char||'Ký hiệu';}
function selectGroup(group){activeGroup=group;document.querySelectorAll('[data-group]').forEach(b=>{const active=b.dataset.group===group;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});M?.tab();}
function renderPalette(changed=true){
 const query=$('search').value.trim().normalize('NFC'),q=query.toUpperCase().replace(/^0X/,'');
 const matrix=S.paletteMatrix(activeGroup),fragment=document.createDocumentFragment();let total=0,matches=0;
 const [firstRow,lastRow]={base:[0,14],f0:[1,3],f4:[1,9]}[activeGroup];
 $('glyph-grid').style.setProperty('--grid-rows',String(lastRow-firstRow+2));
 function axis(text){const item=document.createElement('span');item.className='hex-axis';item.textContent=text;return item;}
 fragment.append(axis({base:'00',f0:'F0',f4:'F4'}[activeGroup]));for(let col=0;col<16;col++)fragment.append(axis(col.toString(16).toUpperCase()));
 for(let row=firstRow;row<=lastRow;row++){
  fragment.append(axis(row.toString(16).toUpperCase()));
  for(const {hex,entry:e} of matrix[row]){
   const cell=document.createElement('div');cell.className='glyph-cell';cell.dataset.address=hex;
   if(!e){cell.classList.add('empty','nonstandard');cell.setAttribute('aria-label',`${hex} · Không phải ký tự chuẩn`);}
   else{
    total++;const match=!query||hex.includes(q)||(e.char||'').includes(query)||(S.referenceFor(e).display||'').toLowerCase().includes(query.toLowerCase());if(match)matches++;
    const b=document.createElement('button');b.type='button';b.className='glyph-button';b.dataset.hex=hex;
    b.classList.toggle('dimmed',!!query&&!match);b.classList.toggle('matched',!!query&&match);
    const name=characterName(e);b.title=`${name} · ${hex}`;b.setAttribute('aria-label',`${name} · hex ${hex}`);
    b.append(paletteGlyph(e,'calc(var(--grid-size) / 17 - 1px)'));cell.append(b);
   }
   fragment.append(cell);
  }
 }
 $('glyph-grid').classList.toggle('without-zero-row',activeGroup!=='base');$('glyph-grid').classList.toggle('without-f-row',activeGroup==='base');$('glyph-grid').replaceChildren(fragment);$('shown').textContent=query?`${matches} kết quả trong bảng`:`${total} ký tự`; $('glyph-info').textContent='Chạm ký tự để chèn';
 M?.palette(changed);
}
async function copy(text){try{await navigator.clipboard.writeText(text);notify('Đã sao chép');}catch{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.left='-9999px';document.body.append(area);area.select();const success=document.execCommand('copy');area.remove();notify(success?'Đã sao chép':'Không thể sao chép tự động. Bạn có thể tải TXT.');}}
function renderAssignments(node,rows){
 node.replaceChildren();
 rows.forEach((row,i)=>{
  if(i)node.append(document.createTextNode('\n'));
  const text=row.replaceAll('𝓍',globalThis.SPELL_PALETTE_FONT?.['10']||'𝒙').replaceAll('×10','ˣ₁₀'),equals=text.indexOf('=');
  if(equals<0){node.append(document.createTextNode(text));return;}
  // Variable names stay plain. Only A–F in the numeric value are hex glyphs.
  node.append(document.createTextNode(text.slice(0,equals+1)));
  for(const part of text.slice(equals+1).split(/([A-F]|ˣ₁₀)/)){
   if(!part)continue;
   if(/^[A-F]$/.test(part)){
    const letter=document.createElement('span');letter.className='assignment-hex-letter';
    letter.textContent=String.fromCodePoint(0x1D400+part.charCodeAt(0)-65);node.append(letter);
   }else if(part==='ˣ₁₀'){
    const exponent=document.createElement('span');exponent.className='assignment-exponent';exponent.textContent=part;node.append(exponent);
   }else node.append(document.createTextNode(part));
  }
 });
}
function updateGuideMeta(){
 if(!currentGuide)return;
 const total=currentGuide.steps.length;
 $('guide-meta').textContent=`${total} bước · tổng cộng ${currentGuide.keyCount} nút`;
 $('guide-meta').title='';
 $('guide-meta').hidden=false;
}
function renderGuide(){if(!currentGuide)return;const compact=$('compact').checked,g=currentGuide,root=$('guide');root.replaceChildren();const pre=document.createElement('pre');pre.className='assign-block';renderAssignments(pre,g.assignments);if(g.assignments.length)root.append(pre);
 for(const [index,s] of g.steps.entries()){const section=document.createElement('section');section.className='step';const head=document.createElement('div');head.className='step-head';const title=document.createElement('h3');title.textContent=s.title;const b=document.createElement('button');b.textContent='Sao chép';b.addEventListener('click',()=>copy(S.stepText(s,compact)));const actions=document.createElement('div');actions.className='step-actions';actions.append(b);
 head.append(title,actions);section.append(head);
 for(const part of s.parts||[s]){
  const keys=document.createElement('div');keys.className='step-keys';
  for(const segment of part.segments){const p=document.createElement('p');if(globalThis.SpellKeyFont)SpellKeyFont.renderInto(p,S.formatKeys(segment,compact));else p.textContent=S.formatKeys(segment,compact);keys.append(p);}
  section.append(keys);
  if(part.checkpoint){const details=document.createElement('details');details.className='step-reference';const label=document.createElement('summary');label.textContent='Đối chiếu chuỗi';const check=document.createElement('pre');check.className='step-checkpoint';check.textContent=part.checkpoint;details.append(label,check);section.append(details);}
 }
 root.append(section);}

 const printHeader=document.createElement('div');printHeader.className='print-heading';
 const printTitle=document.createElement('h1');printTitle.textContent='Hướng dẫn spell · fx-580VN X';
 const preview=$('preview').cloneNode(true);preview.removeAttribute('id');preview.classList.add('print-preview');
 printHeader.append(printTitle,preview);root.prepend(printHeader);updateGuideMeta();
 root.hidden=false;$('guide-placeholder').hidden=true;$('copy-all').disabled=false;$('copy-keys').disabled=false;$('download').disabled=false;$('export-pdf').disabled=false;
 M?.guide();
}
function requestDemo(mode){
 pendingMode=String(mode);$('line-mode').value='1';updateEditor();
 $('demo-gate').hidden=false;$('demo-error').hidden=true;$('demo-password').value='';$('demo-password').focus();
}
async function generate(){
 const options=spellOptions();
 if(options.lines>1&&!demoUnlocked){requestDemo(options.lines);return;}
 const version=++generationVersion,text=effectiveText;
 setGenerating(true);
 try{
  // Allow the loading indicator to paint before any synchronous work.
  await new Promise(resolve=>setTimeout(resolve,0));
  if(version!==generationVersion)return;
  const guide=options.lines>1?await demo.generate(text,options):S.generate(text,options);
  if(version!==generationVersion)return;
  currentGuide=S.limitGuideSteps(guide,15);$('error').hidden=true;renderGuide();$('guide-scroll').scrollTop=0;M?.generated();
 }catch(e){
  if(version!==generationVersion)return;
  if(e.status===401){demoUnlocked=false;requestDemo(options.lines);}
  else{invalidate();$('generate').disabled=false;$('error').textContent=e.message;$('error').hidden=false;M?.error();}
 }finally{if(version===generationVersion){setGenerating(false);$('generate').disabled=$('editor').getAttribute('aria-invalid')==='true'||!$('editor').value.trim();}}
}
$('demo-form').addEventListener('submit',async e=>{
 e.preventDefault();if($('demo-submit').disabled)return;
 const version=++unlockVersion,password=$('demo-password').value;
 $('demo-submit').disabled=true;$('demo-error').hidden=true;
 try{
  await demo.unlock(password);
  if(version!==unlockVersion)return;
  demoUnlocked=true;$('demo-gate').hidden=true;$('demo-password').value='';$('line-mode').value=pendingMode;updateEditor();$('editor').focus();
 }catch(error){if(version===unlockVersion){$('demo-error').textContent=error.message;$('demo-error').hidden=false;$('demo-password').focus();}}
 finally{if(version===unlockVersion)$('demo-submit').disabled=false;}
});
function cancelDemo(){unlockVersion++;$('demo-submit').disabled=false;$('demo-gate').hidden=true;$('demo-password').value='';$('line-mode').focus();}
function cancelDemoRequest(){if($('auto-layout').checked){$('auto-layout').checked=false;$('line-mode').value='1';updateEditor();}cancelDemo();}
$('demo-cancel').addEventListener('click',cancelDemoRequest);
$('demo-password').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();cancelDemoRequest();}});
async function exportPDF(){
 if(!currentGuide)return;
 const guide=currentGuide,button=$('export-pdf');button.disabled=true;
 try{
  // Wait for both bundled fonts; fallback text stays readable on load failure.
  if(document.fonts?.ready)await document.fonts.ready;
  if(currentGuide!==guide)return;
  if(typeof globalThis.print!=='function'){notify('Trình duyệt này chưa hỗ trợ in. Hãy mở bằng Chrome, Edge hoặc Firefox.');return;}
  globalThis.print();
 }catch{notify('Chưa mở được hộp thoại PDF. Hãy thử lại.');}
 finally{button.disabled=!currentGuide;}
}
$('export-pdf').addEventListener('click',exportPDF);
function formulasText(variants){return variants.map(keys=>S.formatKeys(keys)).join(' hoặc ');}
function showReference(hex){
 selectedHex=hex;const e=S.byHex.get(hex),r=S.referenceFor(e),char=characterName(e);
 $('reference-selected').textContent=hex+' · '+char;$('reference-title').textContent='Hex '+hex+' · '+char;
 $('reference-glyph').replaceChildren(glyph(e,'30px'));
 $('reference-token').textContent=hex==='01'?'Rộng ⅓ dấu cách (20)':r.display?'Khi nhập trên máy: '+r.display:(r.must_pack?'Ký tự hai byte':'');
 const absent=r.formula_status==='documented'?'Không':'PDF không nêu';
 const renderFormula=(id,text)=>globalThis.SpellKeyFont?SpellKeyFont.renderInto($(id),text):($(id).textContent=text);
 renderFormula('formula-one',r.formula1.length?formulasText(r.formula1):absent);
 renderFormula('formula-two',r.formula2.length?formulasText(r.formula2)+' · cần bộ chuyển đổi (FDFD / Cache Area)':absent);
 const notes=[];
 if(r.correction)notes.push('Áp dụng: '+formulasText(r.effective_formula1)+'. '+r.correction);
 if(r.source_note)notes.push(r.source_note);
 if(r.spell_override)notes.push('Trong spell một dòng, dấu cách dùng '+S.formatKeys(r.spell_override.keys)+' (2 byte).');
 else if(r.must_pack)notes.push('Ký tự hai byte; có thể ghép cặp tiền tố F khi đủ điều kiện.');
 else if(!S.directKeys(e)&&r.formula2.length)notes.push('Trong luồng spell hiện tại: gán hex. Chế độ nhiều dòng có thể dùng Cache Area để chuyển CT2.');
 else if(!S.directKeys(e))notes.push('Gán hex vào biến.');
 else notes.push('Dùng công thức 1 khi viết token, không cần gán hex.');
 $('reference-note').textContent=notes.join(' ');
 $('reference-source').hidden=!r.source_page;
 if(r.source_page){$('reference-source').href='all.pdf#page='+r.source_page;$('reference-source').textContent='PDF · tr. '+r.source_page+' ↗';}
}
$('copy-formulas').addEventListener('click',()=>{const r=S.referenceFor(S.byHex.get(selectedHex)),absent=r.formula_status==='documented'?'Không':'PDF không nêu';copy('Hex '+r.hex+' · '+(r.char||'Ký hiệu')+'\nCông thức 1: '+(formulasText(r.formula1)||absent)+'\nCông thức 2 (cần FDFD): '+(formulasText(r.formula2)||absent)+(r.correction?'\n'+r.correction:'')+(r.spell_override?'\nDấu cách trong spell: '+S.formatKeys(r.spell_override.keys):''));});
$('editor').addEventListener('beforeinput',e=>{
 rememberSelection();
 if(composing||e.isComposing||!e.cancelable)return;
 const editor=$('editor');
 const data=e.inputType==='insertLineBreak'||e.inputType==='insertParagraph'?'\n':e.data;
 if(typeof data==='string'&&e.inputType?.startsWith('insert')&&!validInput(editor.value.slice(0,editor.selectionStart)+data+editor.value.slice(editor.selectionEnd))){e.preventDefault();rejectInput();}
});
$('editor').addEventListener('paste',e=>{
 if(composing)return;const text=e.clipboardData?.getData('text/plain');if(text===undefined)return;
 e.preventDefault();if(!composing)insertText(text);
});
$('editor').addEventListener('compositionstart',()=>{rememberSelection();composing=true;});
$('editor').addEventListener('compositionend',()=>{composing=false;updateEditor();});
$('editor').addEventListener('input',e=>{if(!composing&&!e.isComposing)updateEditor();});
for(const event of ['select','click','keyup','blur'])$('editor').addEventListener(event,rememberSelection);
for(const id of ['center','compress-spaces','auto-layout'])$(id).addEventListener('change',()=>{const hadGuide=!!currentGuide;updateEditor();if(hadGuide&&!$('generate').disabled)generate();});
$('line-mode').addEventListener('change',()=>{
 const mode=$('line-mode').value;
 if(Number(mode)>1&&!demoUnlocked){requestDemo(mode);return;}
 cancelDemo();const hadGuide=!!currentGuide;updateEditor();if(hadGuide&&!$('generate').disabled)generate();
});
$('glyph-grid').addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.target.closest('button'))e.preventDefault();});
$('glyph-grid').addEventListener('click',e=>{
 const button=e.target.closest('button[data-hex]');
 // Touch selection must not reopen the software keyboard or move the page.
 const touch=e.pointerType==='touch'||e.pointerType==='pen'||(e.detail>0&&globalThis.matchMedia?.('(pointer: coarse)').matches);
 if(button)insert(button.dataset.hex,button,touch);
});
for(const event of ['pointerover','focusin'])$('glyph-grid').addEventListener(event,e=>{const b=e.target.closest('button[data-hex]');if(b){$('glyph-info').textContent=b.title;showReference(b.dataset.hex);}});
$('search').addEventListener('input',()=>{const previousGroup=activeGroup,q=$('search').value.trim().toUpperCase().replace(/^0X/,'');if(/^F[04][0-9A-F]{0,2}$/.test(q))selectGroup(q.startsWith('F4')?'f4':'f0');renderPalette(previousGroup!==activeGroup);});
document.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{selectGroup(b.dataset.group);renderPalette();}));
$('clear').addEventListener('click',()=>{$('editor').value='';$('editor').selectionStart=$('editor').selectionEnd=0;selection={start:0,end:0};updateEditor();$('editor').focus();});
$('generate').addEventListener('click',async()=>{
 await generate();
 if(currentGuide&&globalThis.matchMedia?.('(max-width: 1100px)').matches){
  $('guide-section').focus({preventScroll:true});
  $('guide-section').scrollIntoView?.({behavior:'auto',block:'start'});
 }
});$('compact').addEventListener('change',renderGuide);$('copy-all').addEventListener('click',()=>{if(currentGuide)copy(S.guideText(currentGuide,$('compact').checked));});
$('copy-keys').addEventListener('click',()=>{
 if(!currentGuide)return;
 const compact=$('compact').checked;
 const segments=currentGuide.steps.flatMap(step=>(step.parts||[step]).flatMap(part=>part.segments));
 return copy(segments.map(keys=>S.formatKeys(keys,compact)).join('\n'));
});
$('download').addEventListener('click',()=>{if(!currentGuide)return;const blob=new Blob(['\ufeff'+S.guideText(currentGuide,$('compact').checked)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='huong-dan-spell.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('key-font-size').addEventListener('change',e=>setKeyFontSize(e.target.value));
try{setKeyFontSize(localStorage.getItem('casio-spell-key-size'));}catch{setKeyFontSize(18);}
try{const layout=JSON.parse(localStorage.getItem('casio-spell-layout')||'{}');$('auto-layout').checked=layout.auto===true;if(['2','3','4'].includes(layout.lines))pendingMode=layout.lines;}catch{}
try{const saved=localStorage.getItem('casio-spell-draft');if(saved!==null)$('editor').value=validInput(saved)?saved:'';}catch{}
$('editor').selectionStart=$('editor').selectionEnd=$('editor').value.length;selection={start:$('editor').value.length,end:$('editor').value.length};renderPalette();updateEditor();showReference(selectedHex);M?.boot();
loadPaletteFont();
demo.status().then(state=>{const changed=demoUnlocked!==(state.unlocked===true);demoUnlocked=state.unlocked===true;if(demoUnlocked)$('demo-gate').hidden=true;if(changed&&$('auto-layout').checked)updateEditor();}).catch(()=>{});

$('editor').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&!composing&&!$('generate').disabled){e.preventDefault();$('generate').click();}});
