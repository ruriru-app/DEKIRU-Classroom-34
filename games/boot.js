document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>show(b.dataset.to)));
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.back||'home')));
document.getElementById('homeBtn').addEventListener('click',()=>{history.replaceState(null,'','#/');show('home');});
document.querySelector('[data-launch-alphabet]').addEventListener('click',()=>openAlphabetTouch({returnPage:'home'}));
document.getElementById('alphabetDistribute').addEventListener('click',openAlphabetShare);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(alphabetPhase==='play')setAlphabetPhase('setup');stopRouletteGame();}});
loadCreatedGames();renderCreatedGames();setCreatorForm(null);
if(!openSharedGameFromHash()){
  if(location.hash==='#/alphabetTouch')openAlphabetTouch({returnPage:'home'});
  else show(location.hash==='#/createGames'?'createGames':'home');
}
