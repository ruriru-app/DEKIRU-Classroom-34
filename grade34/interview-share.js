(function(root){
 'use strict';
 const M=root.InterviewModel||(typeof require==='function'?require('./interview-model.js'):null),C=root.ShareCodec||(typeof require==='function'?require('./share-codec.js'):null);
 function snapshot(preset,roster,hours=1){
  M.check([1,4,12,24].includes(hours),'有効期間を選んでください');
  const now=Date.now();return M.validateDelivery({version:2,type:'interview-delivery',deliveryId:M.newId('delivery'),issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+hours*3600000).toISOString(),presetId:preset.id,preset,roster});
 }
 function isExpired(value,now=Date.now()){const d=M.validateDelivery(value);return d.version===2&&now>=Date.parse(d.expiresAt);}
 function encode(value){return C.encodeJson(M.validateDelivery(value));}
 function decode(token){return M.validateDelivery(C.decodeJson(token));}
 function buildUrl(delivery,baseUrl){const url=new URL(baseUrl);url.hash='interview='+encode(delivery);return url.href;}
 const api={snapshot,encode,decode,buildUrl,isExpired};root.InterviewShare=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
