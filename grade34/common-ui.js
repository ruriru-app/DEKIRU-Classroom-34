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
  normalize();
  new MutationObserver(normalize).observe(document.documentElement,{childList:true,subtree:true});
})();
