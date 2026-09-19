(function(root){
  'use strict';
  const books={lt1:9,lt2:9,nh5:8,nh6:8};
  function check(ok,message){if(!ok)throw new Error(message);}
  function text(value,label,max,empty=false){check(typeof value==='string',label+'が不正です');const s=value.trim();check((empty||s.length>0)&&s.length<=max,label+'を'+max+'文字以内で入力してください');return s;}
  function id(value){const s=text(value,'ID',100);check(/^[A-Za-z0-9_-]+$/.test(s),'IDが不正です');return s;}
  function date(value){check(typeof value==='string'&&value.length<=40&&Number.isFinite(Date.parse(value)),'日時が不正です');return value;}
  function array(value,max,label,min=0){check(Array.isArray(value)&&value.length>=min&&value.length<=max,label+'の件数が不正です');return value;}
  function unique(values,label){check(new Set(values).size===values.length,label+'が重複しています');}
  function newId(prefix='interview'){return prefix+'-'+(root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));}
  function knownCards(){const data=root.DEKIRU_DATA||root.GAMES_DATA;return data?new Set(data.cards.map(c=>c.id)):undefined;}
  function validatePreset(v,validCardIds=knownCards()){
    check(v?.version===1&&v.type==='interview','未対応のInterviewプリセットです');
    const cardIds=array(v.cardIds,100,'カード').map(id);unique(cardIds,'カード');
    if(validCardIds)check(cardIds.every(c=>validCardIds.has(c)),'使用できないカードが含まれています');
    const assignedUnits=array(v.assignedUnits,34,'Unit').map(u=>{check(u&&Object.hasOwn(books,u.bookId)&&Number.isInteger(u.unit)&&u.unit>=1&&u.unit<=books[u.bookId],'Unitが不正です');return {bookId:u.bookId,unit:u.unit};});
    unique(assignedUnits.map(u=>u.bookId+':'+u.unit),'Unit');
    const template=text(v.question?.template,'質問文',200);
    const slots=array(v.question?.slots,1,'差し替え部分').map(s=>{
      check(s?.id==='P'&&s.type==='picture-card','未対応の差し替え部分です');
      const ids=array(s.cardIds,100,'差し替えカード',1).map(id);unique(ids,'差し替えカード');
      check(ids.length===cardIds.length&&ids.every(c=>cardIds.includes(c)),'差し替えカードが一致しません');
      return {id:'P',type:'picture-card',cardIds:ids};
    });
    const markers=template.match(/\([A-Z][A-Z0-9_]*\)/g)||[];
    check(slots.length?markers.length===1&&markers[0]==='(P)':markers.length===0,'質問文の差し替えは (P) を1か所だけ指定してください');
    const answerAreas=array(v.answerAreas,12,'回答エリア',1).map(a=>{check(Number.isInteger(a?.order)&&a.order>=0&&a.order<12,'回答の順序が不正です');return {id:id(a.id),label:text(a.label,'回答名',40),order:a.order,...(a.speechText!==undefined?{speechText:text(a.speechText,'読み上げ文',200,true)}:{})};});
    unique(answerAreas.map(a=>a.id),'回答ID');unique(answerAreas.map(a=>a.order),'回答の順序');answerAreas.sort((a,b)=>a.order-b.order);
    return {version:1,type:'interview',id:id(v.id),name:text(v.name,'プリセット名',80),title:text(v.title,'タイトル',80),description:text(v.description??'','説明',500,true),assignedUnits,question:{template,slots},cardIds,answerAreas,createdAt:date(v.createdAt),updatedAt:date(v.updatedAt)};
  }
  function completeQuestion(p,card){if(!p.question.slots.length)return p.question.template;check(card&&p.question.slots[0].cardIds.includes(card.id),'カードを選んでください');return p.question.template.replace('(P)',()=>text(card.english,'カードの英語',200));}
  const api={validatePreset,completeQuestion,newId,knownCards,check,text,id,date,array,unique};
  root.InterviewModel=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
