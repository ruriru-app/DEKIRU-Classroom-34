(() => {
  'use strict';
  const KEY='dekiru.grade34.cardSets.v1';
  function read(){
    try {
      const raw=localStorage.getItem(KEY);
      if(!raw)return [];
      const value=JSON.parse(raw);
      if(value.v!==1||!Array.isArray(value.sets)||value.sets.some(s=>!s||typeof s.id!=='string'||typeof s.unit!=='string'||typeof s.name!=='string'||!s.payload))throw Error();
      return value.sets;
    }catch{throw new Error('保存済みセットを読み込めません。ブラウザの保存設定をご確認ください。');}
  }
  function write(sets){
    try{localStorage.setItem(KEY,JSON.stringify({v:1,sets}));}
    catch{throw new Error('保存できませんでした。ブラウザの保存容量・設定をご確認ください。');}
  }
  function list(unit){return read().filter(s=>s.unit===unit);}
  function save(unit,name,payload){
    name=String(name).trim();
    if(!name||name.length>60)throw new Error('セット名を1〜60文字で入力してください。');
    CardSet.resolve(payload);
    const sets=read();
    if(sets.some(s=>s.unit===unit&&s.name===name))throw new Error('同じ名前のセットがあります。別の名前を付けてください。');
    const set={id:crypto.randomUUID(),unit,name,payload:JSON.parse(JSON.stringify(payload))};
    write([...sets,set]);return set;
  }
  function remove(unit,id){write(read().filter(s=>s.unit!==unit||s.id!==id));}
  window.SavedCardSets={list,save,remove};
})();
