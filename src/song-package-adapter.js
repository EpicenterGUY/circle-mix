/* Adapts SongRecord to the existing v1 exporter; it deliberately does not write ZIPs. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CircleMixSongPackageAdapter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  function difficultyIds(record){
    const available=new Set([...Object.keys(record?.difficulties||{}),...Object.keys(record?.charts||{})]), ids=[], seen=new Set();
    for(const id of [...(Array.isArray(record?.difficultyOrder)?record.difficultyOrder:[]),...Object.keys(record?.difficulties||{}),...Object.keys(record?.charts||{})]){
      if(typeof id==='string'&&available.has(id)&&!seen.has(id)){seen.add(id);ids.push(id);}
    }
    return ids;
  }
  function chartEntries(record){
    if(!record) throw new Error('SongRecord is required.');
    return difficultyIds(record).map(id=>{const d=record.difficulties?.[id]||{},raw=record.charts?.[id]||d.chartData||d.chart;if(!raw||!Array.isArray(raw.notes))throw new Error(`Chart is unavailable: ${id}`);return {descriptor:{id,name:d.label||d.name||id,level:Number(d.level??d.stars??1),...(d.style?{style:d.style}:{}),...(d.author?{author:d.author}:{})},chart:clone(raw)};});
  }
  function song(record){return {id:record.id,title:record.title,artist:record.artist,bpm:Number(record.bpm),offset:Number(record.offset)||0,packageVersion:Number(record.packageVersion)||1,preview:record.preview||undefined};}
  function songRecordToChartPackageInput(record,audioMatch){const match=audioMatch||record.audioMatch||record.audioMetadata?.audioMatch;if(!match?.durationSeconds)throw new Error('A valid local audio duration is required for CHART export.');return {song:{...song(record),audioMatch:clone(match)},charts:chartEntries(record),...(record.jacketBlob?{jacket:{blob:record.jacketBlob,name:record.jacketName||'jacket.png'}}:{})};}
  function songRecordToFullPackageInput(record){if(!(record.audioBlob instanceof Blob)||!record.audioBlob.size)throw new Error('FULL export requires stored audio.');const metadata=record.audioMetadata||{},duration=Number(metadata.duration||record.actualDuration||record.duration);if(!duration)throw new Error('FULL export requires decoded audio duration.');return {song:song(record),charts:chartEntries(record),audio:{blob:record.audioBlob,name:record.localAudioFileName||record.audioFileName||`audio.${metadata.extension||'mp3'}`},audioMetadata:{duration},...(record.jacketBlob?{jacket:{blob:record.jacketBlob,name:record.jacketName||'jacket.png'}}:{})};}
  return Object.freeze({difficultyIds,chartEntries,songRecordToChartPackageInput,songRecordToFullPackageInput});
});
