window.BombGame = (() => {
  const settings={count:24,sound:true}, assets='assets/ui/bomb/';
  const FUSE_MS=1100, EXPLOSION_MS=5000;
  let host,deck=[],bomb=-1,safe=new Set(),phase='idle',generation=0,timers=[],fuseAudio,bombAudio,audioContext;
  let sizeObserver;
  const busy=()=>['loading','fuse','explosion'].includes(phase);
  function fitLabels(stage){
    stage?.querySelectorAll('.word-card > strong,.word-card > span').forEach(label=>{
      label.style.fontSize='';
      const width=label.clientWidth;
      if(!width)return;
      let size=parseFloat(getComputedStyle(label).fontSize);
      if(label.scrollWidth>width){
        size=Math.max(1,Math.floor(size*(width-1)/label.scrollWidth*10)/10);
        label.style.fontSize=size+'px';
        while(label.scrollWidth>width&&size>1){size=Math.max(1,size-.25);label.style.fontSize=size+'px';}
      }
    });
  }
  function choose(pool,count){
    const cards=[...new Map(pool.map(i=>[i.ref||i.id,i])).values()];
    if(cards.length<count)return [];
    for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
    return cards.slice(0,count);
  }
  function layout(n){const columns=n<=4?n:n<=8?4:n<=15?5:6;return {columns,rows:Math.ceil(n/columns)};}
  function settingsMarkup(){return `<h2>BOMB GAME の設定</h2><label class="look-setting">表示枚数<select data-bomb-setting="count">${Array.from({length:22},(_,i)=>`<option value="${i+3}" ${settings.count===i+3?'selected':''}>${i+3}枚</option>`).join('')}</select></label><label><input type="checkbox" data-bomb-setting="sound" ${settings.sound?'checked':''}> 効果音</label><p>カードをタップして進めます。SAFEは○、BOMBは爆発！爆弾は1枚です。</p>`;}
  function markup(){
    const controls=`<div class="bomb-heading-controls"><button class="game-art-button" data-bomb-action="start" aria-label="START／もう一度"><img src="assets/ui/start.svg" alt="START"></button><span class="bomb-status" id="bomb-status" role="status"></span></div>`;
    return `<div class="look-game bomb-game">${PictureGame.heading('BOMB GAME',controls)}<div class="bomb-stage" id="bomb-stage"></div></div>`;
  }
  function paint(animateSafe=-1){
    const stage=document.getElementById('bomb-stage');if(!stage||!host)return;
    if(phase==='idle'||phase==='loading')stage.innerHTML=`<p class="look-message">${phase==='loading'?'準備中…':'STARTを押してください'}</p>`;
    else {
      const grid=layout(deck.length);
      stage.innerHTML=`<div class="bomb-grid" style="--columns:${grid.columns};--rows:${grid.rows}">${deck.map((item,i)=>{
        const gone=phase==='ended'&&i!==bomb&&!safe.has(i),disabled=phase!=='playing'||safe.has(i);
        const card=host.card(item).replace(' tabindex="-1"','').replace('<button ',`<button data-bomb-pick="${i}" ${disabled?'disabled':''} `);
        let mark=safe.has(i)?`<span class="bomb-safe-mark${i===animateSafe?' bomb-safe-new':''}" aria-label="SAFE">○</span>`:'';
        if(i===bomb&&phase==='fuse')mark=`<img class="bomb-fuse" src="${assets}fuse.svg?round=${generation}" alt="爆弾">`;
        if(i===bomb&&phase==='ended')mark=`<img src="${assets}answer.svg" alt="爆弾のカード">`;
        return `<div class="bomb-cell ${gone?'bomb-gone':''}">${card}<div class="bomb-mark">${mark}</div></div>`;
      }).join('')}</div>${phase==='explosion'?`<div class="bomb-overlay"><img src="${assets}explosion.svg" alt="爆発"></div>`:''}`;
    }
    fitLabels(stage);
    const status=document.getElementById('bomb-status');
    if(status)status.textContent=phase==='fuse'?'BOMB…!':phase==='explosion'||phase==='ended'?'BOMB!':phase==='playing'?`SAFE ${safe.size}枚 ／ 残り ${deck.length-safe.size}枚`:'';
    document.querySelectorAll('[data-bomb-action]').forEach(b=>{b.disabled=phase==='loading';});
    document.querySelectorAll('.unit-sidebar input,.unit-sidebar select,.unit-sidebar [data-word-ref]').forEach(c=>{c.disabled=busy();});
  }
  function stopAudio(){for(const audio of [fuseAudio,bombAudio])if(audio){try{audio.pause();audio.currentTime=0;}catch{}}if(audioContext){audioContext.close()?.catch(()=>{});audioContext=null;}}
  function cancel(){generation++;timers.forEach(clearTimeout);timers=[];stopAudio();}
  function stop(reset=false){cancel();sizeObserver?.disconnect();if(reset||busy()){deck=[];safe=new Set();bomb=-1;phase='idle';}}
  function later(fn,ms,run){const timer=setTimeout(()=>{timers=timers.filter(t=>t!==timer);if(run===generation)fn();},ms);timers.push(timer);}
  function playAudio(audio,offset=0){try{audio.pause();audio.currentTime=offset;audio.play()?.catch(()=>{});}catch{}}
  function safeTone(){
    if(!settings.sound)return;
    try{
      const AudioEngine=window.AudioContext||window.webkitAudioContext;
      if(!AudioEngine)return;
      audioContext ||= new AudioEngine();audioContext.resume()?.catch(()=>{});
      const now=audioContext.currentTime;
      [[660,0,.13],[880,.14,.22]].forEach(([f,t,d])=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.frequency.value=f;osc.type='sine';gain.gain.setValueAtTime(.0001,now+t);gain.gain.exponentialRampToValueAtTime(.22,now+t+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+t+d);osc.connect(gain);gain.connect(audioContext.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(now+t);osc.stop(now+t+d+.02);});
    }catch{}
  }
  async function start(){
    if(phase==='loading'||!host)return;
    cancel();deck=[];safe=new Set();bomb=-1;phase='idle';
    if(!Object.values(host.display()).some(Boolean)){host.notify('表示設定を1つ以上選んでください');paint();return;}
    deck=choose(host.pool(),settings.count);
    if(!deck.length){host.notify(`使用する単語を${settings.count}語以上選ぶか、表示枚数を減らしてください`);paint();return;}
    bomb=Math.floor(Math.random()*deck.length);phase='loading';paint();const run=generation;
    await PictureGame.preload(deck,host.source);
    if(run!==generation)return;
    phase='playing';paint();
  }
  function pick(index){
    if(phase!=='playing'||!Number.isInteger(index)||index<0||index>=deck.length||safe.has(index))return;
    if(index!==bomb){safe.add(index);safeTone();paint(index);return;}
    phase='fuse';const run=generation;
    if(settings.sound){
      fuseAudio ||= new Audio(assets+'fuse.mp3');bombAudio ||= new Audio(assets+'explosion.mp3');
      playAudio(fuseAudio);playAudio(bombAudio,.45);
    }
    paint();
    later(()=>{if(fuseAudio){fuseAudio.pause();fuseAudio.currentTime=0;}phase='explosion';paint();
      later(()=>{phase='ended';stopAudio();paint();},EXPLOSION_MS,run);
    },FUSE_MS,run);
  }
  function configure(key,value){if(busy())return;if(key==='count'&&Number.isInteger(Number(value))&&value>=3&&value<=24)settings.count=Number(value);if(key==='sound'){settings.sound=!!value;if(!settings.sound)stopAudio();}}
  return {markup,settingsMarkup,choose,layout,stop,configure,pick,isRunning:busy,attach(options){
    host=options;paint();sizeObserver?.disconnect();
    const stage=document.getElementById('bomb-stage');
    if(stage&&window.ResizeObserver){sizeObserver=new window.ResizeObserver(()=>fitLabels(stage));sizeObserver.observe(stage);}
    document.fonts?.ready.then(()=>{if(stage?.isConnected)fitLabels(stage);});
  },action(name){if(name==='start')start();}};
})();
