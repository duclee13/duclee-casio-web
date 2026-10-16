/* Spell 2–4 lines. PDF recipe + user-confirmed byte and width rules.
 * Mode names are labels: never derive capacities from 194 or 198.
 * Cursor navigation through the cache is deliberately guided, not guessed.
 */
(function(root){
'use strict';
const S=root.Spell,D=root.SPELL_DATA,P=root.PDF_REFERENCE;
const MODES=Object.freeze({
 '194':Object.freeze({id:'194',label:'194an (100+60an)',extra:60,capacity:94,cache:125}),
 '198':Object.freeze({id:'198',label:'198an (100+64an)',extra:64,capacity:98,cache:129})
});
const repeat=(a,n)=>Array.from({length:n},()=>a).flat();
const digits=n=>Array.from({length:n},(_,i)=>String((i+1)%10));
const sum=(a,f)=>a.reduce((n,x)=>n+f(x),0);
const rawBytes=h=>h.length/2;
const shortest=a=>a?.length?a.reduce((x,y)=>y.length<x.length?y:x).slice():null;
const ct2=h=>shortest(P.rows[h]?.formula2);
const Z=['ALPHA','S_D'];
const atName=e=>e.hex==='20'?'dấu cách':e.hex==='01'?'khoảng trắng ⅓':(e.char||'ký hiệu');
const describe=e=>`${atName(e)} {${e.hex}}`;
const hexList=a=>a.map(x=>typeof x==='string'?x:x.hex).join(' ');
const fits=(b,rule)=>[...rule].every((c,i)=>c==='_'||/\d/.test(b[i]));

function prepare(raw,{lines=2,mode='198',center=true,compressSpaces=true}={}){
 lines=Number(lines);if(![2,3,4].includes(lines))throw Error('Chọn 2, 3 hoặc 4 dòng.');
 const config=MODES[mode];if(!config)throw Error('Chọn mode 194an hoặc 198an.');
 const source=raw.replace(/\r\n?/g,'\n').split('\n');
 if(source.length>lines)throw Error(`Bạn đang nhập ${source.length} dòng. Chọn chế độ đủ số dòng hoặc bỏ bớt dòng xuống hàng.`);
 while(source.length<lines)source.push('');
 const input=source.map((t,i)=>{try{return S.parseText(t);}catch(e){throw Error(`Dòng ${i+1}: ${e.message}`);}});
 const spacing=input.map(a=>S.fitInput(a,{compressSpaces}));
 const displayLines=input.map((a,i)=>{try{return S.prepareLine(a,{center,compressSpaces});}catch(e){throw Error(`Dòng ${i+1}: ${e.message}`);}});
 const ordered=displayLines.flatMap((_,i)=>displayLines[lines-1-i].map((e,j)=>({...e,displayLine:lines-i,column:j+1})));
 const items=ordered.map((e,index)=>({...e,index,method:S.directKeys(e)?'direct':'packed',keys:S.directKeys(e),bytes:e.hex==='20'?2:rawBytes(e.hex)}));
 const initialBytes=sum(items,e=>e.bytes),need=Math.max(0,initialBytes-config.capacity);
 // Each converted ordinary space saves exactly one byte. CT2-only base
 // characters are initially assigned as raw bytes, avoiding conversion.
 const spaces=items.filter(e=>e.hex==='20');
 if(need>spaces.length)throw Error(`Nội dung cần tối thiểu ${initialBytes-spaces.length} byte, vượt ${config.capacity} byte của ${config.label}, kể cả sau khi chuyển hết dấu cách. Hãy rút ngắn nội dung${mode==='194'?' hoặc chọn 198an':''}.`);
 spaces.slice(0,need).forEach(e=>{e.method='ct2';e.keys=ct2('20');e.bytes=1;});
 return {lines,config,input,spacing,displayLines,items,initialBytes,contentBytes:initialBytes-need,nums:config.capacity-initialBytes+need,spaceConversions:need};
}

// Pack FB01 + seed symbols + 621923. Final 23 occupies the exponent byte.
// Optional CT2 base seeds may be omitted, at the cost of one conversion per
// occurrence. Minimize conversion count before packing/key cost.
function packSeeds(seeds,weights={},allowCT2=false){
 const groups=[{hex:'FB01'},...seeds.map(hex=>({hex,optional:allowCT2&&!!ct2(hex)&&hex.length===2,weight:weights[hex]||1})),{hex:'621923',end:true}];
 let best=null;
 for(const limit of [6,14,22]){
  const memo=new Map();
  function solve(t,p){
   if(t===groups.length)return p===limit?{cells:[],omitted:[],macros:{},conversions:0,cost:0}:null;
   if(p>=limit)return null;
   const id=t+','+p;if(memo.has(id))return memo.get(id);
   const g=groups[t],parts=g.hex.match(/../g);let win=null;
   const offer=(r,cells=[],omitted=[],conversions=0,cost=0,macros={})=>{
    if(!r)return;const v={cells:[...cells,...r.cells],omitted:[...omitted,...r.omitted],macros:{...macros,...r.macros},conversions:conversions+r.conversions,cost:cost+r.cost};
    if(!win||v.conversions<win.conversions||(v.conversions===win.conversions&&v.cost<win.cost))win=v;
   };
   const end=p+parts.length;
   if(end<=limit&&D.SLOTS[p][0]===D.SLOTS[end-1][0]&&(!g.end||end===limit)&&parts.every((b,i)=>fits(b,D.SLOTS[p+i][2]))){
    offer(solve(t+1,end),parts.map(value=>({value,padding:false,token:t})),[],0,parts.length+sum(parts,b=>[...b].filter(c=>/[A-F]/.test(c)).length*7));
   }
   const next=groups[t+1];
   if(t>0&&!g.end&&/^F[0-9A-F]{3}$/.test(g.hex)&&next&&!next.end&&/^F[0-9A-F]{3}$/.test(next.hex)){
    const leftKeys=S.f4SuffixKeys(g.hex.slice(2)),rightKeys=S.f4SuffixKeys(next.hex.slice(2));
    if(leftKeys){
     const bytes=[g.hex.slice(0,2),next.hex.slice(0,2),...(rightKeys?[]:[next.hex.slice(2)])],stop=p+bytes.length;
     if(stop<=limit&&D.SLOTS[p][0]===D.SLOTS[stop-1][0]&&bytes.every((b,i)=>fits(b,D.SLOTS[p+i][2])))
      offer(solve(t+2,stop),bytes.map(value=>({value,padding:false,token:t})),[],0,bytes.length+leftKeys.length+(rightKeys?.length||1)+4,
       {[p]:{left:g.hex,right:next.hex,leftKeys,rightKeys,bytes:bytes.length}});
    }
   }
   if(g.optional)offer(solve(t+1,p),[],[g.hex],g.weight,0);
   // Padding may precede the end block, but never split it or FB01.
   if(t>0)offer(solve(t,p+1),[{value:'20',padding:true,token:null}],[],0,2);
   memo.set(id,win);return win;
  }
  const r=solve(0,0);if(r){r.count=limit===6?1:limit===14?2:3;r.cost+=r.count*10;
   if(!best||r.conversions<best.conversions||(r.conversions===best.conversions&&r.cost<best.cost))best=r;
  }
 }
 if(!best)return null;
 best.tokens=groups.map(g=>g.hex);best.padding=best.cells.filter(c=>c.padding).length;
 best.seeds=seeds.filter(h=>!best.omitted.includes(h));
 return best;
}

// Cache duplication produces two copies. Select a subsequence of those copies
// to grow an ordered prefix while retaining a seed bank for remaining symbols.
function duplicatePlan(bank,target,config){
 if(hexList(bank)===hexList(target))return [];
 let state=bank.slice(),prefix=0;const rounds=[];
 while(prefix<target.length){
  const doubled=[...state,...state],selected=[];let cursor=0;
  for(let i=0;i<prefix;i++)selected.push(cursor++);
  // Reserve an intact bank at the end of copy 2. Take as much of the desired
  // prefix as possible from the preceding symbols.
  const reserveStart=doubled.length-bank.length;
  while(prefix<target.length){
   const found=doubled.indexOf(target[prefix],cursor);
   if(found<0||found>=reserveStart)break;
   selected.push(found);cursor=found+1;prefix++;
  }
  if(prefix===0&&rounds.length===0)throw Error('Không tìm được ký tự trong bộ mẫu.');
  const done=prefix===target.length;
  if(!done)for(let i=reserveStart;i<doubled.length;i++)selected.push(i);
  const next=selected.map(i=>doubled[i]);
  const bytes=sum(state,rawBytes);
  // Cache accounting includes z + 62 19 23. Reject unsupported intermediate
  // states rather than silently produce an unsafe instruction sequence.
  if(bytes+4>config.cache)throw Error('Bước nhân đôi vượt Cache Area. Hãy rút ngắn nội dung hoặc giảm số ký tự cần gán.');
  rounds.push({before:state,after:next,keep:selected.map(i=>i+1),cacheBytes:bytes+4});
  if(rounds.length>target.length+1)throw Error('Không lập được thứ tự nhân đôi ký tự.');
  state=next;
 }
 return rounds;
}

function plan(raw,options={}){
 const p=prepare(raw,options),anchors=p.items.filter(e=>e.method==='packed').map(e=>e.hex);
 if(p.input.flat().every(e=>e.hex==='20'||e.hex==='01'))throw Error('Nhập văn bản hoặc chọn ký tự để bắt đầu.');
 let packing=packSeeds(anchors),duplication=[];
 if(!packing){
  const bank=[...new Set(anchors)],weights={};anchors.forEach(h=>weights[h]=(weights[h]||0)+1);
  const wide=bank.filter(h=>h.length===4),base=bank.filter(h=>h.length===2),paired=[];
  while(wide.length){
   let i=wide.findIndex(h=>S.f4SuffixKeys(h.slice(2)));if(i<0)i=0;
   const left=wide.splice(i,1)[0];paired.push(left);
   if(S.f4SuffixKeys(left.slice(2))&&wide.length){let j=wide.findIndex(h=>!S.f4SuffixKeys(h.slice(2)));paired.push(wide.splice(j<0?0:j,1)[0]);}
  }
  const candidates=[packSeeds(bank,weights,true),packSeeds([...paired,...base],weights,true)].filter(Boolean);
  packing=candidates.sort((a,b)=>a.conversions-b.conversions||a.cost-b.cost)[0];
  if(!packing)throw Error('Các ký tự khác nhau cần gán chưa vừa A/B/C cùng FB01 và 621923. Hãy giảm số ký tự đặc biệt khác nhau; ký tự lặp có thể dùng nhân đôi.');
  for(const e of p.items)if(packing.omitted.includes(e.hex)&&e.method==='packed'){e.method='ct2';e.keys=ct2(e.hex);}
  duplication=duplicatePlan(packing.seeds,p.items.filter(e=>e.method==='packed').map(e=>e.hex),p.config);
 }
 return {...p,packing,duplication,conversions:p.items.filter(e=>e.method==='ct2')};
}

function modeKeys(extra){return ['SHIFT','DOT','SHIFT','DOT','LEFT','LEFT','DEL','DOWN','SHIFT','8','DOWN','2','6','LEFT','LEFT','RIGHT','9','DEL','LEFT','RPAREN','PLUS',...digits(100),'PLUS',...digits(extra),'CALC','EXEC'];}
function valueKeys(r,v){
 const start=[0,6,14][v],rules=D.TEMPLATES[v][2],prefix=D.TEMPLATES[v][1];
 return [...[...prefix].flatMap(c=>D.TTK[c]),...r.cells.slice(start,start+rules.length).flatMap((c,i)=>[...(i===rules.length-1?['EXP']:[]),...[...c.value].map(x=>/[A-F]/.test(x)?'RIGHT':x)])];
}

function generateForMode(raw,options={}){
 const p=plan(raw,options),r=p.packing,steps=[];
 const add=(title,note='',segments=[],extra={})=>{steps.push({title:`B${steps.length+1}: ${title}`,note,segments:segments.filter(k=>k.length),...extra});};
 const textOf=e=>`${describe(e)} — dòng ${e.displayLine}, vị trí ${e.column}`;
 add('Reset máy và chọn LineI/O','Reset sẽ xóa dữ liệu đang có trên máy tính.',[D.RESET,D.LINE_IO]);
 add('Vào Basic overflow','Bấm = rồi AC nhanh như hướng dẫn gốc.',[D.BASIC_OVERFLOW]);
 const bold=[...r.cells.map(c=>c.value).join('')].filter(c=>/[A-F]/.test(c));
 const assign=[...D.TTK[':']];
 for(let v=0;v<r.count;v++)assign.push(...(v?D.TTK[':']:[]),...D.TTK['ABC'[v]],...D.TTK['='],...valueKeys(r,v));
 const paddingPositions=r.cells.flatMap((c,i)=>c.padding?[`${'ABC'[D.SLOTS[i][0]]}, byte ${D.SLOTS[i][1]+1}`]:[]);
 add('Gán bộ ký tự vào A/B/C','FB01 ở đầu; 62 19 23 ở cuối. '+(paddingPositions.length?'Byte 20 được chèn làm đệm tại: '+paddingPositions.join('; ')+'. Chỉ các vị trí đệm này sẽ bị xóa.':'Không có byte 20 đệm trong các biến.'),[
  [...D.BOLD_START,...bold.flatMap(c=>D.BOLD_HEX_KEYS[c])],repeat(D.BOLD_RECOVER,bold.length),repeat(['DEL'],10),assign,['CALC',...repeat(['EXEC'],r.count+1)]
 ]);
 add(`Vào ${p.config.label}`,'Giữ đúng hai nhóm 100 và '+p.config.extra+' chữ số, có dấu + ở giữa.',[D.HALF_BASIC_OVERFLOW,modeKeys(p.config.extra)]);
 add('Vào lại Basic overflow','Bấm ON trước, rồi thực hiện overflow.',[['ON'],D.BASIC_OVERFLOW]);
 const extraction=[...'ABC'.slice(0,r.count)].reverse();
 add('Lấy các @ để xuất biến','Lấy @ theo thứ tự C → B → A (chỉ lấy các biến đã dùng). Chuyển các hằng số vừa lấy thành token bằng LEFT 9 DEL; xóa phần thừa để còn x, rồi điền từng dòng @ = biến theo bảng. Đọc tên biến bên cạnh @ để tránh nhầm các @ giống nhau.',
  [[...D.BOLD_START,...extraction.flatMap(c=>D.EXTRACT_KEYS[c])],repeat(D.BOLD_RECOVER,r.count)],
  {checkpoint:['x:',...extraction.map((c,i)=>`@ {${{A:'4D',B:'4E',C:'4F'}[c]}} = ${c}${i<extraction.length-1?':':''}`)].join('\n')});
 add('Thực thi và mở chuỗi đã xuất','Sau khi điền x: @ = biến ở bước trước, bấm chuỗi dưới. Phải thấy FB01, bộ ký tự và đuôi Q( + 19; 23 vẫn có ở cuối dù không thấy.',[['CALC',...repeat(['EXEC'],9),'AC','DOWN']]);
 const units=[];
 for(let v=0;v<r.count;v++){
  if(v)units.push({hex:'01',padding:true},{hex:'01',padding:true});
  const start=[0,6,14][v],cells=r.cells.slice(start,start+D.TEMPLATES[v][2].length);
  for(let i=0;i<cells.length;i++){const c=cells[i],macro=r.macros[start+i];
   if(macro){units.push({macro});i+=macro.bytes-1;}
   else if(c.value.startsWith('F')&&!c.padding)units.push({hex:c.value+cells[++i].value,padding:false});
   else units.push({hex:c.value,padding:c.padding});}
 }
 const cleanup=[];
 for(const u of units){
  if(u.macro){const m=u.macro;cleanup.push('RIGHT',...(m.rightKeys||['RIGHT']),'LEFT',...m.leftKeys,'RIGHT');}
  else if(u.padding)cleanup.push('RIGHT','DEL');
  else cleanup.push('RIGHT');
 }
 add('Ghép tiền tố F và xóa byte đệm','Đưa con trỏ về NGAY TRƯỚC FB01 đầu chuỗi. Thực hiện từ trái sang phải: ghép các cặp tiền tố F trước khi chạm phần bên phải, rồi xóa byte đệm. Không tự xóa quanh F4F4 chưa ghép. Giữ FB01 và 62 19 23.',[cleanup],{checkpoint:hexList(['FB01',...r.seeds,'62','19','23'])});
 add('Lưu bộ ký tự trước lần edit thứ hai','Đưa con trỏ về đầu, thêm z bằng ALPHA S⇔D, rồi bấm = đúng 23 lần.',[Z,repeat(['EXEC'],23)]);
 add(`Vào edit lần hai · ${p.config.label}`,'Thực hiện Basic overflow đầy đủ; = và AC phải bấm nhanh.',[D.BASIC_OVERFLOW,modeKeys(p.config.extra)]);
 add('Mở dữ liệu và bỏ FB01','Dữ liệu đã nhập vẫn xuất hiện là đúng. Chuỗi phím dưới xóa dấu đầu FB01 theo PDF. Giữ nguyên các ký tự và đuôi 62 19 23.',[['DOWN','RIGHT','RIGHT','RIGHT','DEL']],{checkpoint:'z + '+hexList([...r.seeds,'62','19','23'])});

 for(const [i,d] of p.duplication.entries()){
  add(`Nhân đôi và sắp xếp bộ ký tự · ${i+1}/${p.duplication.length}`,
   'Đầu chuỗi chỉ có một z (ALPHA S⇔D). CALC AC RIGHT để lưu. Đến |Q(, nhập số đến khi không nhập được nữa, bấm RIGHT RIGHT DEL. Theo quy trình nhân đôi trang 27–28, đi sang bản sao và xóa số cùng ký tự thừa. Trong hai bản nối tiếp, chỉ giữ các vị trí: '+d.keep.join(', ')+'. Giữ đuôi 62 19 23. Không tính z và đuôi vào các vị trí này.',
   [['CALC','AC','RIGHT']],{checkpoint:'Trước: '+hexList(d.before)+'\nSau: '+hexList(d.after)});
 }

 // Insert the CT2-only content first; postpone all direct characters so the
 // temporary 2-byte forms fit the cache. Batch at exact cache boundaries.
 let working=p.items.filter(e=>e.method==='packed').map(e=>({...e,bytes:rawBytes(e.hex)}));
 let pending=p.conversions.slice();
 const cacheBatch=(label,targets,currentBytes)=>{
  const fill=p.config.cache-(currentBytes+4);
  if(fill<0)throw Error('Bước chuyển CT2 vượt dung lượng Cache Area.');
  add(`Lưu Cache Area · ${label}`,
   `Về đầu chuỗi: nếu chưa có z thì thêm bằng [ALPHA] [S⇔D]; chỉ để một z. Đặt con trỏ trước Q( rồi nhập đúng ${fill} chữ số dưới đây. Đếm: ${p.config.cache} − (${currentBytes} byte nội dung/token + 1 byte z + 3 byte cuối) = ${fill}.`,
   [digits(fill),['CALC','AC','RIGHT']]);
  add(`Mở vùng chuyển đổi · ${label}`,'Lại đến |Q( và nhập số cho tới khi máy không nhận thêm. Sau đó bấm chuỗi dưới. Số lần nhập bổ sung này phụ thuộc trạng thái máy.',[['RIGHT','RIGHT','DEL']]);
  for(const target of targets)add('Chuyển '+target.label,'Đi tới NGAY TRƯỚC '+target.location+', rồi bấm 9 DEL. Chỉ chuyển vị trí được chỉ định.',[['9','DEL']]);
  add(`Dọn số đệm Cache Area · ${label}`,'Bấm AC RIGHT, tới |Q( rồi xóa hết hai nhóm số đệm vừa nhập. Giữ mọi ký tự đã chuyển và đủ đuôi 62 19 23. Không xóa byte 23 vô hình.',[['AC','RIGHT']]);
 };
 let batchNumber=0;
 while(pending.length){
  const targets=[];let bytes=sum(working,e=>e.bytes);
  while(pending.length&&bytes+2+4<=p.config.cache){
   const e=pending.shift(),pos=working.filter(x=>x.index<e.index).length;
   add('Chèn CT2 cho '+textOf(e),`Đưa con trỏ về đầu phần nội dung, SAU z nếu z đang có. Đi qua ${pos} token hiện có rồi nhập công thức dưới. Chưa thêm các ký tự có phím trực tiếp.`,[repeat(['RIGHT'],pos),e.keys]);
   working.splice(pos,0,{...e,bytes:2});bytes+=2;
   targets.push({entry:e,label:textOf(e),location:`token CT2 ở vị trí ${pos+1} của phần nội dung đang dựng (${describe(e)})`});
  }
  if(!targets.length)throw Error('Không đủ chỗ tạm cho CT2 trong Cache Area. Hãy rút ngắn nội dung.');
  // Indices may shift when a subsequent CT2 is inserted before an anchor.
  for(const t of targets)t.location=`token thứ ${working.findIndex(e=>e.index===t.entry.index)+1} trong phần nội dung, không đếm z (${describe(t.entry)})`;
  cacheBatch('nội dung '+(++batchNumber),targets,bytes);
  for(const t of targets)working.find(e=>e.index===t.entry.index).bytes=1;
 }

 const bodyKeys=p.items.flatMap(e=>e.method==='direct'?e.keys:['RIGHT']);
 add('Hoàn thiện nội dung từ dòng cuối lên dòng đầu',
  'Đưa con trỏ về đầu phần nội dung, SAU z nếu còn z. Các phím RIGHT đi qua ký tự đã có; các phím còn lại chèn ký tự mới. Không xóa các ký tự đã chuẩn bị. Thứ tự dòng: '+Array.from({length:p.lines},(_,i)=>p.lines-i).join(' → ')+'.',
  [bodyKeys],{checkpoint:p.displayLines.slice().reverse().map((a,i)=>`Dòng ${p.lines-i}: ${hexList(a)}`).join('\n')});

 const controls=p.lines===2?[{label:'D',keys:D.BOLD_HEX_KEYS.D}]:Array.from({length:2*p.lines-1},(_,i)=>i%2?{label:'D',keys:D.BOLD_HEX_KEYS.D}:{label:'@',keys:['SHIFT','8','1','NEG']});
 add('Chèn token điều khiển cuối chuỗi','Đặt con trỏ NGAY TRƯỚC Q(, sau toàn bộ nội dung. Nhập các công thức theo thứ tự dưới đây.',controls.map(c=>c.keys),{checkpoint:controls.map(c=>c.label).join(' ')+' Q( [19] [23] — sau khi chuyển'});
 cacheBatch('token điều khiển',controls.map((c,i)=>({label:`${c.label} điều khiển số ${i+1}`,location:`token điều khiển thứ ${i+1} ngay sau nội dung`})),p.contentBytes+controls.length*2);
 add('Chèn số đệm nums',`Đặt con trỏ SAU nội dung và TRƯỚC token điều khiển đầu tiên. nums = ${p.config.capacity} − ${p.contentBytes} = ${p.nums}. Đây là số đệm chạy spell, khác với số đệm Cache Area.`,[digits(p.nums)]);
 add('Lấy F ở phần kết thúc','Đặt con trỏ NGAY TRƯỚC Q( rồi bấm chuỗi dưới (cách lấy F ở trang 14/18).',[
  ['RIGHT','RIGHT','SHIFT','7','3','RECIPROCAL','LEFT','9','DEL','DEL','DEL']]);
 if(p.lines===2){
  add('Ghép hackstring 2 dòng','Đến trước D: nhập phím phân số. Đến sau D: nhập 21. Đến sau F cuối chuỗi: nhập 2 và biến x. Thực hiện từng vị trí theo thứ tự, không gõ lại các token D, Q(, F đã có.',[['FRACTION'],['2','1'],['2','X']],{checkpoint:'┘D21Q(F2x'});
 }else{
  const fills=p.lines===3?[
   ['2','SHIFT','8','DOWN','3','3','2','FRACTION'],['2','SHIFT','DOT','2','FRACTION'],['2','SHIFT','8','1','8','2']
  ]:[['2','1','1','1','FRACTION'],['2','1','ALPHA','EXP','2','FRACTION'],['2','SHIFT','8','1','DMS','2','FRACTION'],['2','SHIFT','8','1','1','2']];
  for(let i=0;i<p.lines;i++){
   add(`Ghép hackstring · cụm @ thứ ${i+1}`,
    'Đến trước @ thứ '+(i+1)+': nhập dấu = (ALPHA CALC). Đến sau chính @ đó: nhập nhóm phím thứ hai.'+(i<p.lines-1?' Đến sau D kế tiếp: nhập 21.':''),
    [D.TTK['='],fills[i],...(i<p.lines-1?[['2','1']]:[])]);
  }
  add('Kết thúc hackstring','Đến sau F cuối chuỗi, nhập 2 và biến x.',[['2','X']],{checkpoint:p.lines===3?'=@2J▸cal2┘D21=@2Ran#2┘D21=@2km▸mile2Q(F2x':'=@2111┘D21=@21e2┘D21=@2pc▸km2┘D21=@2in▸cm2Q(F2x'});
 }
 add('Chạy spell','Đối chiếu chuỗi kết thúc ở bước trước rồi bấm CALC =.',[['CALC','EXEC']]);
 return {...p,line:p.items,assignments:S.assignmentLines(r),steps,strategy:'multiline-cache',guided:true,keyCount:sum(steps,s=>sum(s.segments,k=>k.length)),
  summary:`${p.lines} dòng · ${p.config.label} · ${p.contentBytes}/${p.config.capacity} byte · nums ${p.nums} · chuyển ${p.conversions.length} CT2 nội dung`,
  notes:'Các bước có chỉ dẫn vị trí cần di chuyển con trỏ theo mô tả. Số lần bấm chỉ tính các phím đã liệt kê, chưa tính thao tác tìm vị trí và nhập số đến khi đầy.'};
}
function generate(raw,options={}){
 if(options.mode&&options.mode!=='auto')return generateForMode(raw,options);
 const candidates=[],errors=[];
 for(const mode of ['194','198']){
  try{candidates.push(generateForMode(raw,{...options,mode}));}catch(e){errors.push(e);}
 }
 if(!candidates.length)throw errors.at(-1);
 // Honor the user's priority: fewer CT2 conversions first; then fewer
 // listed physical keys. A tie favors the smaller memory recipe.
 candidates.sort((a,b)=>a.conversions.length-b.conversions.length||a.keyCount-b.keyCount||a.steps.length-b.steps.length||a.config.extra-b.config.extra);
 const best=candidates[0];best.automaticMode=true;return best;
}
root.SpellMulti={MODES,prepare,plan,packSeeds,duplicatePlan,generate,modeKeys};
})(globalThis);
