'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes=new Map();
function node(id){
 if(!nodes.has(id))nodes.set(id,{hidden:true,disabled:false,value:'',checked:false,textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},removeAttribute(k){delete this.attrs[k];},querySelector(){return node('button-label');}});
 return nodes.get(id);
}
const pending=[];
const ctx=vm.createContext({document:{getElementById:node},setTimeout,clearTimeout,Spell:{limitGuideSteps:g=>g,generate:()=>({sync:true})},SpellDemoTransport:{generate:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}});
const source=fs.readFileSync(__dirname+'/app.js','utf8');
vm.runInContext(source.slice(0,source.indexOf("$('demo-form').addEventListener")),ctx);
vm.runInContext("effectiveText='à'; renderGuide=()=>{};",ctx);
node('line-mode').value='2';node('editor').value='à';node('editor').setAttribute('aria-invalid','false');
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
async function main(){
 const first=vm.runInContext('generate()',ctx);
 assert.equal(node('generation-loading').hidden,false);assert.equal(node('generate').disabled,true);assert.equal(node('generate').getAttribute('aria-busy'),'true');
 await tick();assert.equal(pending.length,1);pending.shift().resolve({ok:true});await first;
 assert.equal(node('generation-loading').hidden,true);assert.equal(node('generate').disabled,false);assert.equal(node('generate').getAttribute('aria-busy'),undefined);
 // An earlier response must not hide the loading indicator for a newer edit.
 const stale=vm.runInContext('generate()',ctx);await tick();vm.runInContext('invalidate()',ctx);
 assert.equal(node('generation-loading').hidden,true);
 const fresh=vm.runInContext('generate()',ctx);await tick();pending.shift().resolve({stale:true});await stale;
 assert.equal(node('generation-loading').hidden,false);pending.shift().resolve({fresh:true});await fresh;
 assert.equal(vm.runInContext('currentGuide.fresh',ctx),true);
 const failed=vm.runInContext('generate()',ctx);await tick();pending.shift().reject(Error('Test failure'));await failed;
 assert.equal(node('generation-loading').hidden,true);assert.equal(node('generate').disabled,false);assert.equal(node('error').textContent,'Test failure');
 node('line-mode').value='1';await vm.runInContext('generate()',ctx);assert.equal(node('generation-loading').hidden,true);
 console.log('PASS: loading during work, success/error cleanup, stale response isolation and one-line fallback.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
