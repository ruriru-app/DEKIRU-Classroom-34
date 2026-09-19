// Preserve the existing responsive header; size the scene to the space beneath it.
(()=>{const header=document.getElementById('app-header');if(!header)return;
const measure=()=>document.documentElement.style.setProperty('--home-header-height',header.getBoundingClientRect().height+'px');
new ResizeObserver(measure).observe(header);measure();})();
