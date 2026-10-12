/* Port of sap_xep_hex.py v12. F-prefix characters are atomic two-byte tokens. */
(function (root) {
'use strict';
const D=root.SPELL_DATA, PDF=root.PDF_REFERENCE, repeat=(a,n)=>Array.from({length:n},()=>a).flat();
const isWide=hex=>hex.startsWith('F');
// Display width: 17.(3) character cells; only complete characters enter the spell.
const DISPLAY_CAPACITY=52/3, COMPLETE_CELLS=Math.floor(DISPLAY_CAPACITY);
function paletteMatrix(group){
 const prefix={base:'',f0:'F0',f4:'F4'}[group];
 if(prefix===undefined)throw Error('Bảng ký tự không hợp lệ.');
 return Array.from({length:16},(_,row)=>Array.from({length:16},(_,col)=>{const hex=prefix+(row*16+col).toString(16).toUpperCase().padStart(2,'0');return {hex,entry:byHex.get(hex)||null};}));
}
function prepareLine(input,{center=true}={}){
 if(input.length>DISPLAY_CAPACITY)throw Error('Văn bản dài hơn một dòng. Hãy rút ngắn nội dung.');
 const remaining=COMPLETE_CELLS-input.length,left=center?Math.floor(remaining/2):0;
 return [...repeat([byHex.get('20')],left),...input,...repeat([byHex.get('20')],remaining-left)];
}
const entries=[];
for(let n=0x10;n<=0xEC;n++) entries.push({hex:n.toString(16).toUpperCase(),group:'base',offset:n-0x10});
for(let n=0x10;n<=0x31;n++) entries.push({hex:'F0'+n.toString(16).toUpperCase(),group:'f0',offset:n-0x10});
for(let n=0x10;n<=0x95;n++) entries.push({hex:'F4'+n.toString(16).toUpperCase(),group:'f4',offset:n-0x10});
const byHex=new Map(entries.map(e=>[e.hex,e]));
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
function parseText(raw){
 const text=raw.normalize('NFC'), out=[];let i=0;
 while(i<text.length){
  const tag=text.slice(i).match(/^\{([0-9A-Fa-f]{2}|[Ff][0-9A-Fa-f]{3})\}/);
  if(tag){const hex=tag[1].toUpperCase();if(!byHex.has(hex))throw Error(`Mã ${hex} không nằm trong ba bảng ký tự đã cung cấp.`);out.push(byHex.get(hex));i+=tag[0].length;continue;}
  const char=inputChars.find(c=>text.startsWith(c,i));
  if(!char)throw Error(`Chưa có ký tự “${String.fromCodePoint(text.codePointAt(i))}” trong bảng. Chọn ký tự từ bảng bên dưới.`);
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
 const row=PDF.rows[e.hex];return row?.effective_formula1?.[0]||row?.formula1?.[0]||null;
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
function cleanupUnits(r){const out=[];for(let v=0;v<r.count;v++){if(v)out.push({hex:'01',padding:true},{hex:'01',padding:true});const cells=variableCells(r,v);for(let i=0;i<cells.length;i++){const c=cells[i];if(c.value.startsWith('F')&&!c.padding){if(cells[i+1]?.token!==c.token)throw Error('Ký tự hai byte bị tách.');out.push({hex:c.value+cells[++i].value,padding:false});}else out.push({hex:c.value,padding:c.padding,hidden:c.token===r.tokens.length-1});}}return out;}
function cleanupKeys(r){const units=cleanupUnits(r);if(!units.some(u=>u.padding))return ['RIGHT'];let pending=0;const keys=[];for(const u of units.slice().reverse()){if(u.padding){keys.push(...repeat(['LEFT'],pending),'DEL');pending=0;}else pending++;}keys.push(...repeat(['LEFT'],pending));return keys;}
function formatKeys(keys,compact=true){if(!compact)return keys.map(k=>`[${D.KEYBOARD[k]}]`).join(' ');
 function find(a,i){let best=null;for(const [n,min] of [[1,5],[2,4],[3,3]]){if(a.length-i<n*min)continue;const block=a.slice(i,i+n);if(block.some(x=>/×\d+$/.test(x)))continue;let count=1;while(block.every((x,j)=>a[i+count*n+j]===x))count++;if(count>=min&&(!best||n*count>best.covered))best={covered:n*count,block,count};}return best;}
 const items=[];let digits=[];
 function flush(){let pending=[];for(let i=0;i<digits.length;){const r=find(digits,i);if(r){if(pending.length)items.push('['+pending.join('')+']');pending=[];items.push('['+r.block.join('')+']×'+r.count);i+=r.covered;}else pending.push(digits[i++]);}if(pending.length)items.push('['+pending.join('')+']');digits=[];}
 for(const k of keys){if(/^\d$/.test(k))digits.push(k);else{flush();items.push(`[${D.KEYBOARD[k]}]`);}}flush();const out=[];for(let i=0;i<items.length;){const r=find(items,i);if(r){out.push((r.block.length>1?'('+r.block.join(' ')+')':r.block[0])+'×'+r.count);i+=r.covered;}else out.push(items[i++]);}return out.join(' ');
}
function generate(raw,{center=true}={}){
 const input=parseText(raw);if(!input.length||input.every(e=>e.hex==='20'))throw Error('Nhập văn bản hoặc chọn ký tự để bắt đầu.');
 const line=prepareLine(input,{center});
 const r=packHex(input.filter(e=>!directKeys(e)).map(e=>e.hex));const steps=[];const add=(title,...segments)=>steps.push({title,segments:segments.filter(a=>a.length)});
 add('B1 + B2: Reset máy + Vào mode LineI/O',D.RESET,D.LINE_IO);
 if(r.count>1){add('B3: Vào Basic overflow',D.BASIC_OVERFLOW);const bold=boldChars(r),assign=[...D.TTK[':']];for(let v=0;v<r.count;v++){if(v)assign.push(...D.TTK[':']);assign.push(...D.TTK['ABC'[v]],...D.TTK['='],...valueKeys(r,v));}
 add('B4: Gán biến',[...D.BOLD_START,...bold.flatMap(c=>PDF_BOLD_KEYS[c])],repeat(D.BOLD_RECOVER,bold.length),repeat(['DEL'],10),assign,['CALC',...repeat(['EXEC'],r.count+1)]);}
 const b=r.count===1?3:5;
 add(`B${b}: Vào mode 110an`,r.count===1?D.BASIC_OVERFLOW:D.HALF_BASIC_OVERFLOW,D.AN_TAKE_KEYS,repeat(D.BOLD_RECOVER,4),repeat(['DEL'],10),D.AN_ASSIGN_KEYS,D.AN_ACTIVATE_KEYS);
 const bold=r.count===1?boldChars(r):[],take=[...D.HALF_BASIC_OVERFLOW,...D.BOLD_START,...[...'ABC'.slice(0,r.count)].flatMap(c=>PDF_EXTRACT_KEYS[c]),...bold.flatMap(c=>PDF_BOLD_KEYS[c])],ex=['LEFT',...'123456789','RIGHT'];
 for(let v=0;v<r.count;v++)ex.push(...D.TTK[':'],'RIGHT',...D.TTK['='],...(r.count===1?valueKeys(r,v):D.TTK['ABC'[v]]));
 add(`B${b+1}: Xuất hex`,take,repeat(D.BOLD_RECOVER,r.count+bold.length),repeat(['DEL'],10),ex,['CALC',...repeat(['EXEC'],r.count+1),'UP']);
 const nums=34-line.reduce((n,e)=>n+(e.hex==='20'||isWide(e.hex)?2:1),0);
 add(`B${b+2}: Viết token`,cleanupKeys(r),line.flatMap(e=>directKeys(e)||['RIGHT']),[...Array.from({length:nums},(_,i)=>'1234567890'[i%10]),...D.SPELL_END.slice(0,-2)]);
 add(`B${b+3}: Hoàn tất`,D.SPELL_END.slice(-2));
 let assignments=assignmentLines(r);if(r.count===1)assignments=['123456789𝓍:','@ = '+assignments[1].split(' = ')[1]];
 return {input,line,packing:r,nums,assignments,steps};
}
function guideText(g,compact=true){return g.assignments.join('\n')+'\n\n'+g.steps.map(s=>s.title+'\n'+s.segments.map(k=>formatKeys(k,compact)).join('\n')).join('\n\n');}
root.Spell={DISPLAY_CAPACITY,COMPLETE_CELLS,paletteMatrix,prepareLine,referenceFor,conversionKeys,entries,byHex,insertion,parseText,isWide,directKeys,packHex,assignmentLines,cleanupUnits,cleanupKeys,formatKeys,generate,guideText};
})(globalThis);
