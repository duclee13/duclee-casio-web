'use strict';
const auth=require('./server-auth.cjs');
module.exports=async function handler(req,res){
 const requirePassword=process.env.SPELL_DEMO_REQUIRE_PASSWORD==='true';
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('X-Content-Type-Options','nosniff');
 const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body));};
 if(req.method==='GET')return send(200,{unlocked:!requirePassword||auth.authorized(req),version:'20261018-ui-v7'});
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return send(405,{error:'Phương thức không được hỗ trợ.'});}
 if(req.headers.origin){
  try{if(new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Yêu cầu không hợp lệ.'});}
  catch{return send(403,{error:'Yêu cầu không hợp lệ.'});}
 }
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(415,{error:'Yêu cầu cần dùng JSON.'});
 let body;
 try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}
 catch{return send(400,{error:'Yêu cầu không hợp lệ.'});}
 if(!body||typeof body!=='object'||Array.isArray(body))return send(400,{error:'Yêu cầu không hợp lệ.'});
 if(body.action==='unlock'){
  if(!requirePassword)return send(200,{unlocked:true});
  if(!auth.passwordValid(body.password))return send(401,{error:'Mật khẩu chưa đúng.'});
  const local=!process.env.VERCEL&&/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host||'');
  res.setHeader('Set-Cookie','spell_demo='+auth.token()+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800'+(local?'':'; Secure'));
  return send(200,{unlocked:true});
 }
 if(requirePassword&&!auth.authorized(req))return send(401,{error:'Nhập mật khẩu để dùng bản demo nhiều dòng.'});
 if(body.action!=='generate')return send(400,{error:'Yêu cầu không hợp lệ.'});
 if(typeof body.text!=='string'||body.text.length>2048||!body.options||![2,3,4].includes(body.options.lines))return send(400,{error:'Nội dung hoặc số dòng không hợp lệ.'});
 const options={lines:body.options.lines,center:body.options.center!==false,compressSpaces:body.options.compressSpaces!==false};
 try{return send(200,{guide:require('./server-runtime.cjs').generate({text:body.text,options})});}
 catch(e){return send(422,{error:e.code==='ERR_SCRIPT_EXECUTION_TIMEOUT'?'Nội dung quá phức tạp. Hãy rút ngắn rồi thử lại.':e.message});}
};
