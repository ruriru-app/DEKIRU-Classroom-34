(function(root){
  'use strict';
  const M=root.InterviewModel||(typeof require==='function'?require('./interview-model.js'):null);
  function create(storage){
    const keys={presets:'dekiru-interview-presets-v1',rosters:'dekiru-class-rosters-v1'};
    const R=root.ClassRoster||(typeof require==='function'?require('./class-roster.js'):null);
    const validate={presets:M.validatePreset,rosters:v=>v?.version===2?R.validate(v):M.validateRoster(v)};
    function read(kind){
      try{const raw=storage.getItem(keys[kind]);if(raw===null)return [];const rows=JSON.parse(raw);M.array(rows,500,'保存データ');const clean=rows.map(v=>validate[kind](v));M.unique(clean.map(v=>v.id),'保存ID');return clean;}
      catch{throw new Error('保存データを読み込めません。既存データは上書きせず保持しています。');}
    }
    function write(kind,rows){try{storage.setItem(keys[kind],JSON.stringify(rows));}catch{throw new Error('保存できませんでした。ブラウザの保存容量や設定を確認してください。');}}
    function save(kind,value){
      const clean=validate[kind](value),rows=read(kind),index=rows.findIndex(r=>r.id===clean.id);
      if(kind==='rosters'&&clean.version===2&&index>=0&&rows[index].version===1){
        try{const backup='dekiru-class-rosters-backup-v1';if(storage.getItem(backup)===null)storage.setItem(backup,storage.getItem(keys.rosters));}
        catch{throw new Error('旧名簿のバックアップを保存できませんでした。元の名簿は変更していません。');}
      }
      if(index<0){M.check(rows.length<500,'保存件数が上限です');rows.push(clean);}else rows[index]=clean;write(kind,rows);return clean;
    }
    function remove(kind,id){const rows=read(kind);write(kind,rows.filter(r=>r.id!==id));}
    return {listPresets:()=>read('presets'),savePreset:v=>save('presets',v),deletePreset:id=>remove('presets',id),listRosters:()=>read('rosters'),saveRoster:v=>save('rosters',v),deleteRoster:id=>remove('rosters',id)};
  }
  const api={create};root.InterviewStore=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
