'use strict';
globalThis.SpellDemoTransport={
 async request(body){
  let response;
  try{response=await fetch('/api/spell',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});}
  catch{throw Error('Không kết nối được máy chủ. Hãy thử lại.');}
  let data;try{data=await response.json();}catch{throw Error('Chế độ demo cần chạy trên Vercel hoặc máy chủ của ứng dụng.');}
  if(!response.ok){const error=Error(data.error||'Chưa thực hiện được yêu cầu.');error.status=response.status;throw error;}
  return data;
 },
 status(){return this.request();},
 unlock(password){return this.request({action:'unlock',password});},
 async generate(text,options){return (await this.request({action:'generate',text,options})).guide;}
};
