/* Canonical, source-aware song model shared by bundled and IndexedDB songs. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CircleMixSongRecord=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  const SOURCE_BUNDLED='bundled', SOURCE_LOCAL='local';
  const sourceOf=value=>value==='local'?SOURCE_LOCAL:SOURCE_BUNDLED;
  const keyOf=identity=>{const source=sourceOf(identity?.source);const id=String(identity?.id||'').trim();return id?`${source}:${id}`:null;};
  function appendValid(order, ids, available, seen){
    for(const id of ids||[]){
      if(typeof id!=='string'||!available.has(id)||seen.has(id)) continue;
      seen.add(id); order.push(id);
    }
  }
  function numericDifficulty(value){
    if(Number.isFinite(Number(value)))return Number(value);
    const text=String(value??'').trim();
    const match=text.match(/-?\d+(?:\.\d+)?/);
    if(!match)return null;
    const base=Number(match[0]);
    return Number.isFinite(base)?base+(text.includes('+')?.5:0):null;
  }
  const NAME_RANK=Object.freeze({
    tutorial:0,beginner:10,basic:10,novice:10,easy:10,
    normal:20,standard:20,
    advanced:30,hard:30,
    expert:40,hyper:40,
    master:50,another:50,
    extra:60,append:60,reverb:60
  });
  function difficultySortValue(id,meta={},chart={}){
    for(const value of [meta.stars,meta.declaredStars,meta.level,meta.rating,meta.difficulty,chart.stars,chart.level,chart.rating,chart.difficulty]){
      const numeric=numericDifficulty(value);
      if(numeric!==null)return {group:0,value:numeric};
    }
    const words=`${id} ${meta.label||''} ${meta.name||''}`.toLowerCase().replace(/[^a-z0-9]+/g,' ');
    for(const [name,rank] of Object.entries(NAME_RANK))if(words.split(' ').includes(name))return {group:1,value:rank};
    return {group:2,value:0};
  }
  function sortLocalDifficultyOrder(order,rawDiffs={},charts={}){
    return order.map((id,index)=>({id,index,key:difficultySortValue(id,rawDiffs[id]||{},charts[id]||{})})).sort((a,b)=>a.key.group-b.key.group||a.key.value-b.key.value||a.index-b.index).map(entry=>entry.id);
  }
  // Bundled songs retain authored order. LOCAL songs are presented from easiest to hardest.
  function resolveDifficultyOrder(record, rawDiffs=record?.difficulties||{}, charts=record?.charts||{}, source=record?.source){
    const available=new Set([...Object.keys(rawDiffs),...Object.keys(charts)]), order=[], seen=new Set();
    const explicit=Array.isArray(record?.difficultyOrder) ? record.difficultyOrder : (Array.isArray(record?.manifestChartOrder) ? record.manifestChartOrder : null);
    appendValid(order,explicit||Object.keys(rawDiffs),available,seen);
    appendValid(order,Object.keys(rawDiffs),available,seen);
    appendValid(order,Object.keys(charts),available,seen);
    return sourceOf(source)===SOURCE_LOCAL?sortLocalDifficultyOrder(order,rawDiffs,charts):order;
  }
  function normalize(record, source){
    if(!record || !String(record.id||'').trim()) return null;
    const actual=sourceOf(source || record.source), rawDiffs=record.difficulties||{}, bpm=Number(record.bpm)||0, rawCharts=record.charts||{};
    const charts=Object.fromEntries(Object.entries(rawCharts).map(([id,chart])=>[id,chart&&typeof chart==='object'&&!Array.isArray(chart)&&bpm>0&&!Number.isFinite(Number(chart.bpm))?{...chart,bpm}:chart]));
    const difficultyOrder=resolveDifficultyOrder(record,rawDiffs,charts,actual);
    const difficulties=difficultyOrder.reduce((out,id)=>{const meta=rawDiffs[id]||{},chart=charts[id];out[id]={...meta,id,chart:meta.chart,notes:chart?.notes||meta.notes};return out;},{});
    return {...record, id:String(record.id), source:actual, origin:actual, title:String(record.title||''), titleUnicode:record.titleUnicode||null, artist:String(record.artist||''), bpm, offset:Number(record.offset)||0, preview:record.preview || (record.previewStart!==undefined?{startSeconds:Number(record.previewStart)||0,durationSeconds:Number(record.previewDuration)||15}:null), jacket:record.jacket||null, audio:record.audio||null, audioBlob:record.audioBlob||null, audioStorageKey:record.audioStorageKey||null, audioMetadata:record.audioMetadata||null, packageType:record.packageType||null, packageVersion:record.packageVersion||null, charts, difficultyOrder, difficulties, installedAt:record.installedAt||null, updatedAt:record.updatedAt||null, exportable:true, removable:actual===SOURCE_LOCAL, restorable:actual===SOURCE_LOCAL, bundled:actual===SOURCE_BUNDLED, local:actual===SOURCE_LOCAL};
  }
  return Object.freeze({SOURCE_BUNDLED,SOURCE_LOCAL,sourceOf,keyOf,numericDifficulty,difficultySortValue,sortLocalDifficultyOrder,resolveDifficultyOrder,normalize});
});
