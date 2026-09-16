/* Teacher game; seconds table intentionally editable after classroom trials. */
window.WhatsMissing = (() => {
  const presets = {
    3:[6,4,3,2],4:[8,5,3.5,2.5],5:[10,6,4,3],6:[12,7,4.5,3.5],
    7:[14,8,5,4],8:[16,9,5.5,4.5],9:[18,10,6,5],10:[20,11,6.5,5.5]
  };
  const levels=['Easy','Normal','Hard','Extra Hard'], gapMs=600;
  const settings={count:5,level:'Normal'};
  const overrides=new Map();
  let host, deck=[], missing=-1, phase='idle', running=false, generation=0, timer;
  const seconds=level=>overrides.get(settings.count+':'+level) ?? presets[settings.count][levels.indexOf(level)];
  function rows(count) {return count<=5?[count]:[Math.ceil(count/2),Math.floor(count/2)];}
  function choose(pool,count) {
    const unique=[...new Map(pool.map(i=>[i.ref||i.id,i])).values()];
    if(unique.length<count)return [];
    for(let i=unique.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[unique[i],unique[j]]=[unique[j],unique[i]];}
    return unique.slice(0,count);
  }
  function settingsMarkup() {
    return `<h2>What’s Missing? の設定</h2><label class="look-setting">表示枚数<select data-missing-setting="count">${Array.from({length:8},(_,i)=>`<option value="${i+3}" ${settings.count===i+3?'selected':''}>${i+3}枚</option>`).join('')}</select></label><fieldset class="look-levels missing-levels"><legend>表示時間</legend>${levels.map(level=>`<div><label><input type="radio" name="missing-level" data-missing-setting="level" value="${level}" ${settings.level===level?'checked':''}>${level}</label><label><input type="number" min="0.15" max="120" step="0.05" value="${seconds(level)}" data-missing-seconds="${level}" aria-label="${level}の表示秒数"> 秒</label></div>`).join('')}</fieldset><p>秒数は仮のおすすめ値です。変更した秒数は枚数・難易度ごとに、このページを閉じるまで保持します。</p>`;
  }
  function markup() {
    return `<div class="look-game missing-game">${PictureGame.heading('What’s Missing?')}<div class="look-stage missing-stage" id="missing-stage"></div><footer class="game-controls">${['start','answer'].map(action=>`<button class="game-art-button" data-missing-action="${action}" aria-label="${action.toUpperCase()}"><img src="assets/ui/${action}.svg" alt="${action.toUpperCase()}"></button>`).join('')}</footer></div>`;
  }
  function paint() {
    const stage=document.getElementById('missing-stage'); if(!stage||!host)return;
    if(['live','question','answer'].includes(phase)) {
      let at=0; const layout=rows(deck.length);
      stage.innerHTML=`<div class="missing-board" style="--rows:${layout.length};--columns:${layout[0]}">${layout.map(size=>`<div class="missing-row">${Array.from({length:size},()=>{const n=at++;return `<div class="missing-cell ${phase==='answer'&&n===missing?'missing-correct':''}">${phase==='question'&&n===missing?'<div class="missing-hole" aria-label="消えたカード">?</div>':host.card(deck[n])}${phase==='answer'&&n===missing?'<span class="missing-badge">正解</span>':''}</div>`;}).join('')}</div>`).join('')}</div>`;
    } else stage.innerHTML=`<p class="look-message">${phase==='loading'?'準備中…':phase==='gap'?'': 'STARTを押してください'}</p>`;
    document.querySelectorAll('[data-missing-action]').forEach(b=>{b.disabled=running||(b.dataset.missingAction==='answer'&&!['question','answer'].includes(phase));});
    document.querySelectorAll('.unit-sidebar input,.unit-sidebar select,.unit-sidebar [data-word-ref]').forEach(c=>{c.disabled=running;});
  }
  function stop(reset=false) {
    generation++;clearTimeout(timer);running=false;
    if(reset || ['loading','live','gap'].includes(phase)){deck=[];missing=-1;phase='idle';}
  }
  async function start() {
    if(running||!host)return;
    deck=[];missing=-1;phase='idle';
    if(!Object.values(host.display()).some(Boolean)){host.notify('表示設定を1つ以上選んでください');paint();return;}
    deck=choose(host.pool(),settings.count);
    if(!deck.length){host.notify(`使用する単語を${settings.count}語以上選んでください`);paint();return;}
    missing=Math.floor(Math.random()*deck.length);
    const duration=seconds(settings.level)*1000, run=++generation;
    running=true;phase='loading';paint();
    await PictureGame.preload(deck,host.source);
    if(run!==generation)return;
    phase='live';paint();
    requestAnimationFrame(()=>{
      if(run!==generation)return;
      timer=setTimeout(()=>{
        if(run!==generation)return;
        phase='gap';paint();
        timer=setTimeout(()=>{if(run!==generation)return;phase='question';running=false;paint();},gapMs);
      },duration);
    });
  }
  function configure(key,value) {
    if(running)return;
    if(key==='count'&&Number.isInteger(Number(value))&&value>=3&&value<=10)settings.count=Number(value);
    if(key==='level'&&levels.includes(value))settings.level=value;
    if(levels.includes(key)&&Number.isFinite(Number(value))&&value>=.15&&value<=120)overrides.set(settings.count+':'+key,Number(value));
  }
  return {presets,rows,choose,seconds,settingsMarkup,markup,configure,stop,isRunning:()=>running,
    attach(options){host=options;paint();},
    action(name){if(name==='start')start();else if(name==='answer'&&!running&&phase==='question'){phase='answer';paint();}}
  };
})();
