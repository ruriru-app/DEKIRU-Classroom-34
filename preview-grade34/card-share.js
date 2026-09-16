(() => {
  'use strict';
  let dialog;
  async function open(items, display, options={}) {
    // Capture before the first await so later teacher edits never alter an issued set.
    const payload = CardSet.snapshot(items, display);
    const token = await CardSet.encode(payload);
    const url = new URL('student.html', location.href);
    url.hash = 'cards=' + token;
    dialog?.remove();
    dialog = document.createElement('dialog'); dialog.className = 'card-share-dialog';
    dialog.innerHTML = '<form method="dialog"><button class="secondary-button" aria-label="閉じる">閉じる ×</button></form><h2>児童に配信</h2><p class="share-count"></p><div class="share-qr"></div><p class="share-warning"></p><label>配信用URL<textarea readonly rows="3"></textarea></label><div class="share-actions"><button class="primary-button">URLをコピーする</button><a class="secondary-button" target="_blank" rel="noopener">回答画面を試す</a></div><p role="status" class="share-status"></p>';
    document.body.append(dialog);
    if(options.save){
      const section=document.createElement('section');section.className='share-save';
      section.innerHTML='<label>セット名<input type="text" maxlength="60" placeholder="例：色と食べ物" aria-label="セット名"></label><button type="button" class="secondary-button">このセットを保存</button><small>この端末・ブラウザに保存します。保存せず配信することもできます。</small><p role="status"></p>';
      dialog.querySelector('h2').after(section);
      section.querySelector('button').onclick=()=>{
        try{options.save(section.querySelector('input').value,payload);section.querySelector('p').textContent='保存しました。左メニューから呼び出せます。';section.querySelector('button').disabled=true;}
        catch(error){section.querySelector('p').textContent=error.message;}
      };
    }
    dialog.querySelector('.share-count').textContent = payload.refs.length + '語のカードセット（発行時の選択内容）';
    dialog.querySelector('textarea').value = url.href;
    dialog.querySelector('a').href = url.href;
    const warning = dialog.querySelector('.share-warning');
    if (url.protocol === 'file:') {
      warning.textContent = '現在はPC内の確認用です。このURL・QRは児童端末では開けません。公開された試用ページから配信してください。';
    } else {
      try { const qr = qrcode(0, 'L'); qr.addData(url.href); qr.make(); dialog.querySelector('.share-qr').innerHTML = qr.createSvgTag(6, 4); }
      catch { warning.textContent = 'カード数が多いためQRを作成できません。URLをコピーして配布してください。'; }
    }
    dialog.querySelector('.primary-button').onclick = async () => {
      try { await navigator.clipboard.writeText(url.href); dialog.querySelector('.share-status').textContent = 'URLをコピーしました'; }
      catch { const field = dialog.querySelector('textarea'); field.focus(); field.select(); dialog.querySelector('.share-status').textContent = 'URLを選択しました。コピーしてください。'; }
    };
    dialog.showModal();
  }
  window.CardShare = {open};
})();
