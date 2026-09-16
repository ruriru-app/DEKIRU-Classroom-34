(() => {
  'use strict';
  const $=id=>document.getElementById(id),M=PhonicsModel,model=M.create(),practice=CardPractice.create();
  let active=false;
  const from=new URLSearchParams(location.search).get('from');
  const returns={lt1:'index.html#/book/lt1',lt2:'index.html#/book/lt2',nh5:'../grade56/index.html#/book/nh5'};
  $('back').href=returns[from]||returns.lt1;
  $('selection').innerHTML=M.groups.map(g=>`<details open><summary><label><input type="checkbox" data-group="${g.id}" checked>${g.name}（${M.cards.filter(c=>c.group===g.id).length}）</label></summary><div class="letter-options">${M.cards.filter(c=>c.group===g.id).map(c=>`<label><input type="checkbox" data-letter="${c.letter}" checked>${c.letter}${c.letter.toLowerCase()}</label>`).join('')}</div></details>`).join('');
  $('practice-settings').innerHTML=practice.settings();
  function card(c){
    const vertical=['3','5'].includes(practice.layout);
    // Each illustration has a different boundary; do not cut all cards at the midpoint.
    const crops={A:850,B:736,C:708,D:780,E:850,F:696,G:772,H:760,I:660,J:574,K:854,L:692,M:822,N:792,O:764,P:744,Q:816,R:804,S:780,T:714,U:768,V:744,W:874,X:768,Y:734,Z:736};
    const x=crops[c.letter],width=1536-x;
    const content=vertical?`<div class="practice-art"><svg viewBox="${x} 0 ${width} 1024" role="img" aria-label="${c.word}"><defs><clipPath id="art-${c.letter}"><rect x="${x}" y="0" width="${width}" height="1024"/></clipPath></defs><image clip-path="url(#art-${c.letter})" href="${c.image}" x="0" y="0" width="1536" height="1024"/></svg></div><div class="practice-label ${c.group}">${c.letter}${c.letter.toLowerCase()}</div>`:`<img src="${c.image}" alt="${c.letter}${c.letter.toLowerCase()} ${c.word}" loading="lazy">`;
    return `<div class="practice-card ${vertical?'phonics-portrait':''}" data-card="${c.letter}">${content}</div>`;
  }
  function render(){
    $('practice-settings').hidden=!active;$('practice-heading').hidden=!active;
    const items=practice.arrange(model.items());
    $('stage').innerHTML=!active?'<button id="open-practice" class="feature-tile"><div class="feature-tile-heading"><span class="tile-mark">Words</span><strong>発音練習</strong></div><span class="feature-tile-description">選んだフォニックスカードで音を練習する</span></button>':!items.length?'<p>左のメニューからカードを選んでください。</p>':`<div class="practice-grid" data-layout="${practice.layout}">${items.map(card).join('')}</div>`;
    $('count').textContent=`使用 ${items.length}枚`;
    document.querySelectorAll('[data-group]').forEach(box=>{const cards=M.cards.filter(c=>c.group===box.dataset.group),n=cards.filter(c=>model.selected.has(c.letter)).length;box.checked=n===cards.length;box.indeterminate=n>0&&n<cards.length;});
    document.querySelectorAll('[data-letter]').forEach(box=>box.checked=model.selected.has(box.dataset.letter));
  }
  $('selection').addEventListener('change',e=>{const el=e.target;if(el.dataset.group)model.selectGroup(el.dataset.group,el.checked);else if(el.dataset.letter)model.select(el.dataset.letter,el.checked);render();});
  $('practice-settings').addEventListener('change',e=>{if(e.target.dataset.practiceSetting){practice.configure(e.target.dataset.practiceSetting,e.target.value);render();$('stage').scrollTop=0;}});
  $('stage').addEventListener('click',e=>{if(e.target.closest('#open-practice')){active=true;render();}});
  $('close-practice').addEventListener('click',async()=>{if(document.fullscreenElement)await document.exitFullscreen();$('viewer').classList.remove('expanded');active=false;render();});
  $('fullscreen').addEventListener('click',async()=>{const viewer=$('viewer');if(document.fullscreenElement){await document.exitFullscreen();return;}if(viewer.classList.contains('expanded')){viewer.classList.remove('expanded');return;}try{await viewer.requestFullscreen();}catch{viewer.classList.add('expanded');$('notice').textContent='画面いっぱいに表示しています。Escで戻れます。';}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('viewer').classList.remove('expanded');$('notice').textContent='';}});
  render();
})();
