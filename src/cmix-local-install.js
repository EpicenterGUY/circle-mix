(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CircleMixCmixLocalInstall=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  function versionParts(value){ return String(value||'0').split('.').map(part=>Number(part)); }
  function compareVersions(a,b){ const aa=versionParts(a),bb=versionParts(b),length=Math.max(aa.length,bb.length); for(let i=0;i<length;i++){const d=(aa[i]||0)-(bb[i]||0);if(d)return d>0?1:-1;} return 0; }
  function recordFromPackage(pkg, now=new Date().toISOString()){
    const manifest=pkg?.manifest;
    if(!manifest || manifest.packageType!=='full' || !(pkg.audioBlob instanceof Blob)) throw new Error('FULL .cmix package with audio is required.');
    const difficulties=Object.create(null), charts=Object.create(null), difficultyOrder=[], songBpm=Number(manifest.bpm)||0;
    for(const descriptor of manifest.charts||[]){
      difficultyOrder.push(descriptor.id);
      const chart=pkg.charts?.[descriptor.file];
      if(!chart || !Array.isArray(chart.notes)) throw new Error(`Validated chart is missing: ${descriptor.id}`);
      charts[descriptor.id]=Number.isFinite(Number(chart.bpm))&&Number(chart.bpm)>0?chart:{...chart,bpm:songBpm};
      difficulties[descriptor.id]={label:descriptor.name,chart:descriptor.id,level:descriptor.level,style:descriptor.style||null,declaredStars:Number.isFinite(Number(descriptor.stars??descriptor.level))?Number(descriptor.stars??descriptor.level):undefined,stars:Number.isFinite(Number(descriptor.level))?Number(descriptor.level):undefined};
    }
    if(!Object.keys(charts).length) throw new Error('The package has no playable charts.');
    return {id:manifest.id,source:'local',cmixInstalled:true,title:manifest.title,artist:manifest.artist,bpm:manifest.bpm,offset:manifest.offset||0,previewStart:manifest.preview?.startSeconds||0,previewDuration:manifest.preview?.durationSeconds||15,audioBlob:pkg.audioBlob,audioType:pkg.audioBlob.type||null,audioMetadata:{duration:pkg.manifest.audioMetadata?.duration||pkg.manifest.duration||0},jacketBlob:pkg.jacketBlob||null,difficultyOrder,difficulties,charts,packageType:manifest.packageType,packageVersion:manifest.packageVersion,packageHash:pkg.packageHash||null,sourceFileName:pkg.sourceFileName||null,installedAt:now,updatedAt:now};
  }
  function recordFromChartPackage(pkg,linked,now=new Date().toISOString()){
    if(pkg?.manifest?.packageType!=='chart'||!(linked?.blob instanceof Blob)) throw new Error('Validated CHART package and local audio are required.');
    const base=recordFromPackage({...pkg,manifest:{...pkg.manifest,packageType:'full'},audioBlob:linked.blob},now), match=pkg.manifest.audioMatch||{};
    return {...base,packageType:'chart',audioBlob:linked.blob,audioMatch:match,audioMetadata:{duration:linked.duration,extension:String(linked.fileName||'').split('.').pop()},audioType:linked.audioType||linked.blob.type||null,linkedAudio:true,localAudioFileName:String(linked.fileName||'').split(/[\/]/).pop(),actualDuration:linked.duration,actualSha256:linked.sha256||null,expectedDuration:match.durationSeconds,durationTolerance:linked.tolerance,expectedSha256:match.sha256||null,matchMethod:linked.matchMethod,hashOverride:Boolean(linked.hashOverride)};
  }
  function replacementInfo(existing,incoming){
    if(!existing)return {kind:'new',message:'NEW INSTALL'};
    const removed=Object.keys(existing.charts||{}).filter(id=>!Object.prototype.hasOwnProperty.call(incoming.charts||{},id));
    const comparison=existing.packageVersion?compareVersions(incoming.packageVersion,existing.packageVersion):null;
    if(comparison===1)return {kind:'upgrade',removed,message:'A newer package will replace the existing local song.'};
    if(comparison===null)return {kind:'editor-conflict',removed,message:'An editor-created local song uses this ID and has no package version.'};
    return {kind:'replace',removed,message:'This package version is the same or older than the installed version.'};
  }
  return Object.freeze({compareVersions,recordFromPackage,recordFromChartPackage,replacementInfo});
});
