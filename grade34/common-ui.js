/* Shared English typography and navigation artwork. Keep navigation handlers intact. */
(()=>{
  const base=new URL('.',document.currentScript?.src||location.href);
  const style=document.createElement('style');
  style.textContent=`
@font-face{font-family:'DEKIRU Andika';src:url('${new URL('assets/ui/fonts/Andika-Regular.ttf',base)}') format('truetype');font-style:normal;font-weight:400;font-display:swap}
@font-face{font-family:'DEKIRU Andika';src:url('${new URL('assets/ui/fonts/Andika-Bold.ttf',base)}') format('truetype');font-style:normal;font-weight:700;font-display:swap}
html body,html body *:not(svg):not(svg *),html body svg text{font-family:'DEKIRU Andika','Yu Gothic','Hiragino Kaku Gothic ProN',sans-serif!important}
html body .classroom-back{box-sizing:border-box!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:none!important;width:var(--back-size,44px)!important;height:var(--back-size,44px)!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;line-height:1!important;overflow:hidden!important;cursor:pointer}
html body .classroom-back[hidden]{display:none!important}
html body .classroom-back::before,html body .classroom-back::after{content:none!important;display:none!important}
html body .classroom-back>img{display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;object-fit:contain!important;pointer-events:none}
html body .classroom-back:focus-visible{outline:3px solid #669bcf;outline-offset:3px}
`;
  document.head.append(style);
  const artwork=new URL('assets/ui/originals/戻る.svg',base).href;
  const selector='button[aria-label*="戻る"],a[aria-label*="戻る"]:not(.brand),button[data-back],button.back-button,button.sidebar-back-button,#close-practice,#alphabetBack,#rouletteBack';
  function normalize(){
    document.querySelectorAll(selector).forEach(button=>{
      if(button.classList.contains('classroom-back'))return;
      const size=parseFloat(getComputedStyle(button).height);
      button.style.setProperty('--back-size',Math.max(40,Math.min(60,Number.isFinite(size)?size:44))+'px');
      if(!button.getAttribute('aria-label'))button.setAttribute('aria-label','戻る');
      const img=document.createElement('img');img.src=artwork;img.alt='';
      button.replaceChildren(img);button.classList.add('classroom-back');
    });
  }
  function normalizeArtwork(){
    normalize();
    document.querySelectorAll('button img').forEach(img=>{
      const button=img.closest('button');if(button.classList.contains('classroom-art-button'))return;
      const src=decodeURI(img.src),paired=src.includes('音声ONOFFと読み方.svg')||button.matches('.clock-icon-control'),speaker=src.normalize('NFC').includes('読み上げボタン.svg')||button.matches('#speak.speaker');
      if(!paired&&!speaker)return;
      const second=!!img.closest('.second'),height=Math.max(32,Math.min(64,button.getBoundingClientRect().height||44));
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox',paired?(second?'569.202 0 535.548 382.178':'0 0 535.549 382.178'):'0 0 430 430');svg.setAttribute('aria-hidden','true');
      const art=document.createElementNS(svg.namespaceURI,'image');art.setAttribute('href',img.src);art.setAttribute('width',paired?'1105':'430');art.setAttribute('height',paired?'383':'430');svg.append(art);
      button.style.setProperty('--art-height',height+'px');button.style.setProperty('--art-width',(height*(paired?535.549/382.178:1))+'px');
      button.classList.add('classroom-art-button');if(speaker)button.classList.add('classroom-art-round');button.replaceChildren(svg);
    });
  }
  style.textContent+=`
html body .classroom-art-button{box-sizing:border-box!important;display:inline-flex!important;flex:none!important;align-items:center!important;justify-content:center!important;width:var(--art-width)!important;height:var(--art-height)!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;overflow:hidden!important;border-radius:0!important;clip-path:inset(0 round 16.7%);cursor:pointer}
html body .classroom-art-round{clip-path:circle(50%)}
html body .classroom-art-button>svg{display:block;width:100%;height:100%;pointer-events:none}
html body .classroom-art-button[aria-pressed=false]>svg{opacity:.45;filter:grayscale(.8)}
html body .classroom-art-button:focus-visible{outline:3px solid #5189be;outline-offset:-3px}
`;
  normalizeArtwork();
  new MutationObserver(normalizeArtwork).observe(document.documentElement,{childList:true,subtree:true});
})();
