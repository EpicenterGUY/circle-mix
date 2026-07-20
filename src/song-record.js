/* Canonical, source-aware song model shared by bundled and IndexedDB songs. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CircleMixSongRecord=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  const SOURCE_BUNDLED='bundled', SOURCE_LOCAL='local';
  const sourceOf=value=>value==='local'?SOURCE_LOCAL:SOURCE_BUNDLED;
  const keyOf=identity=>{const source=sourceOf(identity?.source);const id=String(identity?.id||'').trim();return id?`${source}:${id}`:null;};
  function normalize(record, source){
    if(!record || !String(record.id||'').trim()) return null;
    const actual=sourceOf(source || record.source);
    const rawDiffs=record.difficulties || {};
    const charts=record.charts || {};
    const difficulties=Object.keys(rawDiffs).sort().reduce((out,id)=>{const meta=rawDiffs[id]||{},chart=charts[id];out[id]={...meta,id,chart:meta.chart,notes:chart?.notes||meta.notes};return out;},{});
    return {...record, id:String(record.id), source:actual, origin:actual, title:String(record.title||''), titleUnicode:record.titleUnicode||null, artist:String(record.artist||''), bpm:Number(record.bpm)||0, offset:Number(record.offset)||0, preview:record.preview || (record.previewStart!==undefined?{startSeconds:Number(record.previewStart)||0,durationSeconds:Number(record.previewDuration)||15}:null), jacket:record.jacket||null, audio:record.audio||null, audioBlob:record.audioBlob||null, audioStorageKey:record.audioStorageKey||null, audioMetadata:record.audioMetadata||null, packageType:record.packageType||null, packageVersion:record.packageVersion||null, difficulties, installedAt:record.installedAt||null, updatedAt:record.updatedAt||null, exportable:true, removable:actual===SOURCE_LOCAL, restorable:actual===SOURCE_LOCAL, bundled:actual===SOURCE_BUNDLED, local:actual===SOURCE_LOCAL};
  }
  return Object.freeze({SOURCE_BUNDLED,SOURCE_LOCAL,sourceOf,keyOf,normalize});
});
