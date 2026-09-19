/* Author-only editing within the existing Create Games screen. Local save is not publishing. */
(()=>{
 'use strict';
 const M=window.InterviewModel,store=()=>InterviewStore.create(localStorage),esc=escapeHtml;
 const root=document.getElementById('createInterview');let editing=null;
 const field=(name,id,max,value='')=>`<label class="interview-field">${name}<input id="${id}" maxlength="${max}" value="${esc(value)}"></label>`;
 function status(message){root.querySelector('[role=status]').textContent=message;}
 function units(){const rows=[...document.querySelectorAll('[name=creatorAssignedUnit]')].map(e=>({value:e.value,label:e.parentElement.textContent}));
 const senior={nh5:['Hello, friends!','Happy birthday!','Can you play dodgeball?','Who is this?','Let’s go to the zoo.','At a restaurant.','Welcome to Japan!','Who is your hero?'],nh6:['This is me!','My Daily Schedule','My Weekend','Let’s see the world.','Where is it from?','Save the animals.','My Best Memory','My Future, My Dream']};
 Object.entries(senior).forEach(([b,titles])=>titles.forEach((title,i)=>rows.push({value:b+':'+(i+1),label:'NEW HORIZON '+b.slice(-1)+' Unit '+(i+1)+' — '+title})));return rows;
 }
 function answers(values){const box=root.querySelector('#interviewAnswers');box.replaceChildren();values.forEach((a,i)=>{
  const row=document.createElement('div');row.className='interview-row';row.dataset.answerId=a.id;
  row.innerHTML=`<label>回答名 ${i+1}<input maxlength="40" value="${esc(a.label)}"></label><button type="button" aria-label="回答 ${i+1}を上へ">↑</button><button type="button" aria-label="回答 ${i+1}を削除">削除</button>`;
  row.querySelectorAll('button')[0].onclick=()=>{const all=readAnswers();if(i>0){[all[i-1],all[i]]=[all[i],all[i-1]];answers(all);}};
  row.querySelectorAll('button')[1].onclick=()=>answers(readAnswers().filter(x=>x.id!==a.id));box.append(row);
 });}
 function readAnswers(){return [...root.querySelectorAll('#interviewAnswers .interview-row')].map((e,i)=>({id:e.dataset.answerId,label:e.querySelector('input').value,order:i}));}
 function open(id){try{editing=id?store().listPresets().find(p=>p.id===id):null;if(id&&!editing)throw Error('プリセットが見つかりません');
  root.innerHTML='<div class="head"><button type="button" aria-label="戻る" id="interviewAuthorBack">戻る</button><h1>Interviewを作る</h1></div><p>このブラウザに保存</p><p>本ページへの公開は別途依頼してください。端末間では自動同期されません。</p><div class="interview-form">'+
   '<button type="button" id="interviewColors">Colorsサンプルを作成</button>'+field('プリセット名','interviewName',80,editing?.name)+field('タイトル','interviewTitle',80,editing?.title||'INTERVIEW')+field('説明','interviewDescription',500,editing?.description)+field('質問文','interviewQuestion',200,editing?.question.template||'Do you like (P)?')+
   '<small>同じ (P) はすべて同じカードになります。別々に選ぶ場合は (P1)、(P2) を使います（最大9枠）。固定文も使えます。</small><section><h2>Picture Cards</h2><p id="interviewCardCount"></p><div id="interviewCards"></div></section><section><h2>回答エリア</h2><div id="interviewAnswers"></div><button type="button" id="interviewAddAnswer">回答エリアを追加</button></section><section><h2>割り当てるUnit（Activitiesに表示）</h2><div class="interview-units">'+units().map(u=>`<label><input type="checkbox" name="interviewUnit" value="${u.value}">${esc(u.label)}</label>`).join('')+'</div></section><div class="interview-actions"><button type="button" id="interviewSave">プリセットを保存</button></div><p role="status" aria-live="polite"></p></div>';
  const selected=new Set(editing?.cardIds||[]),groups=new Map();rouletteAvailableCards().forEach(c=>{if(!groups.has(c.category))groups.set(c.category,[]);groups.get(c.category).push(c);});
  root.querySelector('#interviewCards').innerHTML=[...groups].map(([category,cards])=>`<details><summary>${esc(categoryLabel(category))}</summary><div class="interview-options">${cards.map(c=>`<label><input type="checkbox" value="${esc(c.id)}" ${selected.has(c.id)?'checked':''}>${esc(c.english)}</label>`).join('')}</div></details>`).join('');
  function count(){root.querySelector('#interviewCardCount').textContent=root.querySelectorAll('#interviewCards input:checked').length+'枚を選択中';}count();root.querySelector('#interviewCards').onchange=count;
  root.querySelectorAll('[name=interviewUnit]').forEach(e=>{e.checked=!!editing?.assignedUnits.some(u=>e.value===u.bookId+':'+u.unit);});
  answers(editing?.answerAreas||[{id:M.newId('answer'),label:'YES',order:0},{id:M.newId('answer'),label:'NO',order:1}]);
  root.querySelector('#interviewAuthorBack').onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();else{renderLibrary();show('createActivities');}};
  root.querySelector('#interviewAddAnswer').onclick=()=>{const a=readAnswers();if(a.length>=12)return status('回答エリアは12個までです');answers([...a,{id:M.newId('answer'),label:'',order:a.length}]);};
  root.querySelector('#interviewColors').onclick=()=>{try{
   const words=['red','blue','green','yellow','pink','orange','purple','black','white'];const ids=words.map(w=>{const matches=rouletteAvailableCards().filter(c=>c.category==='colors'&&c.english===w);if(matches.length!==1)throw Error('カードを確認してください: '+w);return matches[0].id;});
   editing=null;root.querySelector('#interviewName').value='Colors';root.querySelector('#interviewTitle').value='INTERVIEW';root.querySelector('#interviewDescription').value='色について友達に質問しよう';root.querySelector('#interviewQuestion').value='Do you like (P)?';
   root.querySelectorAll('#interviewCards input').forEach(e=>e.checked=ids.includes(e.value));root.querySelectorAll('[name=interviewUnit]').forEach(e=>e.checked=e.value==='lt1:4');
   answers([{id:M.newId('answer'),label:'YES',order:0},{id:M.newId('answer'),label:'NO',order:1}]);count();status('9色・Let’s Try 1 Unit 4を設定しました。確認して保存してください。');
  }catch(e){status(e.message);}};
  root.querySelector('#interviewSave').onclick=()=>{try{
   const now=new Date().toISOString(),cardIds=[...root.querySelectorAll('#interviewCards input:checked')].map(e=>e.value),template=root.querySelector('#interviewQuestion').value;
   const value={version:2,type:'interview',id:editing?.id||M.newId(),name:root.querySelector('#interviewName').value,title:root.querySelector('#interviewTitle').value,description:root.querySelector('#interviewDescription').value,assignedUnits:[...root.querySelectorAll('[name=interviewUnit]:checked')].map(e=>{const [bookId,n]=e.value.split(':');return {bookId,unit:Number(n)};}),question:{template,slots:M.slotIds(template).map(id=>({id,type:'picture-card',cardIds}))},cardIds,answerAreas:readAnswers(),createdAt:editing?.createdAt||now,updatedAt:now};
   store().savePreset(M.validatePreset(value,new Set(rouletteAvailableCards().map(c=>c.id))));renderLibrary();show('createActivities');
  }catch(e){status(e.message);}};
  show('createInterview');
 }catch(e){document.getElementById('interviewLibrary').textContent=e.message;show('createActivities');}}
 function renderLibrary(){const library=document.getElementById('interviewLibrary');library.replaceChildren();try{const all=store().listPresets();if(!all.length){library.textContent='保存したInterviewはありません。';return;}
  all.forEach(p=>{const article=document.createElement('article');article.className='created-game-card';article.innerHTML=`<strong>${esc(p.name)}</strong><span>${esc(p.title)}</span><small>このブラウザ内のみ・${p.cardIds.length}枚／${p.answerAreas.length}分類</small><div class="created-game-card-actions"><button type="button">${esc(p.name)}を編集</button><a href="../grade34/interview.html?preset=${encodeURIComponent(p.id)}&source=local">教師画面で試す</a><button type="button">${esc(p.name)}のJSONを取得</button><button type="button">${esc(p.name)}を削除</button></div>`;
   const b=article.querySelectorAll('button');b[0].onclick=()=>open(p.id);b[1].onclick=()=>{const clean=M.validatePreset(p),url=URL.createObjectURL(new Blob([JSON.stringify(clean,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=p.id+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};b[2].onclick=()=>{if(!confirm('このプリセットを削除しますか？'))return;try{store().deletePreset(p.id);renderLibrary();}catch(e){const error=document.createElement('p');error.setAttribute('role','status');error.textContent=e.message;article.append(error);}};library.append(article);
  });
 }catch(e){library.textContent=e.message;}}
 document.getElementById('openInterviewCreator').onclick=()=>open();
 window.InterviewCreator={open,renderLibrary};renderLibrary();
})();
