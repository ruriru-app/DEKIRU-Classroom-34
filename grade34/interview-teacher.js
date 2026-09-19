(()=>{
 'use strict';
 const M=window.InterviewModel,$=id=>document.getElementById(id),params=new URLSearchParams(location.search);
 let preset,roster=null,students=[],dirty=false,pastePending=false;const store=()=>InterviewStore.create(localStorage);
 function status(s){$('rosterStatus').textContent=s;}
 function read(){const now=new Date().toISOString();return M.validateRoster({version:1,id:roster?.id||M.newId('class'),className:$('rosterClass').value,students,createdAt:roster?.createdAt||now,updatedAt:now});}
 function update(){let valid=false;try{read();valid=!pastePending;}catch{}$('interviewSend').disabled=!(valid&&$('rosterConsent').checked);$('rosterDelete').disabled=!roster;$('rosterDirty').textContent=dirty?'未保存の変更があります。配信には画面上の内容を使用します。':'';}
 function changed(){dirty=true;$('rosterConsent').checked=false;update();}
 function list(selected=''){const rows=store().listRosters();$('rosterSelect').replaceChildren(new Option('新しい名簿',''));rows.forEach(r=>$('rosterSelect').add(new Option(r.className,r.id)));$('rosterSelect').value=selected;}
 function renderRows(){const box=$('rosterRows');box.replaceChildren();students.forEach((s,i)=>{const row=document.createElement('div');row.className='interview-roster-row';for(const [key,label,max] of [['number','番号',12],['name','名前',80]]){const wrapper=document.createElement('label');wrapper.textContent=label+' '+(i+1);const input=document.createElement('input');input.value=s[key]||'';input.maxLength=max;input.oninput=()=>{s[key]=input.value;changed();};wrapper.append(input);row.append(wrapper);}box.append(row);});$('rosterCount').textContent=students.length+'人';update();}
 function load(value){roster=value;students=value?value.students.map(s=>({...s})):[];$('rosterClass').value=value?.className||'';$('rosterPaste').value='';pastePending=false;dirty=false;$('rosterConsent').checked=false;renderRows();status('');}
 function discard(){return !dirty||confirm('未保存の名簿の変更を破棄しますか？');}
 $('interviewBack').onclick=async()=>{if(document.fullscreenElement){await document.exitFullscreen();return;}if(!discard())return;const book=params.get('book'),unit=Number(params.get('unit'));if(/^(nh5|nh6)$/.test(book)&&unit>=1&&unit<=8)location.href='../grade56/index.html#/unit/'+book+'/'+unit;else if(/^(lt1|lt2)$/.test(book)&&unit>=1&&unit<=9)location.href='index.html#/unit/'+book+'/'+unit;else location.href='index.html#/';};
 try{
  preset=InterviewLinks.get(params.get('preset'),params.get('source'));$('presetTitle').textContent=preset.title;$('presetName').textContent=preset.name;$('presetDescription').textContent=preset.description;$('presetQuestion').textContent=preset.question.template;
  const cards=new Map(window.DEKIRU_DATA.cards.map(c=>[c.id,c]));preset.cardIds.forEach(id=>{const card=cards.get(id),tile=document.createElement('div');tile.className='interview-picture';const img=document.createElement('img');img.alt='';img.src=card.pictureUrl||('../'+card.image);const label=document.createElement('span');label.textContent=card.english;tile.append(img,label);$('presetCards').append(tile);});
  preset.answerAreas.forEach(a=>{const e=document.createElement('span');e.textContent=a.label;$('presetAreas').append(e);});
  $('interviewTeacher').hidden=false;list();
 }catch(e){$('interviewError').textContent=e.message;return;}
 $('rosterClass').oninput=changed;$('rosterConsent').onchange=update;
 $('rosterPaste').oninput=()=>{pastePending=true;changed();};
 $('rosterConfirm').onclick=()=>{try{const parsed=M.parseRoster($('rosterPaste').value,students);students=parsed.students;pastePending=false;changed();renderRows();status(parsed.warnings.join('\n')||'名簿を確認してください。行ごとに修正できます。');}catch(e){status(e.message);}};
 $('rosterSelect').onchange=()=>{try{const selected=$('rosterSelect').value;if(!discard()){$('rosterSelect').value=roster?.id||'';return;}load(selected?store().listRosters().find(r=>r.id===selected):null);}catch(e){status(e.message);}};
 $('rosterNew').onclick=()=>{if(!discard())return;load(null);$('rosterSelect').value='';};
 $('rosterSave').onclick=()=>{try{M.check(!pastePending,'貼り付けた名簿を先に確認してください');const saved=store().saveRoster(read());roster=saved;dirty=false;list(saved.id);update();status('名簿をこのブラウザに保存しました。');}catch(e){status(e.message);}};
 $('rosterDelete').onclick=()=>{if(!roster||!confirm('保存した名簿を削除しますか？'))return;try{store().deleteRoster(roster.id);load(null);list();status('保存した名簿を削除しました。');}catch(e){status(e.message);}};
 $('interviewSend').onclick=()=>{try{M.check($('rosterConsent').checked&&!pastePending,'名簿と共有の注意を確認してください');const current=read(),delivery=InterviewShare.snapshot(preset,current),url=InterviewShare.buildUrl(delivery,new URL('interview-receive.html',location.href));CardShare.openUrl(url,preset.title,current.students.length+'人の名簿を含む配信URLです。クラス内だけで共有してください。');}catch(e){status(e.message);}};
 update();
})();
