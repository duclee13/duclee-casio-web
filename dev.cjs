'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const api=require('./api/spell.js'),root=path.join(__dirname,'public');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.pdf':'application/pdf','.otf':'font/otf','.ttf':'font/ttf'};
http.createServer(async(req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 if(pathname==='/api/spell'){
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16384){res.writeHead(413);return res.end();}}
  req.body=body;try{await api(req,res);}catch{res.writeHead(500);res.end('{"error":"Máy chủ chưa sẵn sàng."}');}return;
 }
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(404);return res.end();}
 try{if(!fs.statSync(file).isFile())throw Error();res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}
 catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log('Spell Studio: http://localhost:'+(process.env.PORT||3000)));
