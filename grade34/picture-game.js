window.PictureGame = (() => {
  function heading(title,controls='') {
    // Titles supplied by game modules, never by shared URL data.
    const center=controls?`<div class="game-heading-center"><h1>${title}</h1>${controls}</div>`:`<h1>${title}</h1>`;
    return `<header class="game-heading"><button class="back-button" data-feature="close" aria-label="戻る"><img src="assets/ui/originals/戻る.svg" alt=""></button>${center}<button class="fullscreen-button" data-fullscreen aria-label="全画面表示切り替え">⛶</button></header>`;
  }
  async function preload(items,sourceFor) {
    await Promise.all([...new Set(items.map(sourceFor).filter(Boolean))].map(source=>new Promise(resolve=>{
      const image=new Image();let fallback=false;
      const timeout=setTimeout(resolve,5000);
      const done=()=>{clearTimeout(timeout);resolve();};
      image.onload=()=>{if(image.decode)image.decode().catch(()=>{}).then(done);else done();};
      image.onerror=()=>{if(!fallback&&source.includes('/assets/cards/')){fallback=true;image.src='assets/cards/'+source.split('/assets/cards/')[1];}else done();};
      image.src=source;
    })));
  }
  return {heading,preload};
})();
