function normalizeAlphabetLevel(level){
  const value=String(level||'easy').toLowerCase();
  return ALPHABET_LEVELS.has(value)?value:'easy';
}
function shuffleAlphabet(items){
  const copy=[...items];
  for(let index=copy.length-1;index>0;index--){
    const target=Math.floor(Math.random()*(index+1));
    [copy[index],copy[target]]=[copy[target],copy[index]];
  }
  return copy;
}
function stopAlphabetTimer(){
  if(alphabetTimerFrame)cancelAnimationFrame(alphabetTimerFrame);
  alphabetTimerFrame=0;
}
function cancelAlphabetSpeech(){
  if('speechSynthesis' in window)window.speechSynthesis.cancel();
}
function speakAlphabetPrompt(letter){
  if(!alphabetSoundEnabled||alphabetLevel!=='easy'||alphabetPhase!=='play'||!letter||!('speechSynthesis' in window))return;
  cancelAlphabetSpeech();
  const utterance=new SpeechSynthesisUtterance(letter);
  utterance.lang='en-US';utterance.rate=.72;utterance.pitch=1;
  window.speechSynthesis.speak(utterance);
}
function updateAlphabetTimer(){
  if(alphabetPhase!=='play')return;
  alphabetElapsed=(performance.now()-alphabetStartedAt)/1000;
  const time=document.getElementById('alphabetTime');
  if(time)time.textContent=alphabetElapsed.toFixed(2);
  alphabetTimerFrame=requestAnimationFrame(updateAlphabetTimer);
}
function updateAlphabetSoundButton(){
  const button=document.getElementById('alphabetSound');
  if(!button)return;
  button.setAttribute('aria-pressed',String(alphabetSoundEnabled));
  document.getElementById('alphabetSoundIcon').textContent=alphabetSoundEnabled?'🔊':'🔇';
  document.getElementById('alphabetSoundLabel').textContent=alphabetSoundEnabled?'効果音ON':'効果音OFF';
}
function alphabetTone(kind){
  if(!alphabetSoundEnabled)return;
  try{
    alphabetAudioContext=alphabetAudioContext||new (window.AudioContext||window.webkitAudioContext)();
    if(alphabetAudioContext.state==='suspended')alphabetAudioContext.resume();
    const play=(frequency,start,duration,type='sine')=>{
      const oscillator=alphabetAudioContext.createOscillator();
      const gain=alphabetAudioContext.createGain();
      oscillator.type=type;oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(.16,start+.015);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      oscillator.connect(gain);gain.connect(alphabetAudioContext.destination);
      oscillator.start(start);oscillator.stop(start+duration+.02);
    };
    const now=alphabetAudioContext.currentTime;
    if(kind==='wrong'){play(190,now,.13,'square');return}
    if(kind==='finish'){play(523,now,.14);play(659,now+.13,.14);play(784,now+.26,.25);return}
    play(760,now,.11);
  }catch(error){}
}
function setAlphabetPhase(phase){
  alphabetPhase=phase;
  const setup=document.getElementById('alphabetSetup');
  const play=document.getElementById('alphabetPlay');
  const clock=document.getElementById('alphabetClock');
  if(setup)setup.hidden=phase!=='setup';
  if(play)play.hidden=phase==='setup';
  if(clock)clock.hidden=phase==='setup';
  if(phase==='setup'){
    stopAlphabetTimer();
    stopAlphabetMotion();
    cancelAlphabetSpeech();
    const finish=document.getElementById('alphabetFinish');
    if(finish)finish.hidden=true;
  }
}
function alphabetScatteredPositions(level=alphabetLevel){
  const settings=ALPHABET_SCATTER_CONFIG[level]||ALPHABET_SCATTER_CONFIG.extra;
  const positions=[];
  for(let index=0;index<ALPHABET_LETTERS.length;index++){
    let chosen=null;
    let best={left:50,top:50};
    let bestScore=-Infinity;
    for(let attempt=0;attempt<150;attempt++){
      const candidate={
        left:settings.minX+Math.random()*(settings.maxX-settings.minX),
        top:settings.minY+Math.random()*(settings.maxY-settings.minY),
      };
      const score=positions.length?Math.min(...positions.map(position=>Math.hypot(
        (candidate.left-position.left)/settings.xScale,
        (candidate.top-position.top)/settings.yScale,
      ))):99;
      if(score>bestScore){best=candidate;bestScore=score}
      if(score>=.84){chosen=candidate;break}
    }
    positions.push(chosen||best);
  }
  return positions;
}
function stopAlphabetMotion(){
  if(alphabetMotionFrame)cancelAnimationFrame(alphabetMotionFrame);
  alphabetMotionFrame=0;alphabetMotionLastTime=0;alphabetMovingItems=[];
}
function alphabetMovementBounds(board,area={left:0,top:0,width:1,height:1}){
  return {
    left:board.clientWidth*area.left,
    top:board.clientHeight*area.top,
    width:board.clientWidth*area.width,
    height:board.clientHeight*area.height,
  };
}
function alphabetMotionStep(timestamp){
  if(alphabetLevel!=='legend'||alphabetPhase!=='play'){alphabetMotionFrame=0;return}
  const board=document.getElementById('alphabetBoard');
  if(!board){alphabetMotionFrame=0;return}
  if(!alphabetMotionLastTime)alphabetMotionLastTime=timestamp;
  const delta=Math.min(.04,(timestamp-alphabetMotionLastTime)/1000);
  alphabetMotionLastTime=timestamp;
  alphabetMovingItems.forEach(item=>{
    if(item.element.classList.contains('gone'))return;
    const bounds=alphabetMovementBounds(board,item.area);
    const minX=bounds.left;
    const maxX=Math.max(minX,bounds.left+bounds.width-item.width);
    const minY=bounds.top;
    const maxY=Math.max(minY,bounds.top+bounds.height-item.height);
    item.x+=item.vx*delta;item.y+=item.vy*delta;
    if(item.x<=minX){item.x=minX;item.vx=Math.abs(item.vx)}
    else if(item.x>=maxX){item.x=maxX;item.vx=-Math.abs(item.vx)}
    if(item.y<=minY){item.y=minY;item.vy=Math.abs(item.vy)}
    else if(item.y>=maxY){item.y=maxY;item.vy=-Math.abs(item.vy)}
    item.element.style.transform='translate3d('+item.x+'px,'+item.y+'px,0)';
  });
  alphabetMotionFrame=requestAnimationFrame(alphabetMotionStep);
}
function startAlphabetMotion(area=ALPHABET_MOTION_CONFIG.legend.area){
  stopAlphabetMotion();
  const board=document.getElementById('alphabetBoard');
  if(!board||alphabetLevel!=='legend'||alphabetPhase!=='play')return;
  const config=ALPHABET_MOTION_CONFIG.legend;
  const bounds=alphabetMovementBounds(board,area);
  const placed=[];
  alphabetMovingItems=[...board.querySelectorAll('[data-alphabet-letter]')].map(element=>{
    const width=element.offsetWidth;
    const height=element.offsetHeight;
    const minX=bounds.left;
    const maxX=Math.max(minX,bounds.left+bounds.width-width);
    const minY=bounds.top;
    const maxY=Math.max(minY,bounds.top+bounds.height-height);
    let chosen=null;
    let best={x:minX,y:minY};
    let bestScore=-Infinity;
    for(let attempt=0;attempt<180;attempt++){
      const candidate={
        x:minX+Math.random()*(maxX-minX||0),
        y:minY+Math.random()*(maxY-minY||0),
      };
      const score=placed.length?Math.min(...placed.map(item=>Math.hypot(
        (candidate.x+width/2-item.x-item.width/2)/Math.max(54,(width+item.width)/2),
        (candidate.y+height/2-item.y-item.height/2)/Math.max(54,(height+item.height)/2),
      ))):99;
      if(score>bestScore){best=candidate;bestScore=score}
      if(score>=1.05){chosen=candidate;break}
    }
    const position=chosen||best;
    const angle=Math.random()*Math.PI*2;
    const speed=config.speedMin+Math.random()*(config.speedMax-config.speedMin);
    const item={element,x:position.x,y:position.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,width,height,area};
    placed.push(item);
    element.style.transform='translate3d('+item.x+'px,'+item.y+'px,0)';
    return item;
  });
  alphabetMotionFrame=requestAnimationFrame(alphabetMotionStep);
}
function renderAlphabetBoard(){
  const board=document.getElementById('alphabetBoard');
  const next=document.getElementById('alphabetNext');
  if(!board)return;
  const aligned=alphabetLevel==='easy'||alphabetLevel==='normal';
  const moving=alphabetLevel==='legend';
  board.className='alphabet-board '+(aligned?'aligned':moving?'legend':'scattered')+(alphabetLevel==='hard'?' hard':'')+(alphabetLevel==='extra'?' extra':'')+(alphabetLevel==='normal'?' no-hint':'');
  if(next)next.hidden=alphabetLevel!=='easy';
  const positions=aligned||moving?[]:alphabetScatteredPositions(alphabetLevel);
  const sizes=moving?ALPHABET_MOTION_CONFIG.legend.sizes:[30,38,46,54];
  board.innerHTML='';
  alphabetLastOrder.forEach((letter,index)=>{
    const button=document.createElement('button');
    button.type='button';button.className='alphabet-letter';button.dataset.alphabetLetter=letter;button.textContent=letter;
    button.setAttribute('aria-label',letter);
    if(moving){
      button.style.fontSize=sizes[Math.floor(Math.random()*sizes.length)]+'px';
    }else if(!aligned){
      button.style.left=positions[index].left+'%';button.style.top=positions[index].top+'%';
      if(alphabetLevel==='extra')button.style.fontSize=sizes[Math.floor(Math.random()*sizes.length)]+'px';
    }
    board.append(button);
  });
}
function startAlphabetGame(){
  stopAlphabetTimer();stopAlphabetMotion();cancelAlphabetSpeech();
  const finish=document.getElementById('alphabetFinish');
  if(finish)finish.hidden=true;
  alphabetExpectedIndex=0;alphabetElapsed=0;alphabetLastOrder=shuffleAlphabet(ALPHABET_LETTERS);
  const time=document.getElementById('alphabetTime');
  if(time)time.textContent='0.00';
  const nextLetter=document.getElementById('alphabetNextLetter');
  if(nextLetter)nextLetter.textContent='A';
  setAlphabetPhase('play');renderAlphabetBoard();
  alphabetStartedAt=performance.now();alphabetTimerFrame=requestAnimationFrame(updateAlphabetTimer);
  if(alphabetLevel==='legend')requestAnimationFrame(()=>startAlphabetMotion());
  if(alphabetLevel==='easy')setTimeout(()=>speakAlphabetPrompt('A'),140);
}
function showAlphabetWrong(event){
  const board=document.getElementById('alphabetBoard');
  if(!board)return;
  const rect=board.getBoundingClientRect();
  const marker=document.createElement('span');marker.className='alphabet-wrong';marker.textContent='×';
  marker.style.left=Math.max(28,Math.min(rect.width-28,event.clientX-rect.left))+'px';
  marker.style.top=Math.max(28,Math.min(rect.height-28,event.clientY-rect.top))+'px';
  board.append(marker);setTimeout(()=>marker.remove(),520);
}
function finishAlphabetGame(){
  alphabetElapsed=(performance.now()-alphabetStartedAt)/1000;stopAlphabetTimer();stopAlphabetMotion();cancelAlphabetSpeech();alphabetPhase='finished';
  const time=document.getElementById('alphabetTime');
  if(time)time.textContent=alphabetElapsed.toFixed(2);
  const result=document.getElementById('alphabetFinishTime');
  if(result)result.textContent=alphabetElapsed.toFixed(2)+' sec';
  const finish=document.getElementById('alphabetFinish');
  if(finish)finish.hidden=false;
  alphabetTone('finish');
}
function chooseAlphabetLetter(letter,button,event){
  if(alphabetPhase!=='play')return;
  const expected=ALPHABET_LETTERS[alphabetExpectedIndex];
  if(letter!==expected){alphabetTone('wrong');showAlphabetWrong(event);return}
  alphabetTone('correct');button.classList.add('gone');alphabetExpectedIndex++;
  if(alphabetExpectedIndex>=ALPHABET_LETTERS.length){finishAlphabetGame();return}
  const nextLetter=document.getElementById('alphabetNextLetter');
  const next=ALPHABET_LETTERS[alphabetExpectedIndex];
  if(nextLetter)nextLetter.textContent=next;
  if(alphabetLevel==='easy')setTimeout(()=>{
    if(alphabetPhase==='play'&&ALPHABET_LETTERS[alphabetExpectedIndex]===next)speakAlphabetPrompt(next);
  },140);
}
function openAlphabetTouch(options={}){
  alphabetLevel=normalizeAlphabetLevel(options.level||alphabetLevel);
  alphabetSharedMode=Boolean(options.shared);
  alphabetReturnPage=options.returnPage||'lt1unit';
  document.querySelectorAll('[data-alphabet-level]').forEach(button=>button.classList.toggle('selected',button.dataset.alphabetLevel===alphabetLevel));
  updateAlphabetSoundButton();setAlphabetPhase('setup');show('alphabetTouch');
}
function backFromAlphabet(){
  if(alphabetPhase!=='setup'){setAlphabetPhase('setup');return}
  if(alphabetSharedMode)return;
  show(alphabetReturnPage||'lt1unit');
}
function encodeAlphabetShare(){
  const payload={v:1,g:'at',m:'upper',l:alphabetLevel};
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}
function decodeAlphabetShare(value){
  const payload=JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
  if(payload?.v!==1||payload?.g!=='at')throw new Error('未対応の配布URLです');
  return {level:normalizeAlphabetLevel(payload.l),mode:'upper'};
}
function buildAlphabetShareUrl(){
  const base=location.origin&&location.origin!=='null'?location.origin+location.pathname:location.href.split('#')[0];
  return base+'#alphabet='+encodeAlphabetShare();
}
function openAlphabetShare(){
  const modal=document.getElementById('rouletteShareModal');
  const qrRoot=document.getElementById('rouletteShareQr');
  if(!modal||!qrRoot)return;
  currentRouletteShareUrl=buildAlphabetShareUrl();
  document.getElementById('rouletteShareGameName').textContent='ALPHABET TOUCH';
  document.getElementById('rouletteShareStatus').textContent='';
  try{
    if(typeof qrcode!=='function')throw new Error('QRコード機能を読み込めませんでした');
    const qr=qrcode(0,'L');qr.addData(currentRouletteShareUrl);qr.make();qrRoot.innerHTML=qr.createSvgTag(6,4);
  }catch(error){qrRoot.innerHTML='<p>QRコードを作成できませんでした。<br>「URLをコピーする」をお使いください。</p>'}
  modal.hidden=false;requestAnimationFrame(()=>document.getElementById('rouletteCopyUrl')?.focus());
}
function openSharedAlphabetFromHash(){
  const match=location.hash.match(/^#alphabet=([A-Za-z0-9_-]+)$/);
  if(!match)return false;
  try{
    const config=decodeAlphabetShare(match[1]);
    openAlphabetTouch({level:config.level,shared:true,returnPage:'home'});return true;
  }catch(error){
    console.warn('ALPHABET TOUCHの配布URLを読み込めませんでした',error);
    history.replaceState(null,'',location.pathname+location.search);alphabetSharedMode=false;return false;
  }
}
function openSharedGameFromHash(){
  if(location.hash.startsWith('#play='))return openSharedRouletteFromHash();
  if(location.hash.startsWith('#alphabet='))return openSharedAlphabetFromHash();
  return false;
}
document.querySelectorAll('[data-alphabet-level]').forEach(button=>button.addEventListener('click',()=>{
  alphabetLevel=normalizeAlphabetLevel(button.dataset.alphabetLevel);
  document.querySelectorAll('[data-alphabet-level]').forEach(option=>option.classList.toggle('selected',option===button));
}));
document.getElementById('alphabetStart')?.addEventListener('click',startAlphabetGame);
document.getElementById('alphabetBack')?.addEventListener('click',backFromAlphabet);
document.getElementById('alphabetSound')?.addEventListener('click',()=>{
  alphabetSoundEnabled=!alphabetSoundEnabled;updateAlphabetSoundButton();
  if(!alphabetSoundEnabled)cancelAlphabetSpeech();
  else if(alphabetLevel==='easy'&&alphabetPhase==='play')speakAlphabetPrompt(ALPHABET_LETTERS[alphabetExpectedIndex]);
});
document.getElementById('alphabetBoard')?.addEventListener('click',event=>{
  const button=event.target.closest('[data-alphabet-letter]');if(button)chooseAlphabetLetter(button.dataset.alphabetLetter,button,event);
});
document.getElementById('alphabetRetry')?.addEventListener('click',startAlphabetGame);
document.getElementById('alphabetToSetup')?.addEventListener('click',()=>setAlphabetPhase('setup'));
