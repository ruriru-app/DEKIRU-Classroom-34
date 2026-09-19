(function(root){
 'use strict';
 function bytesToBase64Url(bytes){let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
 function base64UrlToBytes(value){if(typeof value!=='string'||!/^[A-Za-z0-9_-]*$/.test(value)||value.length%4===1)throw Error('配信URLの形式が不正です');const base=value.replaceAll('-','+').replaceAll('_','/');const bytes=Uint8Array.from(atob(base+'='.repeat((4-base.length%4)%4)),c=>c.charCodeAt(0));if(bytesToBase64Url(bytes)!==value)throw Error('配信URLの形式が不正です');return bytes;}
 function encodeJson(value){const bytes=new TextEncoder().encode(JSON.stringify(value));if(bytes.length>160000)throw Error('配信データが大きすぎます');return bytesToBase64Url(bytes);}
 function decodeJson(token){if(typeof token!=='string'||token.length>220000)throw Error('配信データが大きすぎます');const bytes=base64UrlToBytes(token);if(bytes.length>160000)throw Error('配信データが大きすぎます');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 const api={bytesToBase64Url,base64UrlToBytes,encodeJson,decodeJson};root.ShareCodec=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
