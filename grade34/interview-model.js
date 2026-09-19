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
  function validateRoster(v){
    check(v?.version===1,'未対応の名簿です');
    const students=array(v.students,100,'名簿',1).map(s=>({id:id(s.id),name:text(s.name,'名前',161),...(s.number!==undefined&&s.number!==''?{number:text(String(s.number),'番号',12)}:{})}));
    unique(students.map(s=>s.id),'児童ID');
    return {version:1,id:id(v.id),className:text(v.className,'クラス名',80),students,createdAt:date(v.createdAt),updatedAt:date(v.updatedAt)};
  }
  function parseRoster(input,previousStudents=[]){
    check(typeof input==='string'&&input.length<=20000,'名簿の入力が長すぎます');
    const rows=input.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);array(rows,100,'名簿',1);
    const warnings=[],key=s=>JSON.stringify([s.number||'',s.name]);
    const students=rows.map(row=>{const m=row.match(/^(\d{1,12})[\t　]+(.+)$/);return {id:newId('student'),name:text(m?m[2]:row,'名前',80),...(m?{number:m[1]}:{})};});
    for(const s of students){const prior=previousStudents.filter(p=>key(p)===key(s));const count=students.filter(p=>key(p)===key(s)).length;if(prior.length===1&&count===1)s.id=prior[0].id;else if(prior.length)warnings.push('同名・同番号の行は区別のため新しいIDにしました。');}
    warnings.push(...rosterWarnings(students));
    return {students,warnings:[...new Set(warnings)]};
  }
  function rosterWarnings(students){const nums=students.map(s=>String(s.number??'').trim()).filter(Boolean);return new Set(nums).size!==nums.length?['番号が重複しています。名簿をご確認ください。']:[];}
  function validateDelivery(v,validCardIds=knownCards()){
    check(v?.version===1&&v.type==='interview-delivery','未対応の配信データです');
    const preset=validatePreset(v.preset,validCardIds);check(v.presetId===preset.id,'プリセットIDが一致しません');
    return {version:1,type:'interview-delivery',deliveryId:id(v.deliveryId),issuedAt:date(v.issuedAt),presetId:preset.id,preset,roster:validateRoster(v.roster)};
  }
  const api={validatePreset,completeQuestion,validateRoster,parseRoster,rosterWarnings,validateDelivery,newId,knownCards,check,text,id,date,array,unique};
  root.InterviewModel=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
