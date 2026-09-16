(() => {
  'use strict';
  function open(saved,groups,onSave){
    const restored=CardSet.resolve(saved.payload);
    const selected=new Set(restored.items.map(i=>i.ref));
    const catalog=new Map([...groups.flatMap(g=>g.items),...restored.items].map(i=>[i.ref,i]));
    const display={...restored.display};
    const modal=document.createElement('dialog');modal.className='card-share-dialog card-set-editor';
    modal.innerHTML='<form method="dialog"><button class="secondary-button">閉じる ×</button></form><h2>セットの確認・編集</h2><label>セット名<input class="editor-name" maxlength="60" aria-label="セット名"></label><fieldset class="editor-display"><legend>表示設定</legend></fieldset><h3 class="editor-count"></h3><div class="editor-selected"></div><details class="editor-add"><summary>単語を追加・選択する</summary><div class="editor-groups"></div></details><p>変更後の内容を配るときは、保存後にタイルから改めて配信してください。配信済みURLは変わりません。</p><div class="share-actions"><button class="primary-button" data-save-mode="overwrite">上書き保存</button><button class="secondary-button" data-save-mode="copy">別名で保存</button></div><p role="status" class="share-status"></p>';
    modal.querySelector('.editor-name').value=saved.name;
    for(const [key,title] of Object.entries({image:'絵',english:'英語',japanese:'日本語'})){
      const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=display[key];
      input.onchange=()=>{display[key]=input.checked;};label.append(input,document.createTextNode(title));modal.querySelector('fieldset').append(label);
    }
    function card(item,removable){
      const label=document.createElement('label');label.className='editor-card';
      const input=document.createElement('input');input.type='checkbox';input.checked=selected.has(item.ref);input.dataset.editorRef=item.ref;
      input.setAttribute('aria-label',item.english+'を選択');
      input.onchange=()=>{if(input.checked)selected.add(item.ref);else selected.delete(item.ref);refresh();};
      label.append(input);
      const source=CardSet.source(item);
      if(source){const image=document.createElement('img');image.src=source;image.alt='';image.loading='lazy';image.onerror=()=>image.remove();label.append(image);}
      const name=document.createElement('span');name.textContent=item.english;label.append(name);
      if(item.japanese){const jp=document.createElement('small');jp.textContent=item.japanese;label.append(jp);}
      if(removable)label.title='チェックを外すとセットから除きます';
      return label;
    }
    function refresh(){
      modal.querySelector('.editor-count').textContent=`選択中のカード（${selected.size}語）`;
      modal.querySelector('.editor-selected').replaceChildren(...[...selected].map(ref=>card(catalog.get(ref),true)));
      modal.querySelectorAll('.editor-groups input').forEach(input=>{input.checked=selected.has(input.dataset.editorRef);});
    }
    for(const group of groups){
      const details=document.createElement('details'),summary=document.createElement('summary'),grid=document.createElement('div');
      summary.textContent=`${group.label} ${group.level}（${group.items.length}）`;grid.className='editor-grid';
      grid.append(...group.items.map(item=>card(item,false)));details.append(summary,grid);modal.querySelector('.editor-groups').append(details);
    }
    modal.querySelectorAll('[data-save-mode]').forEach(button=>{button.onclick=()=>{
      try{
        const name=modal.querySelector('.editor-name').value.trim();
        if(button.dataset.saveMode==='copy'&&name===saved.name)throw new Error('別名で保存する場合は、セット名を変更してください。');
        const payload=CardSet.snapshot([...selected].map(ref=>catalog.get(ref)),display);
        onSave(name,payload,button.dataset.saveMode==='overwrite'?saved.id:undefined);
        modal.close();
      }catch(error){modal.querySelector('.share-status').textContent=error.message;}
    };});
    modal.addEventListener('close',()=>modal.remove(),{once:true});
    refresh();document.body.append(modal);modal.showModal();
  }
  window.CardSetEditor={open};
})();
