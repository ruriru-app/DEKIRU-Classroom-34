window.InterviewLinks=(()=>{
 'use strict';
 const base=new URL('.',document.currentScript.src),M=window.InterviewModel;
 let error='';
 function get(id,source){M.check(source==='local'||source==='published','保存先の指定が不正です');const rows=source==='local'?InterviewStore.create(localStorage).listPresets():(window.INTERVIEW_CATALOG||[]);const p=rows.find(p=>p.id===id);M.check(p,'プリセットが見つかりません。同じブラウザで保存したものか確認してください。');return M.validatePreset(p);}
 function assigned(bookId,unit){error='';let local=[];try{local=InterviewStore.create(localStorage).listPresets();}catch(e){error=e.message;}
 const results=[];for(const [source,rows] of [['published',window.INTERVIEW_CATALOG||[]],['local',local]])for(const value of rows){try{const p=M.validatePreset(value);if(!p.assignedUnits.some(u=>u.bookId===bookId&&u.unit===Number(unit)))continue;const url=new URL('interview.html',base);url.search=new URLSearchParams({preset:p.id,source,book:bookId,unit:String(unit)}).toString();results.push({id:p.id,title:p.name,description:p.description,href:url.href,source});}catch(e){error=e.message;}}return results;
 }
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function tiles(book,unit){const rows=assigned(book,unit);return rows.map(p=>`<article class="feature-tile activity static-tile"><div class="feature-tile-heading"><span class="tile-mark">Interview</span><strong>${esc(p.title)}</strong></div><p>${esc(p.description)}</p><small>${p.source==='local'?'このブラウザに保存したプリセット':'公開プリセット'}</small><a class="primary-button" href="${esc(p.href)}">${esc(p.title)}を準備</a></article>`).join('')+(error?`<p role="status">Interview: ${esc(error)}</p>`:'');}
 return {get,assigned,tiles};
})();
