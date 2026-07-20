(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CircleMixCmixLocalInstall=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  function versionParts(value){ return String(value||'0').split('.').map(part=>Number(part)); }
  function compareVersions(a,b){ const aa=versionParts(a),bb=versionParts(b),length=Math.max(aa.length,bb.length); for(let i=0;i<length;i++){const d=(aa[i]||0)-(bb[i]||0);if(d)return d>0?1:-1;} return 0; }
  function recordFromPackage(pkg, now=new Date().toISOString()){
    const manifest=pkg?.manifest;
    if(!manifest || manifest.packageType!=='full' || !(pkg.audioBlob instanceof Blob)) throw new Error('FULL .cmix package with audio is required.');
    const difficulties=Object.create(null), charts=Object.create(null);
    for(const descriptor of manifest.charts||[]){
      const chart=pkg.charts?.[descriptor.file];
      if(!chart || !Array.isArray(chart.notes)) throw new Error(`Validated chart is missing: ${descriptor.id}`);
      charts[descriptor.id]=chart;
      difficulties[descriptor.id]={label:descriptor.name,chart:descriptor.id,level:descriptor.level,style:descriptor.style||null,stars:Number.isFinite(Number(descriptor.level))?Number(descriptor.level):undefined};
    }
    if(!Object.keys(charts).length) throw new Error('The package has no playable charts.');
    return {id:manifest.id,source:'local',cmixInstalled:true,title:manifest.title,artist:manifest.artist,bpm:manifest.bpm,offset:manifest.offset||0,previewStart:manifest.preview?.startSeconds||0,previewDuration:manifest.preview?.durationSeconds||15,audioBlob:pkg.audioBlob,audioType:pkg.audioBlob.type||null,jacketBlob:pkg.jacketBlob||null,difficulties,charts,packageType:manifest.packageType,packageVersion:manifest.packageVersion,packageHash:pkg.packageHash||null,sourceFileName:pkg.sourceFileName||null,installedAt:now,updatedAt:now};
  }
  function replacementInfo(existing,incoming){
    if(!existing)return {kind:'new',message:'NEW INSTALL'};
    const removed=Object.keys(existing.charts||{}).filter(id=>!Object.prototype.hasOwnProperty.call(incoming.charts||{},id));
    const comparison=existing.packageVersion?compareVersions(incoming.packageVersion,existing.packageVersion):null;
    if(comparison===1)return {kind:'upgrade',removed,message:'A newer package will replace the existing local song.'};
    if(comparison===null)return {kind:'editor-conflict',removed,message:'An editor-created local song uses this ID and has no package version.'};
    return {kind:'replace',removed,message:'This package version is the same or older than the installed version.'};
  }
  return Object.freeze({compareVersions,recordFromPackage,replacementInfo});
});
