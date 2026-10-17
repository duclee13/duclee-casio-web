'use strict';
globalThis.SpellDemoTransport={
 async request(body){
  if(globalThis.location?.protocol==='file:')throw Error('Bản mở trực tiếp từ file không có máy chủ. Mở web đã triển khai để dùng demo.');
  let response;
  try{response=await fetch('/api/spell',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});}
  catch{throw Error('Không kết nối được máy chủ. Hãy thử lại.');}
  if(response.status===404)throw Error('API demo chưa được triển khai. Cần cập nhật đầy đủ bản ZIP lên Vercel.');
  if(response.status>=500)throw Error('Máy chủ demo gặp lỗi. Hãy kiểm tra bản triển khai trên Vercel.');
  let data;try{data=await response.json();}catch{throw Error('Chế độ demo cần chạy trên Vercel hoặc máy chủ của ứng dụng.');}
  if(!response.ok){const error=Error(data.error||'Chưa thực hiện được yêu cầu.');error.status=response.status;throw error;}
  return data;
 },
 status(){return this.request();},
 unlock(password){return this.request({action:'unlock',password});},
 async generate(text,options){return (await this.request({action:'generate',text,options})).guide;}
};
