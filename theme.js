/* Resolve before CSS paints. Theme never changes spell data or print colors. */
(function(root){
 'use strict';
 const html=document.documentElement,key='casio-spell-theme';
 let theme='dark';
 try{theme=localStorage.getItem(key)==='light'?'light':'dark';}catch{}
 function apply(value){
  theme=value==='light'?'light':'dark';html.dataset.theme=theme;
  const button=document.getElementById('theme-toggle');
  if(button){button.setAttribute('aria-pressed',String(theme==='dark'));button.setAttribute('aria-label',theme==='dark'?'Bật giao diện sáng':'Bật giao diện tối');button.title=theme==='dark'?'Chuyển sang sáng':'Chuyển sang tối';}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#0c1211':'#f3f5ef');
 }
 apply(theme);
 function boot(){
  apply(theme);
  document.getElementById('theme-toggle')?.addEventListener('click',()=>{
   apply(theme==='dark'?'light':'dark');
   try{localStorage.setItem(key,theme);}catch{}
   root.SpellMotion?.theme();
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 root.addEventListener('storage',event=>{if(event.key===key)apply(event.newValue);});
})(globalThis);
