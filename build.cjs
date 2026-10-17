'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=__dirname,out=path.join(root,'.vercel','output');
const files=['index.html','app.js','demo.js','layout.js','engine.js','multiline.js','data.js','pdf-reference.js','palette-font.js','key-font.js','motion.js','motion.css','theme.js','theme.css','style.css','responsive.css','refinements.css','ClassWizXDisplay-Regular.otf','ClassWizXDisplay-Hex.otf','CASIO-ClassWiz.ttf','font-base.png','font-f0.png','font-f4.png','loading.gif','all.pdf','iart-web-animation-skills.txt'];
const privateFiles=['api-spell.js','server-auth.cjs','server-config.json','server-runtime.cjs','server-multiline.js','data.js','pdf-reference.js','engine.js'];
for(const file of new Set([...files,...privateFiles]))if(!fs.existsSync(path.join(root,file)))throw Error('Missing upload: '+file);
fs.rmSync(out,{recursive:true,force:true});
const staticDir=path.join(out,'static'),funcDir=path.join(out,'functions','api','spell.func');
fs.mkdirSync(staticDir,{recursive:true});fs.mkdirSync(funcDir,{recursive:true});
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(staticDir,file));
for(const file of privateFiles)fs.copyFileSync(path.join(root,file),path.join(funcDir,file));
fs.writeFileSync(path.join(funcDir,'.vc-config.json'),JSON.stringify({runtime:'nodejs22.x',handler:'api-spell.js',launcherType:'Nodejs',shouldAddHelpers:true,maxDuration:10},null,2));
fs.writeFileSync(path.join(out,'config.json'),JSON.stringify({version:3,routes:[{src:'/',dest:'/index.html'},{handle:'filesystem'}]},null,2));
fs.writeFileSync(path.join(staticDir,'version.json'),JSON.stringify({version:'20261017-base-v4'}));
// public is only for the local Node server; Vercel uses the Build Output API above.
const local=path.join(root,'public');fs.rmSync(local,{recursive:true,force:true});fs.cpSync(staticDir,local,{recursive:true});
console.log('Build complete: 20261017-base-v4; static assets and /api/spell ready.');
