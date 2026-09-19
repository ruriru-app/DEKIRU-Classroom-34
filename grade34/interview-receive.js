(()=>{
 'use strict';
 const summary=document.getElementById('receiveSummary'),error=document.getElementById('receiveError');
 function render(){summary.replaceChildren();error.textContent='';try{
  const match=location.hash.match(/^#interview=([A-Za-z0-9_-]+)$/);if(!match)throw Error();
  const delivery=InterviewShare.decode(match[1]);
  for(const [label,value] of [['タイトル',delivery.preset.title],['質問文',delivery.preset.question.template],['Picture Cards',delivery.preset.cardIds.length+'枚'],['回答エリア',delivery.preset.answerAreas.map(a=>a.label).join(' / ')],['名簿',delivery.roster.students.length+'人']]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;summary.append(dt,dd);}
 }catch{error.textContent='配信内容を読み込めませんでした。先生にもう一度配信してもらってください。';}}
 document.getElementById('interviewReceiveBack').onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();else location.href='index.html#/';};
 window.addEventListener('hashchange',render);render();
})();
