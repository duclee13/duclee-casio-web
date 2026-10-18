/* Spell 2–4 lines. PDF recipe + user-confirmed byte and width rules.
 * Mode names are labels: never derive capacities from 194 or 198.
 * Input: 200 bytes. Clear + RIGHT/LEFT recalls the saved start/end.
 * Cache opening: current-without-23 | saved sequence (user-confirmed).
 */
(function(root){
'use strict';
const S=root.Spell,D=root.SPELL_DATA,P=root.PDF_REFERENCE;
const INPUT_CAPACITY=200;
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
const GUARD_KEYS=['1'];
const GUARD_HEX='31';
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
 // Export is always 4D, 4E, 4F, regardless of assignment order. Keep
 // the literal reading order, including repeated mandatory characters.
 const ordered=displayLines.flatMap((line,i)=>line.map((e,j)=>({...e,displayLine:i+1,column:j+1})));
 const items=ordered.map((e,index)=>{
  const direct=S.directKeys(e),conversion=!direct&&ct2(e.hex);
  return {...e,index,method:direct?'direct':conversion?'ct2':'packed',keys:direct||conversion,bytes:e.hex==='20'?2:rawBytes(e.hex)};
 });
 const initialBytes=sum(items,e=>e.bytes),need=Math.max(0,initialBytes-config.capacity);
 // Each converted ordinary space saves one byte. CT2-only characters
 // stay out of the base and share the launcher's conversion pass.
 const spaces=items.filter(e=>e.hex==='20');
 if(need>spaces.length)throw Error(`Nội dung cần tối thiểu ${initialBytes-spaces.length} byte, vượt ${config.capacity} byte của ${config.label}, kể cả sau khi chuyển hết dấu cách. Hãy rút ngắn nội dung${mode==='194'?' hoặc chọn 198an':''}.`);
 spaces.slice(0,need).forEach(e=>{e.method='ct2';e.keys=ct2('20');e.bytes=1;});
 return {lines,config,input,spacing,displayLines,items,initialBytes,contentBytes:initialBytes-need,nums:config.capacity-initialBytes+need,spaceConversions:need};
}

// Pack FB01 + seed symbols + 62, 19, 23. The terminator is a byte stream:
// it may cross a variable boundary and may end before an exponent byte.
// Only F-prefixed two-byte symbols must remain inside one variable.
// Optional CT2 base seeds may be omitted, at the cost of one conversion per
// occurrence. Minimize conversion count before packing/key cost.
function packSeeds(seeds,weights={},allowCT2=false,{pairPrefixes=true}={}){
 const groups=[{hex:'FB01'},...seeds.map(hex=>({hex,optional:allowCT2&&!!ct2(hex)&&hex.length===2,weight:weights[hex]||1})),...['62','19','23'].map(hex=>({hex,end:true}))];
 let best=null;
 for(const limit of [6,14,22]){
  const memo=new Map();
  function solve(t,p){
   if(t===groups.length)return {cells:[],omitted:[],macros:{},conversions:0,cost:(D.SLOTS[p-1][0]+1)*10};
   if(p>=limit)return null;
   const id=t+','+p;if(memo.has(id))return memo.get(id);
   const g=groups[t],parts=g.hex.match(/../g);let win=null;
   const offer=(r,cells=[],omitted=[],conversions=0,cost=0,macros={})=>{
    if(!r)return;const v={cells:[...cells,...r.cells],omitted:[...omitted,...r.omitted],macros:{...macros,...r.macros},conversions:conversions+r.conversions,cost:cost+r.cost};
    if(!win||v.conversions<win.conversions||(v.conversions===win.conversions&&v.cost<win.cost))win=v;
   };
   const end=p+parts.length;
   if(end<=limit&&D.SLOTS[p][0]===D.SLOTS[end-1][0]&&parts.every((b,i)=>fits(b,D.SLOTS[p+i][2]))){
    offer(solve(t+1,end),parts.map(value=>({value,padding:false,token:t})),[],0,parts.length+sum(parts,b=>[...b].filter(c=>/[A-F]/.test(c)).length*7));
   }
   const next=groups[t+1];
   if(pairPrefixes&&t>0&&!g.end&&/^F[0-9A-F]{3}$/.test(g.hex)&&next&&!next.end&&/^F[0-9A-F]{3}$/.test(next.hex)){
    const leftKeys=S.f4SuffixKeys(g.hex.slice(2)),rightKeys=S.f4SuffixKeys(next.hex.slice(2));
    if(leftKeys){
     const bytes=[g.hex.slice(0,2),next.hex.slice(0,2),...(rightKeys?[]:[next.hex.slice(2)])],stop=p+bytes.length;
     if(stop<=limit&&D.SLOTS[p][0]===D.SLOTS[stop-1][0]&&bytes.every((b,i)=>fits(b,D.SLOTS[p+i][2])))
      offer(solve(t+2,stop),bytes.map(value=>({value,padding:false,token:t})),[],0,bytes.length+sum(bytes,b=>[...b].filter(c=>/[A-F]/.test(c)).length*7)+leftKeys.length+(rightKeys?.length||1)+4,
       {[p]:{left:g.hex,right:next.hex,leftKeys,rightKeys,bytes:bytes.length}});
    }
   }
   if(g.optional)offer(solve(t+1,p),[],[g.hex],g.weight,0);
   // Padding may be removed later. The terminating 23 is always the last
   // assigned byte; no padding is appended after it.
   if(t>0)offer(solve(t,p+1),[{value:'20',padding:true,token:null}],[],0,2);
   memo.set(id,win);return win;
  }
  const r=solve(0,0);if(r){r.count=D.SLOTS[r.cells.length-1][0]+1;
   if(!best||r.conversions<best.conversions||(r.conversions===best.conversions&&r.cost<best.cost))best=r;
  }
 }
 if(!best)return null;
 best.tokens=groups.map(g=>g.hex);best.padding=best.cells.filter(c=>c.padding).length;
 best.seeds=seeds.filter(h=>!best.omitted.includes(h));
 return best;
}

// Every k rounds can only produce a subsequence of bank^(2^k). Embed the
// entire target in those copies, then retain exactly the ancestors required
// at each earlier round. This uses useful symbols in BOTH halves, including
// symbols needed near the end of the final sentence.
function duplicatePlan(bank,target,config){
 if(hexList(bank)===hexList(target))return [];
 if(!bank.length||target.some(h=>!bank.includes(h)))throw Error('Bộ mẫu thiếu ký tự cần nhân.');
 const m=bank.length,forward=[];let pos=0;
 for(const h of target){while(bank[pos%m]!==h)pos++;forward.push(pos++);}
 const copies=Math.floor((pos-1)/m)+1,k=Math.max(1,Math.ceil(Math.log2(copies))),period=m*2**k;
 const backward=[];pos=period-1;
 for(let i=target.length-1;i>=0;i--){while(pos>=0&&bank[pos%m]!==target[i])pos--;if(pos<0)throw Error('Không ghép được dãy đích.');backward.unshift(pos--);}
 const make=positions=>{
  let previous=Array.from({length:m},(_,i)=>i),state=bank.slice();const rounds=[];
  for(let level=1;level<=k;level++){
   const span=m*2**level,half=span/2,next=[...new Set(positions.map(i=>i%span))].sort((a,b)=>a-b);
   const lookup=new Map(previous.map((p,i)=>[p,i])),keep=next.map(p=>lookup.get(p%half)+(p>=half?state.length:0)+1);
   if(keep.some(p=>!Number.isInteger(p)))throw Error('Thiếu token trung gian.');
   const after=next.map(p=>bank[p%m]),bytes=sum(state,rawBytes);
   if(bytes+4>config.cache||sum(after,rawBytes)+4>config.cache)throw Error('Bước nhân đôi vượt Cache Area.');
   rounds.push({before:state,after,keep,cacheBytes:bytes+4});previous=next;state=after;
  }
  if(hexList(state)!==hexList(target))throw Error('Nhân đôi sai thứ tự dãy đích.');
  return rounds;
 };
 const score=rounds=>sum(rounds,r=>404+4*r.before.length-2*sum(r.before,rawBytes));
 return [make(forward),make(backward)].sort((a,b)=>score(a)-score(b))[0];
}

// Weighted shortest common supersequence. Keeping repeated tokens in the
// original assignments can save a complete later cache pass.
function mergeSequences(a,b){
 const dp=Array.from({length:a.length+1},()=>new Array(b.length+1).fill(0));
 for(let i=a.length;i>=0;i--)for(let j=b.length;j>=0;j--){
  if(i===a.length)dp[i][j]=sum(b.slice(j),rawBytes);
  else if(j===b.length)dp[i][j]=sum(a.slice(i),rawBytes);
  else dp[i][j]=a[i]===b[j]?rawBytes(a[i])+dp[i+1][j+1]:Math.min(rawBytes(a[i])+dp[i+1][j],rawBytes(b[j])+dp[i][j+1]);
 }
 const result=[];let i=0,j=0;
 while(i<a.length||j<b.length){
  if(i===a.length)result.push(b[j++]);else if(j===b.length)result.push(a[i++]);
  else if(a[i]===b[j]){result.push(a[i++]);j++;}
  else if(rawBytes(a[i])+dp[i+1][j]<=rawBytes(b[j])+dp[i][j+1])result.push(a[i++]);else result.push(b[j++]);
 }
 return result;
}
function rawUnits(items,kind){
 const anchors=items.filter(e=>e.method==='packed'),units=[];
 for(let i=0;i<anchors.length;i++){
  const e=anchors[i],keys=e.hex.length===4?S.f4SuffixKeys(e.hex.slice(2)):null;
  if(kind==='literal'||!keys){units.push({raw:e.hex,output:[e.hex],indices:[e.index]});continue;}
  const next=anchors[i+1],rightKeys=next?.hex.length===4?S.f4SuffixKeys(next.hex.slice(2)):null;
  if(kind==='pairs'&&rightKeys){units.push({raw:e.hex.slice(0,2)+next.hex.slice(0,2),output:[e.hex,next.hex],indices:[e.index,next.index],keys:['RIGHT',...rightKeys,'LEFT',...keys,'RIGHT']});i++;}
  else units.push({raw:e.hex.slice(0,2).repeat(2),output:[e.hex],indices:[e.index],keys:['RIGHT',...keys,'LEFT','9','DEL','RIGHT']});
 }
 return units;
}
// Exact slot-aware feasibility search for fixed raw-token targets. A final
// target after k doublings is a subsequence of seed^(2^k). Search consecutive
// target partitions as a common supersequence in actual ABC slots, including
// the two real 01 tokens produced at each variable boundary.
function seedSearch(target,{budget=240000,maxRounds=2,maxResults=24,deadline=Infinity}={}){
 const key=target.join(',')+'/'+budget+'/'+maxRounds+'/'+maxResults;
 if(seedSearch.cache.has(key))return seedSearch.cache.get(key);
 const results=[],stats={states:0,partitions:0,completeThrough:-1,truncated:false,reason:null};
 const stopped=()=>{if(stats.states+stats.partitions>budget){stats.truncated=true;stats.reason="state-budget";}else if(Date.now()>deadline){stats.truncated=true;stats.reason="time-budget";}return stats.truncated;};
 const endPosition=(p,hex)=>{const bytes=hex.match(/../g);for(;p+bytes.length<=22;p++)if(D.SLOTS[p][0]===D.SLOTS[p+bytes.length-1][0]&&bytes.every((b,i)=>fits(b,D.SLOTS[p+i][2])))return p+bytes.length;return 99;};
 const finish=p=>['62','19','23'].reduce(endPosition,p);
 const counts=a=>{const v={};for(const h of a)v[h]=(v[h]||0)+1;return v};
 const unique=[...new Set(target)];
 function attempt(chunks){
  const suffix=chunks.map(a=>a.map((_,i)=>counts(a.slice(i))).concat([{}]));
  const dead=new Set();
  const advance=(at,h)=>at.map((x,i)=>x+(chunks[i][x]===h?1:0));
  function dfs(at,p,processed=false){
   stats.states++;if(stopped())return null;
   if(at.every((x,i)=>x===chunks[i].length))return finish(p)<=22?[]:null;
   if(p>=19)return null;
   const id=at.join(',')+':'+p+':'+processed;if(dead.has(id))return null;
   const free=2*([6,14].filter(x=>x>p||(x===p&&!processed)).length);
   const need=sum(unique,h=>Math.max(0,Math.max(...at.map((x,i)=>suffix[i][x][h]||0))-(h==='01'?free:0))*rawBytes(h));
   if(p+need+3>22){dead.add(id);return null;}
   if((p===6||p===14)&&!processed){
    const one=advance(at,'01'),two=advance(one,'01');
    for(const [next,n] of [[two,2],[one,1],[at,0]]){
     if(n&&next.every((v,i)=>v===at[i]))continue;
     if(n===2&&two.every((v,i)=>v===one[i]))continue;
     const rest=dfs(next,p,true);if(rest)return [{boundary:p,count:n},...rest];if(stats.truncated)return null;
    }
    dead.add(id);return null;
   }
   const heads=[...new Set(at.flatMap((x,i)=>x<chunks[i].length?[chunks[i][x]]:[]))];
   heads.sort((a,b)=>at.filter((x,i)=>chunks[i][x]===b).length-at.filter((x,i)=>chunks[i][x]===a).length||rawBytes(b)-rawBytes(a));
   for(const h of heads){
    const bytes=h.match(/../g),end=p+bytes.length;
    if(end+3>22||D.SLOTS[p][0]!==D.SLOTS[end-1][0]||!bytes.every((b,i)=>fits(b,D.SLOTS[p+i][2])))continue;
    const rest=dfs(advance(at,h),end);if(rest)return [{hex:h},...rest];if(stats.truncated)return null;
   }
   const rest=dfs(at,p+1);if(rest)return [{padding:true},...rest];
   dead.add(id);return null;
  }
  const operations=dfs(chunks.map(()=>0),2);if(!operations)return null;
  const cells=[{value:'FB',padding:false,token:0},{value:'01',padding:false,token:0}],seeds=[],assignedSeeds=[],boundaryKeeps={};let token=1;
  for(const o of operations){
   if(o.boundary){boundaryKeeps[D.SLOTS[o.boundary][0]]=o.count;seeds.push(...Array(o.count).fill('01'));}
   else if(o.padding)cells.push({value:'20',padding:true,token:null});
   else{assignedSeeds.push(o.hex);seeds.push(o.hex);for(const value of o.hex.match(/../g))cells.push({value,padding:false,token});token++;}
  }
  for(const h of ['62','19','23']){while(!fits(h,D.SLOTS[cells.length][2]))cells.push({value:'20',padding:true,token:null});cells.push({value:h,padding:false,token:token++});}
  const count=D.SLOTS[cells.length-1][0]+1;
  return {cells,seeds,assignedSeeds,boundaryKeeps,count,padding:cells.filter(c=>c.padding).length,macros:{},omitted:[],conversions:0,
   cost:count*10+sum(cells,c=>c.padding?2:1+[...c.value].filter(x=>/[A-F]/.test(x)).length*7),tokens:['FB01',...assignedSeeds,'62','19','23']};
 }
 const totalCounts=counts(target);
 for(let rounds=0;rounds<=Math.min(maxRounds,Math.ceil(Math.log2(Math.max(1,target.length))));rounds++){
  const copies=Math.min(2**rounds,target.length||1);
  if(!target.length)break;
  // A frequency lower bound is cheap and independent of token order.
  const frequencyBound=sum(unique,h=>Math.max(0,Math.ceil(totalCounts[h]/copies)-(h==='01'?4:0))*rawBytes(h));
  if(frequencyBound>17){stats.completeThrough=rounds;continue;}
  const partitions=[];
  const lower=x=>sum(unique,h=>Math.max(0,Math.max(...x.map(c=>c.filter(v=>v===h).length))-(h==='01'?4:0))*rawBytes(h));
  const visit=chunks=>{
   stats.partitions++;if(stopped())return;
   if(lower(chunks)>17)return;
   const packing=attempt(chunks);
   if(packing&&!results.some(r=>hexList(r.seeds)===hexList(packing.seeds)&&JSON.stringify(r.boundaryKeeps)===JSON.stringify(packing.boundaryKeeps)))results.push(packing);
  };
  function partition(start,left,chunks){
   if(stopped()||results.length>=maxResults)return;
   if(left===1){const last=target.slice(start);if(sum(last,h=>h==='01'?0:rawBytes(h))<=17){if(copies<=4)partitions.push([...chunks,last]);else visit([...chunks,last]);}return;}
   const cuts=[];
   for(let end=start+1;end<=target.length-left+1;end++){
    const chunk=target.slice(start,end);if(sum(chunk,h=>h==='01'?0:rawBytes(h))>17)break;
    // The remaining tokens must fit into the remaining copies of a base.
    if(sum(target.slice(end),h=>h==='01'?0:rawBytes(h))>17*(left-1))continue;
    cuts.push(end);
   }
   if(copies>4){const ideal=start+(target.length-start)/left;cuts.sort((a,b)=>Math.abs(a-ideal)-Math.abs(b-ideal));}
   for(const end of cuts){
    stats.partitions++;if(stopped())return;
    const next=[...chunks,target.slice(start,end)];if(lower(next)<=17)partition(end,left-1,next);
    if(stats.truncated||results.length>=maxResults)return;
   }
  }
  partition(0,copies,[]);
  if(copies<=4&&!stats.truncated){
   const scored=partitions.map(chunks=>({chunks,bound:lower(chunks),max:Math.max(...chunks.map(c=>sum(c,rawBytes)))}));
   scored.sort((a,b)=>a.bound-b.bound||a.max-b.max);
   for(const p of scored){visit(p.chunks);if(stats.truncated||results.length>=maxResults)break;}
  }
  if(stats.truncated||results.length)break;
  stats.completeThrough=rounds;
 }
 const result={packings:results,stats};
 if(!stats.truncated){if(seedSearch.cache.size>=48)seedSearch.cache.clear();seedSearch.cache.set(key,result);}return result;
}
seedSearch.cache=new Map();

function optimizedPlans(raw,options={}){
 const base=prepare(raw,options),result=[],seen=new Set();
 if(base.input.flat().every(e=>e.hex==='20'||e.hex==='01'))throw Error('Nhập văn bản hoặc chọn ký tự để bắt đầu.');
 variantsLoop: for(const kind of ['literal','pairs','single'])for(const deferCT2 of [false,true]){
  if(Date.now()>(options.searchDeadline||Infinity))break variantsLoop;
  const forced=deferCT2?new Set(base.items.filter(e=>e.method==='packed'&&e.hex.length===2&&ct2(e.hex)).map(e=>e.hex)):new Set();
  if(deferCT2&&!forced.size)continue;
  const planningItems=base.items.map(e=>forced.has(e.hex)?{...e,method:'ct2',keys:ct2(e.hex)}:e);
  const allUnits=rawUnits(planningItems,kind),target=allUnits.map(u=>u.raw),weights={};target.forEach(h=>weights[h]=(weights[h]||0)+1);
  const cache=new Map(),local=[];
  const offerOne=(bank,exact=null,preExpand=false)=>{
   const id=hexList(bank)+'/'+preExpand+(exact?'/'+JSON.stringify(exact.boundaryKeeps)+'/'+exact.cells.map(c=>c.value).join(''):'');if(cache.has(id))return cache.get(id);
   // A paired F prefix can encode two logical seed symbols in two bytes.
   // The old raw-byte bound incorrectly rejected banks such as 9 x F470.
   const lowerBytes=sum(bank,h=>h.length===2&&ct2(h)?0:preExpand&&/^F[0-9A-F]{3}$/.test(h)?1:rawBytes(h));
   if(lowerBytes>17){cache.set(id,null);return null;}
   let packing=exact||packSeeds(bank,weights,true,{pairPrefixes:preExpand});
   if(!packing){cache.set(id,null);return null;}
   const omitted=new Set([...packing.omitted,...forced]);
   if(omitted.size&&!exact){const clean=packSeeds(bank.filter(h=>!omitted.has(h)),weights,false,{pairPrefixes:preExpand});if(!clean){cache.set(id,null);return null;}packing={...clean,omitted:[...omitted],conversions:sum([...omitted],h=>weights[h])};}
   if(exact)packing={...packing,omitted:[...omitted],conversions:sum([...omitted],h=>weights[h]||1)};
   const units=allUnits.filter(u=>!omitted.has(u.raw)),items=base.items.map(e=>({...e}));
   for(const e of items)if(e.method==='packed'&&omitted.has(e.hex)){e.method='ct2';e.keys=ct2(e.hex);}
   let duplication;try{duplication=duplicatePlan(packing.seeds,units.map(u=>u.raw),base.config);}catch{cache.set(id,null);return null;}
   const conversions=items.filter(e=>e.method==='ct2');
   const estimate=packing.cost+sum(duplication,d=>404+4*d.before.length-2*sum(d.before,rawBytes))+sum(units,u=>u.keys?.length||0);
   const p={...base,items,packing,duplication,units,conversions,estimate,templateKind:kind,preExpand};
   cache.set(id,p);local.push(p);return p;
  };
  const offer=(bank,exact=null)=>{
   const candidates=exact?[offerOne(bank,exact)]:[offerOne(bank),offerOne(bank,null,true)];
   return candidates.filter(Boolean).sort((a,b)=>a.duplication.length-b.duplication.length||a.estimate-b.estimate)[0]||null;
  };
  const unique=[...new Set(target)],last=[...new Set(target.slice().reverse())].reverse();
  offer(target);offer(unique);offer(last);offer(unique.slice().reverse());
  for(const packing of seedSearch(target,{deadline:options.searchDeadline||Infinity}).packings)offer(packing.assignedSeeds,packing);
  offer(unique.slice().sort((a,b)=>weights[b]-weights[a]));
  // Exact two-piece merges for every split; balanced merges for larger copy
  // counts provide seed orders that also preserve useful repeated symbols.
  for(let split=1;split<target.length;split++)offer(mergeSequences(target.slice(0,split),target.slice(split)));
  for(const count of [3,4,5,6,8]){
   const chunks=Array.from({length:count},(_,i)=>target.slice(Math.floor(i*target.length/count),Math.floor((i+1)*target.length/count)));
   offer(chunks.reduce((a,b)=>mergeSequences(a,b),[]));offer(chunks.slice().reverse().reduce((a,b)=>mergeSequences(a,b),[]));
  }
  // Look for a common seed for three/four consecutive pieces. Unequal
  // splits matter: a rare symbol near one edge must not force an extra pass.
  if(kind!=='literal'&&target.length<=48){
   const stride=target.length>32?2:1,cuts=[];
   for(let c=1;c<target.length;c+=stride)cuts.push(c);
   const firstMerges=new Map();
   for(const a of cuts)for(const b of cuts){
    if(b<=a)continue;
    const first=mergeSequences(target.slice(0,a),target.slice(a,b));
    if(sum(first,rawBytes)>17)continue;
    firstMerges.set(a+','+b,first);
    offer(mergeSequences(first,target.slice(b)));
   }
   for(const [key,first] of firstMerges){
    const b=Number(key.split(',')[1]);
    for(const c of cuts)if(c>b){
     const third=mergeSequences(first,target.slice(b,c));
     if(sum(third,rawBytes)<=17)offer(mergeSequences(third,target.slice(c)));
    }
   }
  }
  const order=(a,b)=>a.duplication.length-b.duplication.length||a.estimate-b.estimate;
  // Spend remaining assignment bytes on an extra occurrence if it reduces
  // full physical-key cost. Preserve multiple promising starting orders.
  let frontier=local.slice().sort(order).slice(0,3);
  for(let depth=0;depth<3&&frontier.length;depth++){
   const next=[];
   for(const current of frontier){
    const bank=current.packing.seeds;
    for(const h of unique)for(let at=0;at<=bank.length;at++){
     if(bank.filter(x=>x===h).length>=weights[h])continue;
     const p=offer([...bank.slice(0,at),h,...bank.slice(at)]);
     if(p&&order(p,current)<0)next.push(p);
    }
   }
   frontier=[...new Set(next)].sort(order).slice(0,2);
  }
  const finalists=[...local.slice().sort(order).slice(0,8),...local.slice().sort((a,b)=>a.estimate-b.estimate).slice(0,3)];
  for(const p of finalists){
   const id=hexList(p.packing.seeds)+'/'+p.units.map(u=>u.output.join(',')).join(';')+'/'+p.packing.cells.map(c=>c.value).join('');
   if(!seen.has(id)){seen.add(id);result.push(p);}
  }
 }
 return result.sort((a,b)=>a.duplication.length-b.duplication.length||a.estimate-b.estimate).slice(0,18);
}

// Prepared inputs exclude CT1 and CT2 from the mandatory core. The catalog
// explores literal, single-prefix, paired-prefix and mixed representations.
function tokenVariants(base,{width=10,limit=36,deadline=Infinity}={}){
 const optional=[...new Set(base.items.filter(e=>e.method==='packed'&&e.hex.length===2&&ct2(e.hex)).map(e=>e.hex))];
 const masks=[];
 const addMask=a=>{const id=a.slice().sort().join(',');if(!masks.some(x=>x.id===id))masks.push({id,omit:new Set(a)});};
 addMask(optional);addMask([]);
 if(optional.length<=4){for(let mask=0;mask<2**optional.length;mask++)addMask(optional.filter((_,i)=>mask&(1<<i)));}
 else for(const h of optional){addMask([h]);addMask(optional.filter(x=>x!==h));}
 const variants=[],seen=new Map();let representationsTruncated=false;
 const add=(items,units,kind)=>{
  const id=items.filter(e=>e.method==='ct2').map(e=>e.index).join(',')+'/'+units.map(u=>u.raw).join(',');
  const candidate={items,units,kind},old=seen.get(id);
  if(old){if(sum(units,u=>u.keys?.length||0)<sum(old.units,u=>u.keys?.length||0)){old.units=units;old.kind=kind;}return;}
  seen.set(id,candidate);variants.push(candidate);
 };
 for(const mask of masks){
  if(Date.now()>deadline){representationsTruncated=true;break;}
  const items=base.items.map(e=>mask.omit.has(e.hex)?{...e,method:'ct2',keys:ct2(e.hex)}:{...e});
  for(const kind of ['pairs','literal','single'])add(items,rawUnits(items,kind),kind);
  const anchors=items.filter(e=>e.method==='packed'),paths=Array.from({length:anchors.length+1},()=>[]);paths[0]=[[]];
  const score=units=>sum([...new Set(units.map(u=>u.raw))],rawBytes)+sum(units,u=>rawBytes(u.raw))*0.08+sum(units,u=>u.keys?.length||0)*0.002;
  const prune=at=>{
   const unique=new Map();for(const u of paths[at]){const id=u.map(x=>x.raw).join(',');const old=unique.get(id);if(!old||score(u)<score(old))unique.set(id,u);}
   const all=[...unique.values()].sort((a,b)=>score(a)-score(b));if(all.length>width)representationsTruncated=true;paths[at]=all.slice(0,width);
  };
  for(let i=0;i<anchors.length;i++){
   if(Date.now()>deadline){representationsTruncated=true;break;}
   prune(i);const e=anchors[i],left=e.hex.length===4?S.f4SuffixKeys(e.hex.slice(2)):null;
   const choices=[{take:1,unit:{raw:e.hex,output:[e.hex],indices:[e.index]}}];
   if(left){
    choices.push({take:1,unit:{raw:e.hex.slice(0,2).repeat(2),output:[e.hex],indices:[e.index],keys:['RIGHT',...left,'LEFT','9','DEL','RIGHT']}});
    const next=anchors[i+1],right=next?.hex.length===4?S.f4SuffixKeys(next.hex.slice(2)):null;
    if(right)choices.push({take:2,unit:{raw:e.hex.slice(0,2)+next.hex.slice(0,2),output:[e.hex,next.hex],indices:[e.index,next.index],keys:['RIGHT',...right,'LEFT',...left,'RIGHT']}});
   }
   for(const path of paths[i])for(const c of choices)paths[i+c.take].push([...path,c.unit]);
  }
  prune(anchors.length);for(const path of paths.at(-1))add(items,path,'mixed');
 }
 // Round-robin methods/CT2 choices so one representation cannot consume
 // the entire budget. Mandatory-only candidates lead each round.
 variants.sort((a,b)=>a.items.filter(e=>e.method==='packed'&&e.hex.length===2&&ct2(e.hex)).length-b.items.filter(e=>e.method==='packed'&&e.hex.length===2&&ct2(e.hex)).length||sum(a.units,u=>rawBytes(u.raw))-sum(b.units,u=>rawBytes(u.raw)));
 if(variants.length>limit)representationsTruncated=true;
 return {variants:variants.slice(0,limit),representationsTruncated,ct2SubsetsComplete:optional.length<=4};
}
function advancedPlans(raw,options,upperBound,deadline){
 const base=prepare(raw,options),catalog=tokenVariants(base,{deadline}),plans=[];
 const bound=Math.min(6,upperBound);
 for(const variant of catalog.variants){
  if(Date.now()>deadline)break;
  const target=variant.units.map(u=>u.raw);
  if(!target.length){
   const packing=packSeeds([]);plans.push({...base,items:variant.items,packing,duplication:[],units:[],conversions:variant.items.filter(e=>e.method==='ct2'),templateKind:variant.kind,
    optimization:{status:'minimum-for-fixed-token-target',rounds:0,scope:'fixed raw-token representation',representationsTruncated:catalog.representationsTruncated}});continue;
  }
  const search=seedSearch(target,{budget:45000,maxRounds:bound,maxResults:3,deadline});
  for(const packing of search.packings){
   let duplication;try{duplication=duplicatePlan(packing.seeds,target,base.config);}catch{continue;}
   const proven=search.stats.completeThrough>=duplication.length-1;
   plans.push({...base,items:variant.items,packing,duplication,units:variant.units,conversions:variant.items.filter(e=>e.method==='ct2'),templateKind:variant.kind,
    optimization:{status:proven?'minimum-for-fixed-token-target':'best-found',rounds:duplication.length,scope:'fixed raw-token representation',search:search.stats,representationsTruncated:catalog.representationsTruncated,ct2SubsetsComplete:catalog.ct2SubsetsComplete}});
  }
 }
 return plans;
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

// Cursor positions count tokens; input limits count bytes. A Vietnamese Fxxx
// glyph and an unconverted CT2 each take one cursor step but two bytes.
// Special overflow operations are explicit transitions, not ordinary DELs.
class InputTape{
 constructor(tokens,cursor=0){this.tokens=tokens.map(x=>({...x}));this.cursor=cursor;this.keys=[];this.serial=0;this.saved=null;this.cacheStart=null;}
 bytes(){return sum(this.tokens,t=>t.bytes);}
 take(){const k=this.keys;this.keys=[];return k;}
 move(to){
  if(!Number.isInteger(to)||to<0||to>this.tokens.length)throw Error('Vị trí con trỏ không hợp lệ.');
  this.keys.push(...repeat([to<this.cursor?'LEFT':'RIGHT'],Math.abs(to-this.cursor)));this.cursor=to;
 }
 insert(nodes,keys){
  if(this.cacheStart===null&&this.bytes()+sum(nodes,t=>t.bytes)>INPUT_CAPACITY)throw Error('Vượt giới hạn nhập 200 byte.');
  this.tokens.splice(this.cursor,0,...nodes.map(t=>({id:'t'+(++this.serial),...t})));this.cursor+=nodes.length;this.keys.push(...keys);
 }
 erase(n=1){
  if(!Number.isInteger(n)||n<0||n>this.cursor)throw Error('Số lần DEL không hợp lệ.');
  this.tokens.splice(this.cursor-n,n);this.cursor-=n;this.keys.push(...repeat(['DEL'],n));
 }
 q(){const i=this.tokens.findLastIndex(t=>t.role==='q');if(i<0)throw Error('Thiếu đuôi 62 19 23.');return i;}
 guard(){if(this.tokens[0]?.role!=='guard'){this.move(0);this.insert([{hex:GUARD_HEX,bytes:1,role:'guard'}],GUARD_KEYS);}}
 numbers(n,role){
  if(!Number.isInteger(n)||n<0)throw Error('Số chữ số đệm không hợp lệ.');
  const keys=digits(n);this.insert(keys.map(k=>({hex:'3'+k,bytes:1,role})),keys);
 }
 saveStart(capacity){
  if(this.bytes()>capacity)throw Error('Dãy cần lưu vượt Cache Area.');
  this.saved=this.tokens.map(t=>({...t}));this.keys.push('CALC','AC','RIGHT');this.cursor=0;
 }
 openCache(){
  if(this.bytes()!==INPUT_CAPACITY||!this.saved||this.tokens.at(-1)?.hex!=='23')throw Error('Chưa đủ 200 byte để mở bản lưu.');
  // The user's boundary is ...62 19 | saved. Keep that boundary intact;
  // do not treat RIGHT RIGHT DEL as a normal backspace on token 19.
  this.tokens.pop();this.cacheStart=this.tokens.length;this.cursor=this.cacheStart;
  this.tokens.push(...this.saved.map(t=>({...t,originId:t.id,id:'c'+(++this.serial)})));
  this.keys.push('RIGHT','RIGHT','DEL');
 }
 convert(id){
  const at=this.tokens.findIndex(t=>t.originId===id);
  if(this.cacheStart===null||at<this.cacheStart||this.tokens[at].bytes!==2)throw Error('Không tìm được CT2 trong bản lưu.');
  this.move(at);this.keys.push('9','DEL');this.tokens[at].bytes=1;this.tokens[at].converted=true;
 }
 recallCacheStart(){
  if(this.cacheStart===null)throw Error('Cache chưa được mở.');
  this.tokens=this.tokens.slice(this.cacheStart).map(({originId,...t})=>({...t,id:originId||t.id}));
  this.cacheStart=null;this.saved=this.tokens.map(t=>({...t}));this.cursor=0;this.keys.push('AC','RIGHT');
 }
 prune(keep){
  // Retain the final 62 19 23, then walk backwards. Every discarded token
  // is exactly one DEL, irrespective of its byte length or screen width.
  this.move(this.tokens.length-3);
  while(this.cursor){if(keep.has(this.tokens[this.cursor-1].id))this.move(this.cursor-1);else this.erase();}
  this.cacheStart=null;
 }
}

function generateForMode(raw,options={},chosen=null){
 const p=chosen||plan(raw,options),r=p.packing,steps=[];
 const add=(title,note='',segments=[],extra={})=>{steps.push({title:`B${steps.length+1}: ${title}`,note,segments:segments.filter(k=>k.length),...extra});};
 const textOf=e=>`${describe(e)} — dòng ${e.displayLine}, vị trí ${e.column}`;
 add('Reset máy và chọn LineI/O','Reset sẽ xóa dữ liệu đang có trên máy tính.',[D.RESET,D.LINE_IO]);
 // Enter the edit mode first, then assign the export variables directly.
 // 4D/4E/4F export in fixed address order, never in assignment order.
 add(`Vào ${p.config.label}`,'Giữ đúng hai nhóm 100 và '+p.config.extra+' chữ số, có dấu + ở giữa.',[D.BASIC_OVERFLOW,modeKeys(p.config.extra)]);
 add('Vào Basic overflow để gán @','Bấm ON rồi thực hiện overflow; = và AC bấm nhanh.',[['ON'],D.BASIC_OVERFLOW]);
 const exportOrder=['4D','4E','4F'].slice(0,r.count);
 const extraction=[...'ABC'.slice(0,r.count)];
 const bold=[...r.cells.map(c=>c.value).join('')].filter(c=>/[A-F]/.test(c));
 const assign=[...'1234567890','X'];
 for(let v=0;v<r.count;v++)assign.push(...D.TTK[':'],'RIGHT',...D.TTK['='],...valueKeys(r,v));
 const assignments=S.assignmentLines(r).map((row,i)=>i===0?'1234567890𝓍:':row.replace(/^[ABC]/,'@<'+exportOrder[i-1]+'>'));
 add('Gán hex trực tiếp vào @<4D>, @<4E>, @<4F>','Xuất theo địa chỉ 4D → 4E → 4F; FB01 ở đầu, 62 19 23 ở cuối.',[
  [...D.BOLD_START,...extraction.flatMap(c=>D.EXTRACT_KEYS[c]),...bold.flatMap(c=>D.BOLD_HEX_KEYS[c])],
  repeat(D.BOLD_RECOVER,r.count+bold.length),repeat(['DEL'],11),assign
 ],{checkpoint:assignments.join('\n')});
 const exportExecutions=2*(r.count+1)+1;
 add('Thực thi và mở chuỗi đã xuất','Đi qua các biểu thức hai lượt rồi mở dãy xuất.',[['CALC',...repeat(['EXEC'],exportExecutions),'AC','DOWN']]);
 const units=[];
 for(let v=0;v<r.count;v++){
  if(v)for(let b=0;b<2;b++)units.push({hex:'01',padding:b>=(r.boundaryKeeps?.[v]||0)});
  const start=[0,6,14][v],cells=r.cells.slice(start,start+D.TEMPLATES[v][2].length);
  for(let i=0;i<cells.length;i++){const c=cells[i],macro=r.macros[start+i];
   if(macro){units.push({macro});i+=macro.bytes-1;}
   else if(c.value.startsWith('F')&&!c.padding)units.push({hex:c.value+cells[++i].value,padding:false});
   else units.push({hex:c.value,padding:c.padding});}
 }
 const cleanup=[];let previousHex=null;
 for(const u of units){
  if(u.macro){const m=u.macro;cleanup.push('RIGHT',...(m.rightKeys||['RIGHT']),'LEFT',...m.leftKeys,'RIGHT');previousHex=m.right;}
  else if(u.padding){
   // Backspace immediately after an unresolved FxFy may consume its
   // trailing prefix with the padding. Reject this candidate; a literal
   // or pre-expanded packing avoids that ambiguous byte boundary.
   if(previousHex?.slice(-2).startsWith('F'))throw Error('Không xóa đệm ngay sau cặp tiền tố F chưa mở rộng.');
   cleanup.push('RIGHT','DEL');
  }else{cleanup.push('RIGHT');previousHex=u.hex;}
 }
 add('Ghép tiền tố F và xóa byte đệm','Chuỗi phím đã tính cả lần chuyển từ cuối về đầu và xóa các byte đệm giữa hai biến.',[['RIGHT',...cleanup]],{checkpoint:hexList(['FB01',...r.seeds,'62','19','23'])});
 // Cleanup ends AFTER the final 23. Move across every actual token back
 // to position zero; RIGHT after 19 is not the beginning of the input.
 const startCursor=r.seeds.length+4; // FB01 + expanded seeds + 62 19 23.
 add('Về đầu dãy, nhập 1 và lưu trước lần edit thứ hai','Lùi về vị trí đầu tiên, trước FB01, rồi nhập số 1.',[repeat(['LEFT'],startCursor),GUARD_KEYS.slice(),repeat(['EXEC'],23)],
  {checkpoint:hexList([GUARD_HEX,'FB01',...r.seeds,'62','19','23'])});
 add(`Vào edit lần hai · ${p.config.label}`,'Thực hiện Basic overflow đầy đủ; = và AC phải bấm nhanh.',[D.BASIC_OVERFLOW,modeKeys(p.config.extra)]);
 add('Mở dữ liệu và bỏ FB01','Sau edit lần hai, nhấn UP để gọi lại dãy như hướng dẫn ảnh. Xóa FB01, giữ số 1 đầu dãy cùng đuôi 62 19 23.',[['UP','RIGHT','RIGHT','RIGHT','DEL']],{checkpoint:'1 + '+hexList([...r.seeds,'62','19','23'])});

 const tape=new InputTape([
  {id:'guard',hex:GUARD_HEX,bytes:1,role:'guard'},
  ...r.seeds.map((hex,i)=>({id:'seed'+i,hex,bytes:rawBytes(hex),role:'content'})),
  {id:'q',hex:'62',bytes:1,role:'q'},
  {id:'19',hex:'19',bytes:1,role:'19'},
  {id:'end',hex:'23',bytes:1,role:'end'}
 ],1);
 const cachePasses=[],duplicationPasses=[];
 const emit=(title,extra={})=>add(title,'',[tape.take()],extra);

 for(const [i,d] of p.duplication.entries()){
  tape.guard();tape.saveStart(p.config.cache);
  const savedBytes=tape.bytes();
  emit('Nhân đôi '+(i+1)+' · lưu dãy');
  tape.move(tape.q());
  const fill=INPUT_CAPACITY-savedBytes;tape.numbers(fill,'duplicate-pad');tape.openCache();
  const prefix=tape.tokens.slice(0,tape.cacheStart),copy=tape.tokens.slice(tape.cacheStart);
  const both=[...prefix.filter(t=>t.role==='content'),...copy.filter(t=>t.role==='content')];
  const keep=new Set([prefix[0].id,...d.keep.map(pos=>both[pos-1].id)]);
  emit('Nhân đôi '+(i+1)+' · mở bản sao');
  const before=tape.tokens.length;
  tape.prune(keep);
  duplicationPasses.push({savedBytes,fill,fullBytes:INPUT_CAPACITY,deletedTokens:before-tape.tokens.length});
  emit('Nhân đôi '+(i+1)+' · xóa phần thừa',{checkpoint:hexList(d.after)});
  if(hexList(tape.tokens.filter(t=>t.role==='content'))!==hexList(d.after))throw Error('Kết quả nhân đôi không khớp nội dung cần giữ.');
 }
 const expansions=[];
 if(p.units?.some(u=>u.keys)){
  tape.move(tape.tokens[0]?.role==='guard'?1:0);
  for(const u of p.units){
   const at=tape.cursor,token=tape.tokens[at];
   if(token?.hex!==u.raw)throw Error('Sai token trước khi mở rộng tiền tố F.');
   if(!u.keys){tape.move(at+1);continue;}
   const beforeBytes=tape.bytes();
   if(beforeBytes+2>INPUT_CAPACITY)throw Error('Không đủ chỗ tạm để mở rộng tiền tố F.');
   tape.keys.push(...u.keys);
   const nodes=u.output.map(hex=>({id:'expanded'+(++tape.serial),hex,bytes:rawBytes(hex),role:'content'}));
   tape.tokens.splice(at,1,...nodes);tape.cursor=at+nodes.length;
   expansions.push({raw:u.raw,output:u.output,keys:u.keys,beforeBytes,peakBytes:beforeBytes+2,afterBytes:tape.bytes()});
  }
  emit('Điền hậu tố sau khi nhân đôi',{checkpoint:hexList(p.units.flatMap(u=>u.output))});
 }
 const packed=p.items.filter(e=>e.method==='packed');let anchor=0;
 for(const token of tape.tokens)if(token.role==='content'){
  const e=packed[anchor++];if(!e||e.hex!==token.hex)throw Error('Bộ ký tự sau nhân đôi không khớp.');
  token.id='item'+e.index;token.index=e.index;
 }
 if(anchor!==packed.length)throw Error('Thiếu ký tự sau nhân đôi.');

 const cacheBatch=(label,targets)=>{
  tape.guard();tape.move(tape.q());
  const sourceBytes=tape.bytes(),fill=p.config.cache-sourceBytes;
  if(fill<0)throw Error('Bước chuyển CT2 vượt dung lượng Cache Area.');
  tape.numbers(fill,'cache-pad');tape.saveStart(p.config.cache);
  emit('Lưu Cache Area · '+label);
  tape.move(tape.q());
  const extra=INPUT_CAPACITY-tape.bytes();tape.numbers(extra,'input-pad');tape.openCache();
  emit('Mở vùng chuyển đổi · '+label);
  // The confirmed boundary points BEFORE the complete saved sequence,
  // including its leading 1. Remove that guard explicitly in the copy.
  if(tape.tokens[tape.cursor]?.role!=='guard')throw Error('Bản lưu thiếu số 1 ở đầu.');
  tape.move(tape.cursor+1);tape.erase();
  emit('Bỏ số 1 đầu bản lưu · '+label);
  for(const target of targets){tape.convert(target.id);emit('Chuyển '+target.label);}
  tape.recallCacheStart();
  // AC RIGHT recalls the saved copy: only the first group of digits is
  // present. The second group belonged to the discarded input prefix.
  tape.move(tape.q());
  if(tape.tokens.slice(tape.cursor-fill,tape.cursor).some(t=>t.role!=='cache-pad'))throw Error('Vị trí số đệm Cache không khớp.');
  tape.erase(fill);
  cachePasses.push({label,sourceBytes,firstFill:fill,saveBytes:p.config.cache,secondFill:extra,fullBytes:INPUT_CAPACITY,deletedFiller:fill,converted:targets.length,contentConverted:targets.filter(t=>t.id.startsWith('item')).length,launcherConverted:targets.filter(t=>t.id.startsWith('control')).length,targetIds:targets.map(t=>t.id),afterBytes:tape.bytes()});
  emit('Xóa số đệm Cache · '+label);
 };

 // Insert launcher CT2 before batching so content and launcher can share
 // one cache opening. Delay direct typing until conversions are finished;
 // it consumes no cache space during the conversion phase.
 const controls=p.lines===2?[{label:'D',keys:D.BOLD_HEX_KEYS.D}]:Array.from({length:2*p.lines-1},(_,i)=>i%2?{label:'D',keys:D.BOLD_HEX_KEYS.D}:{label:'@',keys:['SHIFT','8','1','NEG']});
 tape.move(tape.q());
 controls.forEach((c,i)=>tape.insert([{id:'control'+i,hex:c.label,bytes:2,role:'control'}],c.keys));
 emit('Chèn CT2 launcher trước đợt chuyển chung');
 const controlTargets=controls.map((c,i)=>({id:'control'+i,label:c.label+' launcher số '+(i+1)}));
 let pending=p.conversions.slice(),batchNumber=0;
 do{
  const targets=[];
  // Leave room for a leading guard even after a prior conversion pass.
  while(pending.length&&tape.bytes()+(tape.tokens[0]?.role==='guard'?0:1)+2<=p.config.cache){
   const e=pending.shift();
   const next=tape.tokens.findIndex(t=>t.role==='content'&&t.index>e.index);
   tape.move(next<0?tape.tokens.findIndex(t=>t.id==='control0'):next);
   tape.insert([{id:'item'+e.index,index:e.index,hex:e.hex,bytes:2,role:'content'}],e.keys);
   emit('Chèn CT2 cho '+textOf(e));
   targets.push({id:'item'+e.index,label:textOf(e)});
  }
  if(pending.length&&!targets.length)throw Error('Không đủ chỗ tạm cho CT2 trong Cache Area.');
  // Only the final batch converts the launcher, together with the remaining
  // content. Extra content batches are necessary only when cache is full.
  if(!pending.length)targets.push(...controlTargets);
  cacheBatch(!pending.length?'nội dung + launcher':'nội dung '+(++batchNumber),targets);
 }while(pending.length);

 tape.move(tape.tokens[0]?.role==='guard'?1:0);
 for(const e of p.items){
  if(e.method==='direct')tape.insert([{id:'item'+e.index,index:e.index,hex:e.hex,bytes:e.bytes,role:'content'}],e.keys);
  else{
   if(tape.tokens[tape.cursor]?.id!=='item'+e.index)throw Error('Vị trí ký tự có sẵn không khớp.');
   tape.move(tape.cursor+1);
  }
 }
 emit('Hoàn thiện nội dung theo thứ tự dòng 1 đến dòng cuối',{
  checkpoint:p.displayLines.map((a,i)=>'Dòng '+(i+1)+': '+hexList(a)).join('\n')
 });

 if(p.nums){
  tape.move(tape.tokens.findIndex(t=>t.id==='control0'));tape.numbers(p.nums,'nums');
  emit('Chèn số đệm nums');
 }
 tape.move(tape.q());
 tape.keys.push('RIGHT','RIGHT','SHIFT','7','3','RECIPROCAL','LEFT','9','DEL','DEL','DEL');
 // PDF's F extraction replaces the visible 19 ending with F. Normalize
 // the cursor using the user's CALC / clear / RIGHT rule before editing.
 tape.tokens[tape.q()+1]={id:'final-f',hex:'3F',bytes:1,role:'f'};
 tape.saveStart(p.config.cache);
 emit('Lấy F ở phần kết thúc');
 const literal=(text,role='hack')=>[...text].map(c=>({hex:c,bytes:1,role}));
 const type=(text,keys)=>tape.insert(literal(text),keys);
 if(p.lines===2){
  tape.move(tape.tokens.findIndex(t=>t.id==='control0'));
  type('┘',['FRACTION']);tape.move(tape.cursor+1);type('21',['2','1']);
  tape.move(tape.tokens.findIndex(t=>t.role==='f')+1);type('2x',['2','X']);
  emit('Ghép hackstring 2 dòng',{checkpoint:'┘D21Q(F2x'});
 }else{
  const recipes=p.lines===3?[
   {parts:[['2',1],['J▸cal',2],['2',1],['┘',1]],keys:['2','SHIFT','8','DOWN','3','3','2','FRACTION']},
   {parts:[['2',1],['Ran#',1],['2',1],['┘',1]],keys:['2','SHIFT','DOT','2','FRACTION']},
   {parts:[['2',1],['km▸mile',2],['2',1]],keys:['2','SHIFT','8','1','8','2']}
  ]:[
   {parts:[['2',1],['1',1],['1',1],['1',1],['┘',1]],keys:['2','1','1','1','FRACTION']},
   {parts:[['2',1],['1',1],['e',1],['2',1],['┘',1]],keys:['2','1','ALPHA','EXP','2','FRACTION']},
   {parts:[['2',1],['pc▸km',2],['2',1],['┘',1]],keys:['2','SHIFT','8','1','DMS','2','FRACTION']},
   {parts:[['2',1],['in▸cm',2],['2',1]],keys:['2','SHIFT','8','1','1','2']}
  ];
  for(let i=0;i<p.lines;i++){
   tape.move(tape.tokens.findIndex(t=>t.id==='control'+(i*2)));
   type('=',D.TTK['=']);tape.move(tape.cursor+1);
   tape.insert(recipes[i].parts.map(([hex,bytes])=>({hex,bytes,role:'hack'})),recipes[i].keys);
   if(i<p.lines-1){tape.move(tape.cursor+1);type('21',['2','1']);}
   emit('Ghép hackstring · cụm @ thứ '+(i+1));
  }
  tape.move(tape.tokens.findIndex(t=>t.role==='f')+1);type('2x',['2','X']);
  emit('Kết thúc hackstring',{checkpoint:p.lines===3?'=@2J▸cal2┘D21=@2Ran#2┘D21=@2km▸mile2Q(F2x':'=@2111┘D21=@21e2┘D21=@2pc▸km2┘D21=@2in▸cm2Q(F2x'});
 }
 if(tape.tokens.some(t=>['guard','cache-pad','input-pad','duplicate-pad','19'].includes(t.role)))throw Error('Còn token đệm chưa được xóa.');
 add('Chạy spell','',[['CALC','EXEC']]);
 return {...p,line:p.items,assignments,exportOrder,exportExecutions,steps,strategy:'multiline-cache',guided:false,keyCount:sum(steps,s=>sum(s.segments,k=>k.length)),
  cachePasses,duplicationPasses,expansions,execution:{tokens:tape.tokens,cursor:tape.cursor,bytes:tape.bytes()},
  summary:p.lines+' dòng · '+p.config.label+' · '+p.contentBytes+'/'+p.config.capacity+' byte · nums '+p.nums+' · chuyển '+p.conversions.length+' CT2 nội dung',notes:''};
}

function generate(raw,options={}){
 const started=Date.now(),deadline=started+Math.max(200,Math.min(2600,options.searchTimeMs||2200));
 const candidates=[],errors=[],modes=options.mode&&options.mode!=='auto'?[options.mode]:['194','198'];
 for(const mode of modes){
  const opts={...options,mode,searchDeadline:deadline};
  try{candidates.push(generateForMode(raw,opts));}catch(e){errors.push(e);}
  try{for(const p of optimizedPlans(raw,opts)){
   try{candidates.push(generateForMode(raw,opts,p));}catch(e){errors.push(e);}
  }}catch(e){errors.push(e);}
 }
 for(const mode of modes.slice().reverse()){
  if(Date.now()>deadline)break;
  const opts={...options,mode},bound=candidates.length?Math.min(...candidates.map(c=>c.duplication.length)):6;
  try{for(const p of advancedPlans(raw,opts,bound,deadline)){
   try{candidates.push(generateForMode(raw,opts,p));}catch(e){errors.push(e);}
  }}catch(e){errors.push(e);}
 }
 if(!candidates.length)throw errors.at(-1);
 candidates.sort((a,b)=>a.duplication.length-b.duplication.length||a.cachePasses.length-b.cachePasses.length||a.keyCount-b.keyCount||a.steps.length-b.steps.length||a.config.extra-b.config.extra||Number(!a.optimization)-Number(!b.optimization));
 const best=candidates[0];best.automaticMode=!options.mode||options.mode==='auto';
 if(!best.optimization)best.optimization={status:best.duplication.length===0?'minimum-for-fixed-token-target':'best-found',rounds:best.duplication.length,scope:'fixed raw-token representation'};
 best.optimization.elapsedMs=Date.now()-started;best.optimization.globalOptimalityProven=false;
 return best;
}
root.SpellMulti={INPUT_CAPACITY,InputTape,MODES,prepare,plan,packSeeds,duplicatePlan,optimizedPlans,rawUnits,seedSearch,tokenVariants,advancedPlans,generate,modeKeys};
})(globalThis);
