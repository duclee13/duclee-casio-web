'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=__dirname,out=path.join(root,'public');
const files=['index.html','app.js','demo.js','engine.js','multiline.js','data.js','pdf-reference.js','palette-font.js','key-font.js','motion.js','motion.css','theme.js','theme.css','style.css','responsive.css','refinements.css','ClassWizXDisplay-Regular.otf','ClassWizXDisplay-Hex.otf','CASIO-ClassWiz.ttf','font-base.png','font-f0.png','font-f4.png','all.pdf','iart-web-animation-skills.txt'];
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,file));
for(const file of ['data.js','pdf-reference.js','engine.js'])fs.copyFileSync(path.join(root,file),path.join(root,'server',file));
console.log('Build complete: public assets + private multiline API.');
