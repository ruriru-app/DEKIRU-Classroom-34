(function(root){
 'use strict';
 const M=root.InterviewModel||(typeof require==='function'?require('./interview-model.js'):null),Share=root.InterviewShare||(typeof require==='function'?require('./interview-share.js'):null);
 function active(d,now){M.validateDelivery(d);M.date(now);M.check(!Share.isExpired(d,Date.parse(now)),'活動時間が終了しました');}
 function create(d,now){active(d,now);return {version:1,deliveryId:d.deliveryId,presetId:d.presetId,attemptId:M.newId('attempt'),phase:'compose',selectedCardId:null,completedQuestion:d.preset.question.slots.length?'':d.preset.question.template,assignments:Object.fromEntries(d.roster.students.map(s=>[s.id,null])),startedAt:null,updatedAt:now,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'};}
 function choose(d,s,card,now){active(d,now);M.check(s.phase==='compose','質問を変更するには戻ってください');M.check(d.preset.question.slots.length===1,'固定の質問です');return {...s,selectedCardId:card.id,completedQuestion:M.completeQuestion(d.preset,card),updatedAt:now};}
 function start(d,s,now){active(d,now);M.check(s.phase==='compose'&&s.completedQuestion&&(!d.preset.question.slots.length||d.preset.cardIds.includes(s.selectedCardId)),'カードを選んでください');return {...s,phase:'sheet',startedAt:now,updatedAt:now};}
 function move(d,s,studentId,areaId,now){active(d,now);M.check(s.phase==='sheet','Interviewを開始してください');M.check(Object.hasOwn(s.assignments,studentId),'名前を確認してください');M.check(areaId===null||d.preset.answerAreas.some(a=>a.id===areaId),'回答先を確認してください');return {...s,assignments:{...s.assignments,[studentId]:areaId},updatedAt:now};}
 function validate(d,s,cards){
  M.validateDelivery(d);M.check(s?.version===1&&s.deliveryId===d.deliveryId&&s.presetId===d.presetId&&['compose','sheet'].includes(s.phase),'保存した活動が一致しません');M.id(s.attemptId);M.date(s.updatedAt);M.text(s.timeZone,'時間帯',100);
  const card=cards.find(c=>c.id===s.selectedCardId);let question='';
  if(d.preset.question.slots.length){M.check(s.selectedCardId===null||card,'選択カードが不正です');if(card)question=M.completeQuestion(d.preset,card);}
  else {M.check(s.selectedCardId===null,'固定文のカードが不正です');question=d.preset.question.template;}
  M.check(s.completedQuestion===question,'質問文が一致しません');
  M.check(s.assignments&&typeof s.assignments==='object'&&!Array.isArray(s.assignments),'回答が不正です');
  const ids=d.roster.students.map(k=>k.id);M.check(Object.keys(s.assignments).length===ids.length&&ids.every(id=>Object.hasOwn(s.assignments,id)),'名簿が一致しません');
  M.check(Object.values(s.assignments).every(a=>a===null||d.preset.answerAreas.some(v=>v.id===a)),'回答先が不正です');
  if(s.phase==='sheet'){M.check(!!question,'質問が未完成です');M.date(s.startedAt);}else {M.check(s.startedAt===null&&Object.values(s.assignments).every(a=>a===null),'文章作りの状態が不正です');}
  return {version:1,deliveryId:s.deliveryId,presetId:s.presetId,attemptId:s.attemptId,phase:s.phase,selectedCardId:s.selectedCardId,completedQuestion:question,assignments:Object.fromEntries(ids.map(id=>[id,s.assignments[id]])),startedAt:s.startedAt,updatedAt:s.updatedAt,timeZone:s.timeZone};
 }
 function tokens(d,card){const parts=d.preset.question.template.split('(P)'),out=[];parts.forEach((part,i)=>{if(i)out.push({kind:'picture',text:card?card.english:'えらんでね',cardId:card?.id||null});for(const text of part.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu)||[])out.push({kind:/^[\p{L}\p{N}]/u.test(text)?'word':'punctuation',text});});return out;}
 function result(d,s,cards){const v=validate(d,s,cards),answerAreas=d.preset.answerAreas.map(a=>({...a,students:d.roster.students.filter(k=>v.assignments[k.id]===a.id)})),unassigned=d.roster.students.filter(k=>v.assignments[k.id]===null);return {preset:d.preset,title:d.preset.title,selectedCard:cards.find(c=>c.id===v.selectedCardId)||null,completedQuestion:v.completedQuestion,answerAreas,unassigned,interviewedCount:d.roster.students.length-unassigned.length,startedAt:v.startedAt,updatedAt:v.updatedAt,timeZone:v.timeZone};}
 const api={create,choose,start,move,reset:create,validate,tokens,result};root.InterviewSession=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
