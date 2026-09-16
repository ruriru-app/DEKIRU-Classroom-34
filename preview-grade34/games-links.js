// Link-only integration. Game engines and authoring stay in DEKIRU Games.
window.GamesLinks=(()=>{
  const base=new URL(location.protocol==='file:'?'../games_site/':'../games/',location.href);
  const encode=value=>btoa(Array.from(new TextEncoder().encode(JSON.stringify(value)),b=>String.fromCharCode(b)).join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  const alphabet=()=>new URL('#alphabet='+encode({v:1,g:'at',m:'upper',l:'easy'}),base).href;
  function assigned(book,unit){
    try{
      const saved=JSON.parse(localStorage.getItem('dekiru-created-games-v1')||'[]');
      if(!Array.isArray(saved))return [];
      return saved.filter(g=>g?.gameType==='roulette-race'&&Array.isArray(g.assignedUnits)&&g.assignedUnits.includes(book+':'+unit)&&Array.isArray(g.selectedCardIds)&&g.selectedCardIds.length).map(g=>{
        const ids=window.GAMES_CARD_ORDER||[],selected=new Set(g.selectedCardIds),bytes=new Uint8Array(Math.ceil(ids.length/8));
        ids.forEach((id,i)=>{if(selected.has(id))bytes[i>>3]|=1<<(i&7);});
        const w=btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
        const d=g.display||{};
        const token=encode({v:1,g:'rr',n:g.name,c:g.cardCount,e:g.everybodySentence,s:g.selectedSentence,u:g.assignedUnits,a:g.audiences,d:(d.picture!==false?'1':'0')+(d.english!==false?'1':'0')+(d.japanese===true?'1':'0'),w});
        return {name:g.name||'ROULETTE RACE',url:new URL('#play='+token,base).href,audiences:g.audiences?.length?g.audiences:['individual']};
      });
    }catch{return [];}
  }
  return {alphabet,assigned,home:base.href};
})();
