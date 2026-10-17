'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sources=['data.js','pdf-reference.js','engine.js','server-multiline.js'].map(file=>new vm.Script(fs.readFileSync(path.join(__dirname,file),'utf8'),{filename:file}));
const generateScript=new vm.Script('Spell.limitGuideSteps(SpellMulti.generate(payload.text,payload.options),15)');
exports.generate=payload=>{
 const context=vm.createContext({payload});
 for(const script of sources)script.runInContext(context,{timeout:1000});
 const result=generateScript.runInContext(context,{timeout:4000});
 const part=p=>({segments:p.segments,checkpoint:p.checkpoint});
 return {summary:result.summary,assignments:result.assignments,keyCount:result.keyCount,optimization:result.optimization,
  steps:result.steps.map(s=>({title:s.title,segments:s.segments,...(s.parts?{parts:s.parts.map(part)}:part(s))}))};
};
