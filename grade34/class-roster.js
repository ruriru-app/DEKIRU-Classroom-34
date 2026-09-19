(function(root){
 'use strict';
 const M=root.InterviewModel||(typeof require==='function'?require('./interview-model.js'):null);
 const scripts=['kanji','hiragana','english'];
 const headers=['出席番号','苗字（漢字）','名前（漢字）','苗字（ひらがな）','名前（ひらがな）','苗字（英語）','名前（英語）'];
 const emptyNames=()=>Object.fromEntries(scripts.map(s=>[s,{family:'',given:''}]));
 function number(value,label='出席番号'){
  const n=String(value??'').trim();M.check(/^\d{1,12}$/.test(n)&&Number(n)>0,label+'は正の整数で入力してください');return String(Number(n));
 }
 function numbers(students){const seen=new Set();return students.map((s,i)=>{const n=number(s.number,(i+1)+'行目の出席番号');M.check(!seen.has(n),'出席番号 '+n+' が重複しています');seen.add(n);return n;});}
 function cleanNames(names){return Object.fromEntries(scripts.map(s=>[s,{family:M.text(names?.[s]?.family??'','苗字',80,true),given:M.text(names?.[s]?.given??'','名前',80,true)}]));}
 function validate(v){
  M.check(v?.version===2,'未対応のクラス名簿です');const rows=M.array(v.students,100,'名簿',1),nums=numbers(rows);
  const students=rows.map((s,i)=>{const names=cleanNames(s.names);M.check(scripts.some(k=>names[k].family||names[k].given),(i+1)+'行目に名前を入力してください');return {id:M.id(s.id),number:nums[i],names,...(s.legacyName?{legacyName:M.text(s.legacyName,'旧氏名',80)}:{})};});
  M.unique(students.map(s=>s.id),'児童ID');
  return {version:2,id:M.id(v.id),className:M.text(v.className,'クラス名',80),students,createdAt:M.date(v.createdAt),updatedAt:M.date(v.updatedAt)};
 }
 function editLegacy(v){const old=M.validateRoster(v);return {...old,version:2,students:old.students.map(s=>({id:s.id,number:s.number||'',names:emptyNames(),legacyName:s.name}))};}
 function parse(input,previous=[]){
  M.check(typeof input==='string'&&input.length<=150000,'名簿の入力が長すぎます');
  const rows=input.split(/\r?\n/).map((line,i)=>({line,i:i+1})).filter(r=>r.line.trim());
  if(rows[0]?.line.split('\t').map(c=>c.trim()).join('\t')===headers.join('\t'))rows.shift();
  M.check(rows.length>=1&&rows.length<=100,'名簿は1〜100人で入力してください');const warnings=[];
  const students=rows.map(({line,i})=>{const c=line.split('\t');M.check(c.length===7,i+'行目：7列で貼り付けてください');const names=emptyNames();scripts.forEach((s,k)=>{names[s]={family:c[1+k*2].trim(),given:c[2+k*2].trim()};});return {id:M.newId('student'),number:number(c[0],i+'行目の出席番号'),names:cleanNames(names)};});
  numbers(students);
  for(const s of students){
   const prior=previous.filter(p=>{try{return number(p.number)===s.number;}catch{return false;}});
   if(prior.length===1)s.id=prior[0].id;
   else if(prior.length>1)warnings.push('以前の名簿で番号が重複していたため、新しい児童IDを付けました。');
   else {const matches=previous.filter(p=>!p.number&&p.names&&JSON.stringify(cleanNames(p.names))===JSON.stringify(s.names));const same=students.filter(p=>JSON.stringify(p.names)===JSON.stringify(s.names));if(matches.length===1&&same.length===1)s.id=matches[0].id;else if(matches.length)warnings.push('同名の行は区別のため新しい児童IDを付けました。');}
  }
  return {students,warnings:[...new Set(warnings)]};
 }
 function toDeliveryRoster(value,{script,scope}){
  M.check(['full','given'].includes(scope),'表示範囲を選んでください');
  const v=value?.version===1?M.validateRoster(value):validate(value);const nums=numbers(v.students);
  M.check(v.version===1?script==='legacy':scripts.includes(script),'名前の表記を選んでください');
  const missing=[];
  const students=v.students.map((s,i)=>{let name=s.name;if(v.version===2){const p=s.names[script];if(!p.given||(scope==='full'&&!p.family))missing.push(nums[i]);name=scope==='given'?p.given:p.family+' '+p.given;}return {id:s.id,number:nums[i],name};});
  M.check(!missing.length,'出席番号 '+missing.join('、')+'：選んだ表記の苗字・名前を設定で入力してください');
  return M.validateRoster({version:1,id:v.id,className:v.className,students,createdAt:v.createdAt,updatedAt:v.updatedAt});
 }
 const api={headers,validate,parse,editLegacy,toDeliveryRoster};root.ClassRoster=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
