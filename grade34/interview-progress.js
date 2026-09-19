(function(root){
 'use strict';const M=root.InterviewModel||(typeof require==='function'?require('./interview-model.js'):null),S=root.InterviewSession||(typeof require==='function'?require('./interview-session.js'):null);
 function create(storage){const key=d=>'dekiru-interview-progress-v1:'+M.id(d.deliveryId),signature=d=>JSON.stringify(M.validateDelivery(d));return {
  read(d,cards){try{const raw=storage.getItem(key(d));if(raw===null)return {status:'empty'};const saved=JSON.parse(raw);if(saved.delivery!==signature(d))return {status:'corrupt'};return {status:'saved',state:S.validate(d,saved.state,cards)};}catch{return {status:'corrupt'};}},
  save(d,state){try{storage.setItem(key(d),JSON.stringify({delivery:signature(d),state}));return {ok:true};}catch{return {ok:false,error:'この端末に保存できません。画面を閉じないでください'};}},
  remove(d){try{storage.removeItem(key(d));return {ok:true};}catch{return {ok:false,error:'保存データを削除できませんでした'};}}
 };}
 root.InterviewProgress={create};if(typeof module==='object')module.exports={create};
})(typeof window==='object'?window:globalThis);
