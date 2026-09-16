(() => {
  'use strict';
  const root = document.getElementById('student-app');
  let set, model, screen = 'top', filter = 'all', loadId = 0;
  const sessions = new Map();
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function card(item) {
    const src = CardSet.source(item), d = set.display;
    return `${d.image && src ? `<img src="${esc(src)}" alt="" draggable="false">` : ''}${d.image && !src && !d.english && !d.japanese ? `<b>${esc(item.english)}</b>` : ''}${d.english ? `<b>${esc(item.english)}</b>` : ''}${d.japanese ? `<span>${esc(item.japanese)}</span>` : ''}`;
  }
  function header(title, reset = false) {
    return `<header class="student-header"><button data-back aria-label="戻る">◀</button><h1>${esc(title)}</h1>${reset ? '<button data-reset>リセット</button>' : '<span></span>'}</header>`;
  }
  function render() {
    if (screen === 'top') {
      root.innerHTML = `<section class="student-page"><h1>ゲームを選ぼう</h1><p>${set.items.length}語の回答カードが届きました</p><div class="game-tiles">${Object.entries(StudentGames.games).map(([id,g]) => `<button data-game="${esc(id)}"><strong>${esc(g.title)}</strong><span>${esc(g.description)}</span></button>`).join('')}</div></section>`;
    } else if (screen === 'setup') {
      root.innerHTML = `${header(model.game.title)}<section class="student-page"><h2>先生と同じ設定にしよう</h2>${model.game.fields.map(f => `<label class="setup-field">${esc(f.label)}<select data-setting="${esc(f.key)}">${Array.from({length:f.max},(_,i) => `<option value="${i+1}" ${model.config[f.key]===i+1?'selected':''}>${i+1}</option>`).join('')}</select>${esc(f.unit)}</label>`).join('')}<p>枚数・回数を変更すると回答は消えます。</p><button class="begin" data-begin>回答画面へ</button></section>`;
    } else {
      const answers = model.answers, lookup = new Map(set.items.map(i=>[i.ref,i])); let index = 0;
      const categories = [...new Set(set.items.map(i=>i.category))];
      root.innerHTML = `<div class="answer-shell">${header(model.game.title, true)}<section class="answer-middle" aria-label="回答"><p class="instructions">下のカードをタップして回答。入れたカードをタップすると外せます。</p>${model.game.groups(model.config).map(g=>`<section class="answer-group"><h2>${esc(g.label)}</h2><div class="answer-row">${Array.from({length:g.size},()=>{const n=index++, item=lookup.get(answers[n]); return `<button class="answer-slot ${item?'filled':''}" data-slot="${n}" aria-label="${n+1}番目${item?' '+esc(item.english)+'を外す':' 空き'}">${item?card(item):`<span>${n+1}</span>`}</button>`;}).join('')}</div></section>`).join('')}</section><footer class="answer-tray"><div class="tray-toolbar"><label>カテゴリー <select id="category"><option value="all">All</option>${categories.map(c=>`<option value="${esc(c)}" ${filter===c?'selected':''}>${esc(window.DEKIRU_DATA.categoryLabels[c] || (c==='expressions'?'表現':c))}</option>`).join('')}</select></label><span>${answers.filter(Boolean).length} / ${answers.length}枚${model.repeat?' ・同じカードも使えます':''}</span></div><div class="tray-cards">${set.items.filter(i=>filter==='all'||i.category===filter).map(i=>{const used=answers.filter(a=>a===i.ref).length;return `<button class="tray-card ${used?'used':''}" data-card="${esc(i.ref)}" ${used&&!model.repeat?'disabled':''} aria-label="${esc(i.english)}${used?' 使用中':''}">${card(i)}${used?`<small>使用中 ${used}</small>`:''}</button>`;}).join('')}</div></footer></div>`;
    }
    if (model?.locked && screen === 'setup') {
      root.querySelectorAll('[data-setting]').forEach(el => { el.disabled = true; });
      const note = document.createElement('p'); note.textContent = 'LOCK中です。回答画面のリセットで解除できます。';
      root.querySelector('.student-page').append(note);
    }
    if (screen === 'answer') {
      const toolbar = root.querySelector('.tray-toolbar');
      const lock = document.createElement('button'); lock.dataset.lock = ''; lock.className = 'lock-button';
      lock.textContent = model.locked ? '🔒 LOCK済み' : 'LOCK（回答を確定）';
      lock.disabled = model.locked || model.answers.some(a => !a);
      lock.title = 'すべてのスロットを埋めると確定できます';
      toolbar.append(lock);
      if (model.locked) {
        root.querySelectorAll('[data-slot], [data-card]').forEach(el => { el.disabled = true; });
        root.querySelector('.instructions').textContent = '🔒 回答を確定しました。次の問題はリセットで全カードを外してください。';
      }
    }
  }
  function updateAnswers() {
    const top = root.querySelector('.answer-middle')?.scrollTop || 0;
    const left = root.querySelector('.tray-cards')?.scrollLeft || 0;
    const focused = document.activeElement;
    const ref = focused?.dataset.card, slot = focused?.dataset.slot;
    render();
    root.querySelector('.answer-middle').scrollTop = top;
    root.querySelector('.tray-cards').scrollLeft = left;
    // Keep keyboard navigation in the same region without changing scroll position.
    const candidates = ref ? [...root.querySelectorAll('[data-card]')] : [...root.querySelectorAll('[data-slot]')];
    const next = candidates.find(el => ref ? el.dataset.card===ref && !el.disabled : el.dataset.slot===slot);
    next?.focus({preventScroll:true});
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !set) return;
    if (b.dataset.game) {
      if (!sessions.has(b.dataset.game)) sessions.set(b.dataset.game, StudentGames.create(b.dataset.game, set.items.map(i=>i.ref)));
      model=sessions.get(b.dataset.game); screen='setup'; render();
    } else if (b.hasAttribute('data-back')) { screen=screen==='answer'?'setup':'top'; render(); }
    else if (b.hasAttribute('data-begin')) {screen='answer'; render();}
    else if (b.hasAttribute('data-reset')) {model.reset(); updateAnswers();}
    else if (b.hasAttribute('data-lock')) {model.lock(); updateAnswers();}
    else if (b.dataset.card) {if(model.add(b.dataset.card)) updateAnswers();}
    else if (b.hasAttribute('data-slot')) {model.remove(Number(b.dataset.slot)); updateAnswers();}
  });
  root.addEventListener('change', e => {
    if(e.target.dataset.setting) model.configure({...model.config,[e.target.dataset.setting]:Number(e.target.value)});
    else if(e.target.id==='category') {filter=e.target.value; updateAnswers(); root.querySelector('.tray-cards').scrollLeft=0;}
  });
  root.addEventListener('error', e => {
    const img=e.target; if(img.tagName!=='IMG') return;
    if(!img.dataset.fallback && img.src.includes('/assets/cards/')) { img.dataset.fallback='1'; img.src='assets/cards/'+img.src.split('/assets/cards/')[1]; }
    else {img.hidden=true; const label=document.createElement('span'); label.textContent=img.parentElement.getAttribute('aria-label') || '画像なし'; img.after(label);}
  },true);
  async function load() {
    const id=++loadId; sessions.clear(); set=null; model=null; screen='top'; filter='all';
    try {
      const token = location.hash.startsWith('#cards=') ? location.hash.slice(7) : '';
      const payload=await CardSet.decode(token); if(id!==loadId)return;
      set=CardSet.resolve(payload); render();
    } catch(error) {if(id===loadId) root.innerHTML=`<section class="student-page"><h1>カードを開けませんでした</h1><p>${esc(error.message)}</p><p>先生から届いたURL・QRコードをもう一度開いてください。</p></section>`;}
  }
  window.addEventListener('hashchange',load); load();
})();
