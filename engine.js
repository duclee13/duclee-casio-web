/* Casio spell: physical-key optimization, including confirmed F4F4 recipes. */
(function (root) {
'use strict';
const D=root.SPELL_DATA, PDF=root.PDF_REFERENCE, repeat=(a,n)=>Array.from({length:n},()=>a).flat();
const isWide=hex=>hex.startsWith('F');
// Work in thirds to avoid rounding errors: 01 occupies one third of a cell.
const DISPLAY_CAPACITY=17, COMPLETE_CELLS=17, MAX_LINE_THIRDS=52;
const cellThirds=e=>e.hex==='01'?1:3;
const lineThirds=line=>line.reduce((n,e)=>n+cellThirds(e),0);
function paletteMatrix(group){
 const prefix={base:'',f0:'F0',f4:'F4'}[group];
 if(prefix===undefined)throw Error('Bảng ký tự không hợp lệ.');
 return Array.from({length:16},(_,row)=>Array.from({length:16},(_,col)=>{const hex=prefix+(row*16+col).toString(16).toUpperCase().padStart(2,'0');const entry=byHex.get(hex);return {hex,entry:entry?.group===group||(group==='base'&&hex==='01')?entry:null};}));
}
function fitInput(input,{compressSpaces=true}={}){
 const originalThirds=lineThirds(input),tokens=[],spaces=input.filter(e=>e.hex==='20').length;
 const fixedThirds=originalThirds-spaces*3;
 // All original 20 spaces share the largest width (3, 2 or 1 thirds)
 // that fits. Explicit 01 tokens and all non-space characters stay intact.
 const spaceThirds=compressSpaces&&spaces?Math.max(1,Math.min(3,Math.floor((MAX_LINE_THIRDS-fixedThirds)/spaces))):3;
 const compressedSpaces=spaceThirds<3?spaces:0;
 for(const entry of input){
  if(spaceThirds<3&&entry.hex==='20'){
   tokens.push(...repeat([byHex.get('01')],spaceThirds));
  }else tokens.push(entry);
 }
 const thirds=lineThirds(tokens);
 return {tokens,originalThirds,thirds,compressedSpaces,spaceThirds,fits:thirds<=MAX_LINE_THIRDS};
}
function prepareLine(input,{center=true,compressSpaces=true}={}){
 const fitted=fitInput(input,{compressSpaces});
 if(!fitted.fits)throw Error(compressSpaces?'Văn bản dài hơn một dòng dù đã co dấu cách về tối thiểu 01. Hãy rút ngắn nội dung.':'Văn bản dài hơn một dòng. Bật “Tự co dấu cách” hoặc rút ngắn nội dung.');
 const remaining=Math.floor((MAX_LINE_THIRDS-fitted.thirds)/3),left=center?Math.floor(remaining/2):0;
 return [...repeat([byHex.get('20')],left),...fitted.tokens,...repeat([byHex.get('20')],remaining-left)];
}
const entries=[];
for(let n=0x10;n<=0xEC;n++) entries.push({hex:n.toString(16).toUpperCase(),group:'base',offset:n-0x10});
for(let n=0x10;n<=0x31;n++) entries.push({hex:'F0'+n.toString(16).toUpperCase(),group:'f0',offset:n-0x10});
for(let n=0x10;n<=0x95;n++) entries.push({hex:'F4'+n.toString(16).toUpperCase(),group:'f4',offset:n-0x10});
const byHex=new Map(entries.map(e=>[e.hex,e]));
// Explicit narrow space; not part of the supplied 10–EC palette bank.
byHex.set('01',{hex:'01',group:'special',char:null});
// Explicitly confirmed by the user; no display glyph supplied yet.
byHex.set('F060',{hex:'F060',group:'raw',char:null});
for(const [char,hex] of Object.entries(D.ALL_HEX)) if(byHex.has(hex)) byHex.get(hex).char=char;
// Unicode aliases are input aids; the supplied bitmap remains the visual source of truth.
const extras={10:'𝓍',11:'𝓎',12:'𝓏',13:'…',14:'▴',15:'▾',16:'▸',17:'₋',18:'$',19:'◁','1A':'&','1B':'𝓽','1C':'ᴛ','1D':'ₜ','1E':'ₕ','1F':'₅',82:'ₓ',86:'ʳ',87:'ᵍ','8B':'𝑥̂','8C':'𝑦̂',90:'ˣ',91:'₁₀',92:'▔',93:'┘',97:'⇩',98:'√',99:'∫','9A':'ᴀ','9B':'ʙ','9C':'ᴄ','9D':'ₙ','9E':'▶','9F':'◀',A0:'₀',A1:'₁',A2:'₂',A3:'₃',A4:'₄',A5:'₅',A6:'₆',A7:'₇',A8:'₈',A9:'₉',AA:'⁻¹',AB:'ˣ',AC:'¹⁰',AD:'₍',AE:'₎',AF:'±',B0:'₀',B1:'₁',B2:'₂',B3:'₋₁',B4:'ꜰ',B5:'ɴ',B6:'ᴘ',B7:'μ',B8:'𝐀',B9:'𝐁',BA:'𝐂',BB:'𝐃',BC:'𝐄',BD:'𝐅',BE:'ℙ',BF:'▷',C0:'Σ',C1:'α',C2:'γ',C3:'ε',C4:'θ',C5:'λ',C6:'μ',C7:'π',C8:'σ',C9:'φ',CA:'ℓ',CB:'ℏ',CE:'₃',CF:'▁',D0:'f',D1:'p',D2:'n',D3:'μ',D4:'m',D5:'k',D6:'M',D7:'G',D8:'T',D9:'P',DA:'E',DB:'F',DC:'ₚ',DD:'ₑ',DE:'ⱼ',DF:'ₖ',E0:'τ',E1:'ᵤ',E2:'₉',E3:'Å',E4:'ₘ',E5:'ɪ',E6:'₄',E9:'└',EA:'↶',EB:'↥',EC:'ⁿ',F010:'c',F011:'a',F012:'Lₜ',F013:'ₕ',F014:'ℳ',F015:'g',F016:'℧',F017:'▶',F018:'ℳ',F019:'k',F01A:'g',F01B:'℧',F01C:'尺',F01D:'寸',F01E:'分',F01F:'間',F020:'町',F021:'里',F022:'海',F023:'丈',F024:'毛',F025:'厘',F026:'歩',F027:'勺',F028:'坪',F029:'畝',F02A:'反',F02B:'升',F02C:'合',F02D:'斗',F02E:'石',F02F:'貫',F030:'匁',F031:'斤'};
extras['7C']='|';
for(const [hex,char] of Object.entries(extras)) if(byHex.has(hex)&&!byHex.get(hex).char) byHex.get(hex).char=char;
// Prefer the existing spell table when Unicode characters occur at multiple hex addresses.
const inputMap=new Map();
for(const e of entries) if(e.char&&!inputMap.has(e.char)) inputMap.set(e.char,e.hex);
for(const [char,hex] of Object.entries(D.ALL_HEX)) inputMap.set(char,hex);
const inputChars=[...inputMap.keys()].sort((a,b)=>b.length-a.length);
function insertion(hex){const e=byHex.get(hex);return e?.char&&inputMap.get(e.char)===hex?e.char:`{${hex}}`;}
function parseText(raw,{allowUnknown=false}={}){
 const text=raw.normalize('NFC'), out=[];let i=0;
 while(i<text.length){
  const tag=text.slice(i).match(/^\{([0-9A-Fa-f]{2}|[Ff][0-9A-Fa-f]{3})\}/);
  if(tag){const hex=tag[1].toUpperCase();if(!byHex.has(hex)&&!allowUnknown)throw Error(`Mã ${hex} không nằm trong ba bảng ký tự đã cung cấp.`);out.push(byHex.get(hex)||{hex,char:tag[0]});i+=tag[0].length;continue;}
  const char=inputChars.find(c=>text.startsWith(c,i));
  if(!char){const unknown=String.fromCodePoint(text.codePointAt(i));if(!allowUnknown)throw Error(`Chưa có ký tự “${unknown}” trong bảng. Chọn ký tự từ bảng bên dưới.`);out.push({hex:null,char:unknown});i+=unknown.length;continue;}
  out.push(byHex.get(inputMap.get(char)));i+=char.length;
 }
 return out;
}
function referenceFor(e){
 const row=PDF.rows[e.hex];
 return {hex:e.hex,char:e.char||null,group:e.group,display:row?.display??null,
  formula1:row?.formula1||[],formula2:row?.formula2||[],
  effective_formula1:row?.effective_formula1||row?.formula1||[],
  formula_status:row?'documented':'not_listed',
  source:row?'all.pdf':e.group==='f4'?'all.pdf':'Ảnh bảng F0',
  source_page:row?.source_page??(e.group==='f4'?24:null),
  correction:row?.correction||null,source_note:row?.source_note||null,
  formula2_requires:row?.formula2.length?'FDFD':null,
  must_pack:isWide(e.hex),
  spell_override:e.hex==='20'?{keys:D.CHARS_KEY[' '],bytes:2,source:'Quy tắc spell một dòng đã thống nhất'}:null};
}
function directKeys(e){
 if(isWide(e.hex))return null;
 // The spell-specific space remains the two-byte SHIFT 8 3 4, not a bare 20.
 if(e.hex==='20')return D.CHARS_KEY[' '];
 const row=PDF.rows[e.hex],variants=row?.effective_formula1||row?.formula1;return variants?.length?variants.reduce((a,b)=>b.length<a.length?b:a):null;
}
// A suffix must be a single raw byte from CT1. In particular, the spell-space
// override (SHIFT 834, two bytes) cannot stand in for a raw suffix 20.
function f4SuffixKeys(hex){
 if(!/^[0-9A-E][0-9A-F]$/.test(hex))return null;
 const row=PDF.rows[hex],variants=row?.effective_formula1||row?.formula1;
 return variants?.length?variants.reduce((a,b)=>b.length<a.length?b:a).slice():null;
}
// CT2 suffix recovery is a distinct, confirmed F4F4 recipe, not raw typing.
function f4ConversionKeys(hex){
 if(!/^[0-9A-E][0-9A-F]$/.test(hex))return null;
 const variants=PDF.rows[hex]?.formula2;
 return variants?.length?variants.reduce((a,b)=>b.length<a.length?b:a).slice():null;
}
function f4Choices(tokens,t){
 const left=tokens[t];if(!/^F[0-9A-F]{3}$/.test(left))return [];
 const prefix=left.slice(0,2);
 const leftKeys=f4SuffixKeys(left.slice(2)),ct2Keys=f4ConversionKeys(left.slice(2)),choices=[];
 if(ct2Keys)choices.push({kind:'ct2-single',size:1,bytes:[prefix,prefix],left,ct2Keys,extra:8+ct2Keys.length});
 if(!leftKeys)return choices;
 choices.push({kind:'single',size:1,bytes:[prefix,prefix],left,leftKeys,extra:4+leftKeys.length});
 const right=tokens[t+1];if(!/^F[0-9A-F]{3}$/.test(right||''))return choices;
 const rightKeys=f4SuffixKeys(right.slice(2));
 if(rightKeys)choices.push({kind:'pair',size:2,bytes:[prefix,right.slice(0,2)],left,right,leftKeys,rightKeys,extra:1+leftKeys.length+rightKeys.length});
 // No CT2 conversion: the second suffix is already assigned as a raw byte.
 choices.push({kind:'assigned-right',size:2,bytes:[prefix,right.slice(0,2),right.slice(2)],left,right,leftKeys,extra:2+leftKeys.length});
 return choices;
}
function conversionKeys(hex,{context}={}){
 if(context!=='FDFD')throw Error('Công thức 2 cần bộ chuyển đổi FDFD; không dùng như phím nhập trực tiếp.');
 const variants=PDF.rows[hex]?.formula2;
 if(!variants?.length)throw Error(`Không có công thức 2 cho hex ${hex}.`);
 return variants.reduce((best,k)=>k.length<best.length?k:best).slice();
}
const PDF_BOLD_KEYS=Object.fromEntries([...'ABCDEF'].map((c,i)=>[c,conversionKeys((0x3A+i).toString(16).toUpperCase(),{context:'FDFD'})]));
const PDF_EXTRACT_KEYS=Object.fromEntries([...'ABC'].map((c,i)=>[c,conversionKeys((0x4D+i).toString(16).toUpperCase(),{context:'FDFD'})]));
function fits(byte,rule){return [...rule].every((c,i)=>c==='_'||/\d/.test(byte[i]));}
function packHex(values){
 const raw=(Array.isArray(values)?values.join(''):values).replace(/\s/g,'').toUpperCase();
 if(!/^(?:[0-9A-F]{2})*$/.test(raw))throw Error('Mã hex phải gồm từng cặp 0–9/A–F.');
 const tokens=[];for(let i=0;i<raw.length;){const n=raw[i]==='F'?4:2;if(i+n>raw.length)throw Error('Ký tự F… phải có đủ hai byte.');tokens.push(raw.slice(i,i+n));i+=n;}tokens.push('3C','23');
 const memo=new Map();
 function solve(t,p){if(t===tokens.length)return [];if(p>=D.SLOTS.length)return null;const id=t+','+p;if(memo.has(id))return memo.get(id);
  const parts=tokens[t].match(/../g);let best=null;const end=p+parts.length;
  if(end<=D.SLOTS.length&&D.SLOTS[p][0]===D.SLOTS[end-1][0]&&parts.every((b,i)=>fits(b,D.SLOTS[p+i][2]))){const rest=solve(t+1,end);if(rest)best=parts.map(value=>({value,padding:false,token:t})).concat(rest);}
  const rest=solve(t,p+1);if(rest){const padded=[{value:'20',padding:true,token:null},...rest];if(!best||padded.length<best.length)best=padded;}
  memo.set(id,best);return best;
 }
 const cells=solve(0,0);if(!cells)throw Error('Không đủ chỗ trong A/B/C sau khi chèn hex đệm. Hãy rút ngắn câu hoặc chọn thêm ký tự có phím trực tiếp.');
 return {tokens,cells,count:D.SLOTS[cells.length-1][0]+1,padding:cells.filter(c=>c.padding).length};
}
function variableCells(r,v){const start=v===0?0:v===1?6:14;return r.cells.slice(start,start+D.TEMPLATES[v][2].length);}
function assignmentLines(r){const rows=['𝓍'];for(let v=0;v<r.count;v++){const [name,prefix,rules]=D.TEMPLATES[v],cells=variableCells(r,v),parts=[];
 for(let i=0;i<cells.length;i++){if(i===rules.length-1)parts.push('×10');const c=cells[i];if(c.value.startsWith('F')&&!c.padding&&i+1<rules.length-1&&cells[i+1]?.token===c.token){parts.push(c.value+cells[++i].value);}else parts.push(c.value);}
 rows.push(name+' = '+prefix+(v===0?' ':'')+parts.join(' '));}
 return rows.map((s,i)=>s+(i<rows.length-1?':':''));}
function valueKeys(r,v){const [_,prefix,rules]=D.TEMPLATES[v],keys=[...prefix].flatMap(c=>D.TTK[c]);variableCells(r,v).forEach((cell,i)=>{if(i===rules.length-1)keys.push('EXP');keys.push(...[...cell.value].map(c=>PDF_BOLD_KEYS[c]?'RIGHT':c));});return keys;}
function boldChars(r){return [...r.cells.map(c=>c.value).join('')].filter(c=>PDF_BOLD_KEYS[c]);}
function cleanupUnits(r){const out=[];for(let v=0;v<r.count;v++){if(v)for(const token of r.boundaries?.[v===1?6:14]||[null,null])out.push({hex:'01',padding:token===null,token,boundary:true});const cells=variableCells(r,v);for(let i=0;i<cells.length;i++){const c=cells[i];if(c.value.startsWith('F')&&!c.padding){if(cells[i+1]?.token!==c.token)throw Error('Ký tự hai byte bị tách.');out.push({hex:c.value+cells[++i].value,padding:false});}else out.push({hex:c.value,padding:c.padding,hidden:c.token===r.tokens.length-1});}}return out;}
function cleanupKeys(r){if(r.f4Macros)throw Error('F4F4 cần xử lý bằng editPlan trước khi xóa rác.');const units=cleanupUnits(r);if(!units.some(u=>u.padding))return ['RIGHT'];let pending=0;const keys=[];for(const u of units.slice().reverse()){if(u.padding){keys.push(...repeat(['LEFT'],pending),'DEL');pending=0;}else pending++;}keys.push(...repeat(['LEFT'],pending));return keys;}
function formatKeys(keys,compact=true){if(!compact)return keys.map(k=>`[${D.KEYBOARD[k]}]`).join(' ');
 function find(a,i){let best=null;for(const [n,min] of [[1,5],[2,4],[3,3]]){if(a.length-i<n*min)continue;const block=a.slice(i,i+n);if(block.some(x=>/×\d+$/.test(x)))continue;let count=1;while(block.every((x,j)=>a[i+count*n+j]===x))count++;if(count>=min&&(!best||n*count>best.covered))best={covered:n*count,block,count};}return best;}
 const items=[];let digits=[];
 function flush(){let pending=[];for(let i=0;i<digits.length;){const r=find(digits,i);if(r){if(pending.length)items.push('['+pending.join('')+']');pending=[];items.push('['+r.block.join('')+']×'+r.count);i+=r.covered;}else pending.push(digits[i++]);}if(pending.length)items.push('['+pending.join('')+']');digits=[];}
 for(const k of keys){if(/^\d$/.test(k))digits.push(k);else{flush();items.push(`[${D.KEYBOARD[k]}]`);}}flush();const out=[];for(let i=0;i<items.length;){const r=find(items,i);if(r){out.push((r.block.length>1?'('+r.block.join(' ')+')':r.block[0])+'×'+r.count);i+=r.covered;}else out.push(items[i++]);}return out.join(' ');
}
// Search packing and editing together. Costs count physical keys, before formatting.
const keyCount=g=>g.steps.reduce((n,s)=>n+s.segments.reduce((m,k)=>m+k.length,0),0);
function targetGaps(line){
 const tokens=[],blocks=[[]];
 for(const e of line){const keys=directKeys(e);if(keys)blocks.at(-1).push(e);else{tokens.push(e.hex);blocks.push([]);}}
 return {tokens,blocks};
}
function routeCost(mode,gap,junk,blocks,k){
 const length=blocks[gap].length,typing=blocks[gap].reduce((n,e)=>n+directKeys(e).length,0);
 if(mode.kind==='reverse'&&gap<mode.turn)return junk||length?Infinity:0;
 // On a backward pass delete junk now, but insert new tokens only on the
 // forward pass. This avoids walking across the newly inserted tokens twice.
 return typing+junk*(mode.kind==='forward'||(mode.kind==='wrap'&&gap<mode.turn)?2:1);
}
function routeBase(mode,k){return mode.kind==='forward'?1+k:mode.kind==='reverse'?2+2*(k-mode.turn):5+3*k-2*mode.turn;}
function allocationCost(parts,p){return parts.reduce((n,byte,i)=>n+2+(D.SLOTS[p+i][1]===D.TEMPLATES[D.SLOTS[p+i][0]][2].length-1?1:0)+[...byte].reduce((s,c)=>s+(PDF_BOLD_KEYS[c]?PDF_BOLD_KEYS[c].length+D.BOLD_RECOVER.length:0),0),0);}
function optimizePacking(line,{f4=false,allowEmpty=false}={}){
 const {tokens:required,blocks}=targetGaps(line),tokens=[...required,'3C','23'],k=required.length;
 // Expand each F4F4 before touching anything to its right. Backward cleanup of
 // an unexpanded F4F4 + xx would change byte grouping or corrupt it on DEL.
 const modes=f4?[{kind:'forward'}]:[{kind:'forward'},...blocks.map((_,turn)=>({kind:'reverse',turn})),...blocks.map((_,turn)=>({kind:'wrap',turn}))],candidates=[];
 for(let count=1;count<=3;count++){
  const start=[0,6,14][count-1],limit=[6,14,22][count-1];let best=null;
  for(const mode of modes){
   const memo=new Map(),gapScore=(t,j)=>t<=k?routeCost(mode,t,j,blocks,k):(j?Infinity:0);
   function solve(t,p,j,boundaryDone=false){
    if(t===tokens.length)return p>start?{cost:0,cells:[],boundaries:{},f4Macros:{}}:null;
    if(p>=limit||(!f4&&tokens.slice(t).reduce((n,h)=>n+h.length/2,0)>limit-p+2*((count>1&&p<=6?1:0)+(count>2&&p<=14?1:0))))return null;
    const id=[t,p,j,+boundaryDone].join(',');if(memo.has(id))return memo.get(id);let chosen=null;
    function offer(rest,extra,cells=[],boundaries={},macros={}){if(rest&&Number.isFinite(extra)){const cost=extra+rest.cost;if(!chosen||cost<chosen.cost)chosen={cost,cells:[...cells,...rest.cells],boundaries:{...boundaries,...rest.boundaries},f4Macros:{...macros,...rest.f4Macros}};}}
    if((p===6||p===14)&&!boundaryDone){
     for(let mask=0;mask<4;mask++){
      let next=t,trash=j,cost=0;const kept=[];let valid=true;
      for(let b=0;b<2;b++)if(mask&(1<<b)){
       if(next>=k||tokens[next]!=='01'){valid=false;break;}cost+=gapScore(next,trash);kept.push(next++);trash=0;
      }else{kept.push(null);trash++;}
      if(valid)offer(solve(next,p,trash,true),cost,[],{[p]:kept});
     }
    }else{
     const parts=tokens[t].match(/../g),end=p+parts.length;
     if(end<=limit&&D.SLOTS[p][0]===D.SLOTS[end-1][0]&&parts.every((b,i)=>fits(b,D.SLOTS[p+i][2])))
      offer(solve(t+1,end,0),allocationCost(parts,p)+gapScore(t,j),parts.map(value=>({value,padding:false,token:t})));
     if(f4&&t<k)for(const choice of f4Choices(required,t)){
      const bytes=choice.bytes,end=p+bytes.length;
      if(end<=limit&&D.SLOTS[p][0]===D.SLOTS[end-1][0]&&bytes.every((b,i)=>fits(b,D.SLOTS[p+i][2])))
       offer(solve(t+choice.size,end,0),allocationCost(bytes,p)+gapScore(t,j)+choice.extra+(choice.size===2?gapScore(t+1,0):0),
        bytes.map((value,i)=>({value,padding:false,token:t+(i===2?1:0)})),{},{[t]:choice});
     }
     // Never insert padding between the two end markers.
     if(t<=k)offer(solve(t,p+1,j+1),allocationCost(['20'],p),[{value:'20',padding:true,token:null}]);
    }
    memo.set(id,chosen);return chosen;
   }
   const result=solve(0,0,0);
   if(result){result.cost+=routeBase(mode,k);if(!best||result.cost<best.cost)best={...result,mode};}
  }
  if(best)candidates.push({tokens,cells:best.cells,count,padding:best.cells.filter(c=>c.padding).length,boundaries:best.boundaries,route:best.mode,...(Object.keys(best.f4Macros).length?{f4Macros:best.f4Macros}:{})});
 }
 if(!candidates.length&&!allowEmpty)throw Error('Không đủ chỗ trong A/B/C sau khi chèn hex đệm. Hãy rút ngắn câu hoặc chọn thêm ký tự có phím trực tiếp.');
 return candidates;
}
function editPlan(r,line){
 if(r.f4Macros)return f4EditPlan(r,line);
 const {tokens,blocks}=targetGaps(line),k=tokens.length,junk=Array(k+1).fill(0);let t=0;
 for(const u of cleanupUnits(r))if(u.padding)junk[t]++;else if(t<k){if(u.hex!==tokens[t])throw Error('Thứ tự token không khớp.');t++;}
 const modes=r.route?[r.route]:[{kind:'forward'},...blocks.map((_,turn)=>({kind:'reverse',turn})),...blocks.map((_,turn)=>({kind:'wrap',turn}))];
 const mode=modes.reduce((best,m)=>{const cost=routeBase(m,k)+junk.reduce((n,j,i)=>n+routeCost(m,i,j,blocks,k),0);return !best||cost<best.cost?{...m,cost}:best;},null);
 const keys=[],operations=[],remaining=junk.slice();
 const move=(key,n=1)=>{for(let i=0;i<n;i++){keys.push(key);operations.push({key});}};
 const type=i=>{for(const e of blocks[i]){const sequence=directKeys(e);keys.push(...sequence);operations.push({insert:e.hex,keys:sequence.slice()});}};
 const erase=i=>{move('DEL',remaining[i]);remaining[i]=0;};
 const forward=i=>{move('RIGHT',remaining[i]);erase(i);type(i);};
 if(mode.kind==='forward'){
  move('RIGHT');for(let i=0;i<=k;i++){forward(i);if(i<k)move('RIGHT');}
 }else{
  move('LEFT',2);
  for(let i=k;i>mode.turn;i--){erase(i);move('LEFT');}
  erase(mode.turn);
  if(mode.kind==='reverse'){
   type(mode.turn);for(let i=mode.turn+1;i<=k;i++){move('RIGHT');forward(i);}
  }else{
   move('RIGHT',k-mode.turn+3); // Remaining anchors, 3C, invisible 23, wrap.
   for(let i=0;i<=k;i++){forward(i);if(i<k)move('RIGHT');}
  }
 }
 if(keys.length!==mode.cost)throw Error('Chi phí con trỏ không khớp.');
 return {keys,operations,mode,junk};
}

function f4EditPlan(r,line){
 const {tokens,blocks}=targetGaps(line),source=cleanupUnits(r),keys=[],operations=[];let at=0;
 const move=(key,n=1)=>{for(let i=0;i<n;i++){keys.push(key);operations.push({key});}};
 const insert=(hex,sequence,byte=false)=>{keys.push(...sequence);operations.push({[byte?'insertByte':'insert']:hex,keys:sequence.slice()});};
 const type=i=>{for(const e of blocks[i])insert(e.hex,directKeys(e));};
 const consume=hex=>{if(source[at]?.padding||source[at]?.hex!==hex)throw Error('Thứ tự byte cặp tiền tố F không khớp.');at++;};
 const clear=()=>{let n=0;while(source[at]?.padding){n++;at++;}move('RIGHT',n);move('DEL',n);};
 // RIGHT at the end wraps without walking backwards through F4F4/xx/3C.
 move('RIGHT');
 for(let t=0;t<tokens.length;){
  clear();type(t);const macro=r.f4Macros[t];
  if(!macro){consume(tokens[t]);move('RIGHT');t++;continue;}
  consume(macro.left.slice(0,2)+(macro.right||macro.left).slice(0,2));move('RIGHT');
  if(macro.kind==='ct2-single'){
   // The final RIGHT is mandatory: after the last DEL, typing is unsafe.
   // This forward editor needs the cursor after the recovered character.
   const sequence=[...macro.ct2Keys,'LEFT','9','DEL','LEFT','RIGHT','9','DEL','RIGHT'];
   keys.push(...sequence);operations.push({convertF4:macro.left,keys:sequence,exit:'RIGHT'});
   t++;continue;
  }
  if(macro.kind==='assigned-right'){consume(macro.right.slice(2));move('RIGHT');}
  else insert((macro.right||macro.left).slice(2),macro.rightKeys||macro.leftKeys,true);
  move('LEFT');
  if(macro.kind==='single'){
   // LEFT DEL alone discards both F4 bytes. Complete F439 before deleting it.
   insert('39',['9'],true);move('DEL');
  }else{
   insert(macro.left.slice(2),macro.leftKeys,true);type(t+1);
  }
  move('RIGHT');t+=macro.size;
 }
 clear();type(tokens.length);
 if(source.slice(at).map(u=>u.hex).join()!=='3C,23')throw Error('Thiếu token kết thúc sau cặp tiền tố F.');
 return {keys,operations,mode:{kind:'f4-forward',cost:keys.length},source,cursor:source.length};
}

function buildGuide(input,line,r,editing){
 const steps=[];const add=(title,...segments)=>steps.push({title,segments:segments.filter(a=>a.length)});
 add('B1 + B2: Reset máy + Vào mode LineI/O',D.RESET,D.LINE_IO);
 if(r.count>1){add('B3: Vào Basic overflow',D.BASIC_OVERFLOW);const bold=boldChars(r),assign=[...D.TTK[':']];for(let v=0;v<r.count;v++){if(v)assign.push(...D.TTK[':']);assign.push(...D.TTK['ABC'[v]],...D.TTK['='],...valueKeys(r,v));}
 add('B4: Gán biến',[...D.BOLD_START,...bold.flatMap(c=>PDF_BOLD_KEYS[c])],repeat(D.BOLD_RECOVER,bold.length),repeat(['DEL'],10),assign,['CALC',...repeat(['EXEC'],r.count+1)]);}
 const b=r.count===1?3:5;
 add(`B${b}: Vào mode 110an`,r.count===1?D.BASIC_OVERFLOW:D.HALF_BASIC_OVERFLOW,D.AN_TAKE_KEYS,repeat(D.BOLD_RECOVER,4),repeat(['DEL'],10),D.AN_ASSIGN_KEYS,D.AN_ACTIVATE_KEYS);
 const bold=r.count===1?boldChars(r):[],take=[...D.HALF_BASIC_OVERFLOW,...D.BOLD_START,...[...'ABC'.slice(0,r.count)].flatMap(c=>PDF_EXTRACT_KEYS[c]),...bold.flatMap(c=>PDF_BOLD_KEYS[c])],ex=[...'123456789','X'];
 for(let v=0;v<r.count;v++)ex.push(...D.TTK[':'],'RIGHT',...D.TTK['='],...(r.count===1?valueKeys(r,v):D.TTK['ABC'[v]]));
 add(`B${b+1}: Xuất hex`,take,repeat(D.BOLD_RECOVER,r.count+bold.length),repeat(['DEL'],11),ex,['CALC',...repeat(['EXEC'],r.count+1),'UP']);
 const nums=34-line.reduce((n,e)=>n+(e.hex==='20'||isWide(e.hex)?2:1),0);
 if(nums<0)throw Error('Dãy token vượt 34 byte. Hãy giảm số khoảng trắng hẹp {01}.');
 add(`B${b+2}: Viết token`,editing.keys,[...Array.from({length:nums},(_,i)=>'1234567890'[i%10]),...D.SPELL_END.slice(0,-2)]);
 add(`B${b+3}: Hoàn tất`,D.SPELL_END.slice(-2));
 let assignments=assignmentLines(r);if(r.count===1)assignments=['123456789𝓍:','@ = '+assignments[1].split(' = ')[1]];
 return {input,line,packing:r,nums,assignments,steps,editing};
}
function generate(raw,{center=true,f4=true,compressSpaces=true}={}){
 const input=parseText(raw);if(!input.length||input.every(e=>e.hex==='20'||e.hex==='01'))throw Error('Nhập văn bản hoặc chọn ký tự để bắt đầu.');
 const line=prepareLine(input,{center,compressSpaces}),nums=34-line.reduce((n,e)=>n+(e.hex==='20'||isWide(e.hex)?2:1),0);
 if(nums<0)throw Error('Dãy token vượt 34 byte. Hãy giảm số khoảng trắng hẹp {01}.');
 let best=null;
 const candidates=optimizePacking(line,{allowEmpty:true});
 if(f4&&line.some(e=>isWide(e.hex)&&(f4SuffixKeys(e.hex.slice(2))||f4ConversionKeys(e.hex.slice(2)))))candidates.push(...optimizePacking(line,{f4:true,allowEmpty:true}).filter(r=>r.f4Macros));
 if(!candidates.length)throw Error('Không đủ chỗ trong A/B/C sau khi chèn hex đệm. Hãy rút ngắn câu hoặc chọn thêm ký tự có phím trực tiếp.');
 for(const r of candidates){
  const g=buildGuide(input,line,r,editPlan(r,line));g.keyCount=keyCount(g);g.strategy=r.f4Macros?'f4f4':'variables';
  if(!best||g.keyCount<best.keyCount)best=g;
 }
 if(line.every(e=>directKeys(e))){
  // Recovery leaves x|3C. Remove x, append the real 23 token with ALPHA integral,
  // then return before 3C. The invisible terminator is not omitted.
  const setup=[...D.BASIC_OVERFLOW,...D.BOLD_START,...PDF_BOLD_KEYS.C,...D.BOLD_RECOVER,...repeat(['DEL'],11),'RIGHT',...D.TTK[':'],'LEFT','LEFT'];
  const g={input,line,nums,packing:{tokens:['3C','23'],cells:[],count:0,padding:0,boundaries:{}},assignments:[],strategy:'direct-overflow',
   editing:{keys:line.flatMap(directKeys),operations:line.map(e=>({insert:e.hex,keys:directKeys(e).slice()})),source:[{hex:'3C'},{hex:'23',hidden:true}],cursor:0},
   steps:[{title:'B1 + B2: Reset máy + Vào mode LineI/O',segments:[D.RESET,D.LINE_IO]},
    {title:'B3: Vào Basic overflow + Lấy token',segments:[setup]},
    {title:'B4: Viết token',segments:[line.flatMap(directKeys),[...Array.from({length:nums},(_,i)=>'1234567890'[i%10]),...D.SPELL_END.slice(0,-2)]]},
    {title:'B5: Hoàn tất',segments:[D.SPELL_END.slice(-2)]}]};
  g.keyCount=keyCount(g);if(g.keyCount<best.keyCount)best=g;
 }
 best.spacing=fitInput(input,{compressSpaces});
 return best;
}
function guideText(g,compact=true){return (g.assignments.length?g.assignments.join('\n')+'\n\n':'')+g.steps.map(s=>s.title+'\n'+s.segments.map(k=>formatKeys(k,compact)).join('\n')).join('\n\n');}
root.Spell={DISPLAY_CAPACITY,COMPLETE_CELLS,cellThirds,lineThirds,paletteMatrix,fitInput,prepareLine,referenceFor,conversionKeys,entries,byHex,insertion,parseText,isWide,directKeys,f4SuffixKeys,f4ConversionKeys,packHex,assignmentLines,cleanupUnits,cleanupKeys,formatKeys,targetGaps,optimizePacking,editPlan,keyCount,generate,guideText};
})(globalThis);
