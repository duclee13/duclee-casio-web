'use strict';
const crypto=require('node:crypto'),config=require('./server-config.json');
const key=process.env.SPELL_SESSION_SECRET||config.sessionKey;
const hash=value=>crypto.scryptSync(value,config.salt,32);
const expected=process.env.SPELL_DEMO_PASSWORD?hash(process.env.SPELL_DEMO_PASSWORD):Buffer.from(config.passwordHash,'hex');
const signature=value=>crypto.createHmac('sha256',key).update(value).digest('hex');
const equal=(a,b)=>a.length===b.length&&crypto.timingSafeEqual(a,b);
exports.passwordValid=value=>typeof value==='string'&&value.length<=256&&equal(hash(value),expected);
exports.token=()=>{const value=String(Date.now()+8*60*60*1000)+'.'+crypto.randomBytes(16).toString('hex');return value+'.'+signature(value);};
exports.authorized=req=>{
 const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('spell_demo='))?.slice(11);
 if(!token||!/^\d{13}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token))return false;
 const [expiry,nonce,sig]=token.split('.');
 return Number(expiry)>Date.now()&&equal(Buffer.from(sig,'hex'),Buffer.from(signature(expiry+'.'+nonce),'hex'));
};
