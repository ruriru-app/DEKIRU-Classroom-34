(function(root){
 'use strict';
 const M=root.InterviewModel||(typeof require==='function'?require('./interview-model.js'):null),C=root.ShareCodec||(typeof require==='function'?require('./share-codec.js'):null);
 function snapshot(preset,roster){return M.validateDelivery({version:1,type:'interview-delivery',deliveryId:M.newId('delivery'),issuedAt:new Date().toISOString(),presetId:preset.id,preset,roster});}
 function encode(value){return C.encodeJson(M.validateDelivery(value));}
 function decode(token){return M.validateDelivery(C.decodeJson(token));}
 function buildUrl(delivery,baseUrl){const url=new URL(baseUrl);url.hash='interview='+encode(delivery);return url.href;}
 const api={snapshot,encode,decode,buildUrl};root.InterviewShare=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
