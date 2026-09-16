globalThis.CardPractice=(()=>{
  const layouts={'list':'一覧（横カード）','1':'１枚ずつ（横カード・縦スクロール）','3':'３枚ずつ（縦カード・縦スクロール）','5':'５枚ずつ（縦カード・縦スクロール）'};
  function create(){let ranks=new Map();return {
    layout:'list',order:'ordered',
    configure(key,value){if(key==='layout'&&layouts[value])this.layout=value;if(key==='order'&&['ordered','random'].includes(value)){this.order=value;ranks=new Map();}},
    arrange(items){if(this.order==='ordered')return [...items];for(const item of items){const key=item.id||item.letter||item.ref;if(!ranks.has(key))ranks.set(key,Math.random());}return [...items].sort((a,b)=>ranks.get(a.id||a.letter||a.ref)-ranks.get(b.id||b.letter||b.ref));},
    settings(){return `<h2>発音練習の設定</h2><label class="practice-setting">表示枚数<select data-practice-setting="layout">${Object.entries(layouts).map(([v,label])=>`<option value="${v}" ${this.layout===v?'selected':''}>${label}</option>`).join('')}</select></label><label class="practice-setting">表示方法<select data-practice-setting="order"><option value="ordered" ${this.order==='ordered'?'selected':''}>順番通り</option><option value="random" ${this.order==='random'?'selected':''}>ランダム</option></select></label>`;}
  };}
  return {create};
})();
