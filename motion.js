/* iart.ai: micro-interaction, accessible-animation, 60fps-animation, SVG.
 * Progressive enhancement. Spell data and generated keys never depend on motion.
 * No CDN, timers driving frames, scroll hijacking or animation of layout sizes.
 */
(function(root){
 'use strict';
 const doc=document,html=doc.documentElement,$=id=>doc.getElementById(id);
 const mq=root.matchMedia?.('(prefers-reduced-motion: reduce)');
 const params=new URLSearchParams(root.location?.search||'');
 const frozen=params.has('t')&&Number.isFinite(Number(params.get('t')))?Math.max(0,Number(params.get('t'))*1000):null;
 const forcedReduced=params.get('reduce')==='1';
 const ease='cubic-bezier(.16,1,.3,1)',active=new Set();
 let preference='on',booted=false,progressFrame=0,resizeObserver;
 try{preference=localStorage.getItem('casio-spell-motion')==='off'?'off':'on';}catch{}
 function reduced(){return preference==='off'||forcedReduced||!!mq?.matches;}
 function cancel(scope){for(const record of [...active])if(!scope||record.scope===scope){record.animation.cancel();record.clean();}}
 function play(node,frames,options={},extra={}){
  const done=extra.done||(()=>{}),dispose=extra.dispose||(()=>{});
  if(!node||!node.animate||doc.hidden){dispose();done();return null;}
  if(reduced()){
   if(extra.decorative){dispose();done();return null;}
   // Keep short feedback fades; remove translation, scale, stroke and delay.
   if(!frames.some(frame=>frame.opacity!==undefined)){dispose();done();return null;}
   frames=frames.map(frame=>({opacity:frame.opacity??1}));
   options={...options,duration:Math.min(options.duration||160,160),delay:0};
  }
  let animation;
  try{animation=node.animate(frames,{duration:240,easing:ease,fill:'backwards',...options});}catch{dispose();done();return null;}
  let disposed=false;
  const record={animation,scope:extra.scope,clean(){if(disposed)return;disposed=true;active.delete(record);dispose();}};
  active.add(record);
  animation.onfinish=()=>{record.clean();done();};
  animation.oncancel=record.clean;
  if(frozen!==null){animation.pause();animation.currentTime=Math.min(frozen,(options.delay||0)+(options.duration||240));}
  return animation;
 }
 function fadeIn(node,{scope='feedback',duration=240,delay=0,y=6}={}){
  return play(node,[{opacity:0,transform:`translateY(${y}px)`},{opacity:1,transform:'translateY(0)'}],{duration,delay},{scope});
 }
 function syncPreference(){
  cancel();html.dataset.motion=reduced()?'reduced':'full';
  const button=$('motion-toggle');
  if(button){button.setAttribute('aria-pressed',String(!reduced()));button.title=mq?.matches?'Chuyển động đã được giảm theo cài đặt hệ thống':reduced()?'Bật hiệu ứng chuyển động':'Tắt hiệu ứng chuyển động';}
  queueProgress();
 }
 function tab(animate=true){
  const indicator=$('tab-indicator'),selected=doc.querySelector('[data-group].active');
  if(!indicator||!selected)return;
  cancel('tab');
  const oldX=parseFloat(indicator.style.left)||selected.offsetLeft,oldWidth=parseFloat(indicator.style.width)||selected.offsetWidth;
  const x=selected.offsetLeft,width=selected.offsetWidth;
  indicator.style.left=x+'px';indicator.style.width=width+'px';indicator.style.transformOrigin='left center';
  indicator.parentElement.classList.add('motion-tabs');
  if(booted&&animate&&width)play(indicator,[{transform:`translateX(${oldX-x}px) scaleX(${oldWidth/width})`},{transform:'translateX(0) scaleX(1)'}],{duration:250},{scope:'tab',decorative:true});
 }
 function sweep(grid){
  if(reduced()||doc.hidden)return;
  const layer=doc.createElement('span');layer.className='palette-sweep';layer.setAttribute('aria-hidden','true');grid.append(layer);
  play(layer,[{transform:'translateX(-110%)',opacity:0},{opacity:1,offset:.3},{transform:'translateX(110%)',opacity:0}],{duration:650},{scope:'palette',decorative:true,dispose:()=>layer.remove()});
 }
 function palette(changed=true){
  if(!booted)return;
  cancel('palette');const grid=$('glyph-grid');
  play(grid,[{opacity:.65,transform:changed?'translateY(5px)':'none'},{opacity:1,transform:'none'}],{duration:changed?260:140},{scope:'palette'});
  if(changed){
   sweep(grid);
   // Eight axis markers carry the wave; avoid promoting 240 glyphs to layers.
   [...grid.querySelectorAll('.hex-axis')].slice(1,9).forEach((node,i)=>
    play(node,[{opacity:.35,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}],
     {duration:330,delay:i*18},{scope:'palette',decorative:true}));
  }
 }
 function keyedCells(){
  const counts=new Map();return [...$('preview').querySelectorAll('.spell-cell')].filter(cell=>cell.dataset.hex&&cell.dataset.hex!=='20').map(cell=>{
   const hex=cell.dataset.hex,n=counts.get(hex)||0;counts.set(hex,n+1);return {cell,key:hex+':'+n};
  });
 }
 function capturePreview(){
  cancel('preview');return new Map(keyedCells().map(({cell,key})=>[key,cell.getBoundingClientRect().left]));
 }
 function preview(previous){
  if(!booted)return;
  const measurements=keyedCells().map(({cell,key})=>({cell,key,left:cell.getBoundingClientRect().left}));
  let fresh=0;
  for(const {cell,key,left} of measurements){
   const old=previous?.get(key),dx=old===undefined?0:old-left;
   if(old!==undefined&&Math.abs(dx)<.5)continue;
   const isNew=old===undefined;
   play(cell.firstElementChild,[{opacity:isNew?0:1,transform:`translate(${dx}px,${isNew?5:0}px) scale(${isNew ? 0.88 : 1})`},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:260,delay:isNew?Math.min(fresh++*20,140):0},{scope:'preview'});
  }
 }
 function captureGlyph(button){
  if(!booted||reduced()||!button)return null;
  const source=button.querySelector('.glyph');
  return source?{rect:button.getBoundingClientRect(),glyph:source.cloneNode(true)}:null;
 }
 function fly(snapshot,hex){
  if(!snapshot||reduced()||!$('error').hidden)return;
  const target=[...$('preview').querySelectorAll('.spell-cell')].find(cell=>cell.dataset.hex===hex),from=snapshot.rect;
  if(!target||!from.width)return;
  const to=target.getBoundingClientRect();
  if(to.bottom<0||to.top>root.innerHeight)return;
  cancel('flight');
  const ghost=doc.createElement('span');ghost.className='glyph-flight';ghost.setAttribute('aria-hidden','true');
  Object.assign(ghost.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px',transformOrigin:'top left'});
  snapshot.glyph.style.setProperty('--g',from.width+'px');ghost.append(snapshot.glyph);doc.body.append(ghost);
  const dx=to.left-from.left,dy=to.top-from.top,scale=to.width/from.width;
  play(ghost,[{transform:'translate(0,0) scale(1)',opacity:.95},{transform:`translate(${dx*.55}px,${dy*.55-24}px) scale(${(1+scale)/2})`,opacity:.8,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(${scale})`,opacity:0}],{duration:420},{scope:'flight',decorative:true,dispose:()=>ghost.remove()});
 }
 function guide(){
  cancel('guide');if(!booted)return;
  const items=doc.querySelectorAll('#guide .assign-block, #guide .step');
  items.forEach((node,i)=>fadeIn(node,{scope:'guide',duration:250,delay:Math.min(i*35,180),y:8}));
  [...doc.querySelectorAll('#guide .step-keys p')].slice(0,6).forEach((node,i)=>
   fadeIn(node,{scope:'guide',duration:360,delay:Math.min(90+i*30,300),y:5}));
  queueProgress();
 }
 function scan(){
  if(reduced()||doc.hidden)return;
  const layer=doc.createElement('span');layer.className='preview-scan';layer.setAttribute('aria-hidden','true');
  doc.querySelector('.preview-wrap')?.append(layer);
  play(layer,[{transform:'translateX(-110%)',opacity:0},{opacity:1,offset:.25},{transform:'translateX(110%)',opacity:0}],
   {duration:800},{scope:'celebrate',decorative:true,dispose:()=>layer.remove()});
 }
 function theme(){
  cancel('theme');
  const button=$('theme-toggle'),icon=button?.querySelector(html.dataset.theme==='dark'?'.theme-sun':'.theme-moon');
  play(icon,[{opacity:0,transform:'rotate(-65deg) scale(.6)'},{opacity:1,transform:'rotate(0) scale(1)'}],
   {duration:420},{scope:'theme'});
  // Short panel fades soften the palette switch without hiding the document.
  doc.querySelectorAll('.card').forEach(node=>play(node,[{opacity:.78},{opacity:1}],{duration:230},{scope:'theme'}));
 }
 function generated(){
  cancel('celebrate');scan();
  play($('export-pdf'),[{opacity:.6,transform:'translateY(8px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}],
   {duration:400},{scope:'celebrate'});
  const button=$('generate');button.classList.add('is-generated');
  cancel('check');play(button.querySelector('.generate-check'),[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:260},{scope:'check',decorative:true});
 }
 function invalidate(){cancel('guide');cancel('celebrate');$('generate')?.classList.remove('is-generated');queueProgress();}
 function reference(){
  if(!booted)return;cancel('reference');
  ['.reference-heading','.formula-list','.reference-note'].forEach((selector,i)=>
   fadeIn(doc.querySelector(selector),{scope:'reference',duration:260,delay:i*40,y:5}));
 }
 function toast(){cancel('toast');play($('toast'),[{opacity:0,transform:'translate(-50%, 9px)'},{opacity:1,transform:'translate(-50%, 0)'}],{duration:200},{scope:'toast'});}
 function toastExit(done){cancel('toast');play($('toast'),[{opacity:1,transform:'translate(-50%, 0)'},{opacity:0,transform:'translate(-50%, 5px)'}],{duration:130,easing:'ease-in'},{scope:'toast',done});}
 function error(){cancel('error');if(booted)fadeIn($('error'),{scope:'error',duration:160,y:0});}
 function updateProgress(){
  progressFrame=0;const scroller=$('guide-scroll'),bar=$('guide-progress');if(!scroller||!bar)return;
  let value=0;
  if(!$('guide').hidden){
   const max=scroller.scrollHeight-scroller.clientHeight;
   if(max>1)value=scroller.scrollTop/max;
   else{const box=scroller.getBoundingClientRect();value=Math.max(0,Math.min(1,(root.innerHeight-box.top)/Math.max(1,box.height)));}
  }
  bar.style.transform=`scaleX(${Math.max(0,Math.min(1,value))})`;
 }
 function queueProgress(){if(!progressFrame)progressFrame=root.requestAnimationFrame(updateProgress);}
 function boot(){
  if(booted)return;booted=true;syncPreference();tab(false);
  const intro=[doc.querySelector('.brand-mark'),doc.querySelector('.brand-word'),doc.querySelector('.brand-light'),doc.querySelector('.palette'),doc.querySelector('.composer'),$('guide-section')];
  intro.forEach((node,i)=>fadeIn(node,{scope:'intro',duration:580,delay:i*65,y:i<3?6:18}));
  play(doc.querySelector('.logo-stroke'),[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:550,delay:80},{scope:'intro',decorative:true});
  palette(true);preview(new Map());
  $('motion-toggle')?.addEventListener('click',()=>{
   preference=preference==='off'?'on':'off';
   try{localStorage.setItem('casio-spell-motion',preference);}catch{}
   syncPreference();
  });
  mq?.addEventListener('change',syncPreference);
  doc.addEventListener('visibilitychange',()=>{html.dataset.suspended=String(doc.hidden);if(doc.hidden)cancel();else queueProgress();});
  doc.addEventListener('click',event=>{
   const button=event.target.closest('button');
   if(!button||button.disabled||reduced()||button.classList.contains('glyph-button'))return;
   if(!button.matches('.primary,.secondary,.examples button,.motion-toggle,.theme-toggle'))return;
   const rect=button.getBoundingClientRect(),ripple=doc.createElement('i');ripple.className='press-ripple';ripple.setAttribute('aria-hidden','true');
   ripple.style.left=(event.detail?event.clientX-rect.left:rect.width/2)+'px';ripple.style.top=(event.detail?event.clientY-rect.top:rect.height/2)+'px';button.append(ripple);
   play(ripple,[{transform:'scale(.2)',opacity:1},{transform:`scale(${Math.max(rect.width,rect.height)/12})`,opacity:0}],{duration:380},{scope:'ripple',decorative:true,dispose:()=>ripple.remove()});
  });
  doc.querySelectorAll('.section-nav a').forEach(link=>link.addEventListener('click',()=>{
   doc.querySelectorAll('.section-nav a').forEach(item=>item.classList.toggle('is-current',item===link));
   cancel('nav');play(link,[{opacity:.6,transform:'scale(.96)'},{opacity:1,transform:'scale(1)'}],{duration:260},{scope:'nav'});
  }));
  $('reference-panel')?.addEventListener('toggle',()=>{if($('reference-panel').open)reference();});
  $('guide-scroll')?.addEventListener('scroll',queueProgress,{passive:true});root.addEventListener('scroll',queueProgress,{passive:true});
  root.addEventListener('resize',()=>{tab(false);queueProgress();},{passive:true});
  if(root.ResizeObserver){resizeObserver=new ResizeObserver(queueProgress);resizeObserver.observe($('guide-scroll'));resizeObserver.observe($('guide'));}
  if(frozen!==null){for(const node of doc.querySelectorAll('.motion-backdrop span')){node.style.animationDelay=-(frozen/1000)+'s';node.style.animationPlayState='paused';}}
  root.__ready=true;
 }
 // Small deterministic harness: ?t=0 / ?t=.3 / ?t=1, plus ?reduce=1.
 root.SpellMotion={boot,tab,palette,capturePreview,preview,captureGlyph,fly,guide,generated,invalidate,reference,toast,toastExit,error,theme};
 root.__spellMotion={get activeCount(){return active.size;},get reduced(){return reduced();}};
 syncPreference();
})(globalThis);
