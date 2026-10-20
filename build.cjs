'use strict';
/* WEB CU ONLY. Replace its root build.cjs after the new site is deployed.
 * Existing vercel.json already runs `node build.cjs`.
 * Official schema: https://vercel.com/docs/build-output-api/configuration
 */
const fs=require('node:fs'),path=require('node:path');
const destination='https://meuz-casio.vercel.app';
const out=path.join(__dirname,'.vercel','output');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.join(out,'static'),{recursive:true});
fs.writeFileSync(path.join(out,'config.json'),JSON.stringify({version:3,routes:[
 {src:'/(.*)',missing:[{type:'host',value:'meuz-casio.vercel.app'}],status:307,headers:{Location:destination,'Cache-Control':'no-store'}},
 {handle:'filesystem'}
]},null,2));
fs.writeFileSync(path.join(out,'static','index.html'),'<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Spell Studio</title><p>File chuyển hướng này dành cho web cũ.</p><p><a href="'+destination+'">Mở Meuz Casio</a></p></html>');
console.log('Old site redirect ready: '+destination);
