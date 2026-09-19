(function(root){
  'use strict';
  const M=root.InterviewModel||(typeof require==='function'?require('./interview-model.js'):null);
  function create(storage){
    const keys={presets:'dekiru-interview-presets-v1',rosters:'dekiru-class-rosters-v1'};
    const validate={presets:M.validatePreset,rosters:M.validateRoster};
    function read(kind){
      try{const raw=storage.getItem(keys[kind]);if(raw===null)return [];const rows=JSON.parse(raw);M.array(rows,500,'保存データ');const clean=rows.map(v=>validate[kind](v));M.unique(clean.map(v=>v.id),'保存ID');return clean;}
      catch{throw new Error('保存データを読み込めません。既存データは上書きせず保持しています。');}
    }
    function write(kind,rows){try{storage.setItem(keys[kind],JSON.stringify(rows));}catch{throw new Error('保存できませんでした。ブラウザの保存容量や設定を確認してください。');}}
    function save(kind,value){const clean=validate[kind](value),rows=read(kind),index=rows.findIndex(r=>r.id===clean.id);if(index<0){M.check(rows.length<500,'保存件数が上限です');rows.push(clean);}else rows[index]=clean;write(kind,rows);return clean;}
    function remove(kind,id){const rows=read(kind);write(kind,rows.filter(r=>r.id!==id));}
    return {listPresets:()=>read('presets'),savePreset:v=>save('presets',v),deletePreset:id=>remove('presets',id),listRosters:()=>read('rosters'),saveRoster:v=>save('rosters',v),deleteRoster:id=>remove('rosters',id)};
  }
  const api={create};root.InterviewStore=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
