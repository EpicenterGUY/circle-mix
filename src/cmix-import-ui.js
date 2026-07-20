(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  let generation = 0, jacketUrl = null, dragDepth = 0, inspectedPackage = null, installing = false;
  const dev = () => new URLSearchParams(location.search).get('dev') === '1' || localStorage.getItem('circleMixDevMode') === 'true';
  function revokeJacket(){ if(jacketUrl){ URL.revokeObjectURL(jacketUrl); jacketUrl=null; } }
  function discard(){ inspectedPackage=null; revokeJacket(); }
  function clean(){ generation++; dragDepth=0; installing=false; discard(); $('cmixDropOverlay').hidden=true; $('cmixImportModal').hidden=true; $('cmixImportContent').replaceChildren(); }
  function text(el,value){ el.textContent=String(value??''); }
  function preparePicker(input){ generation++; discard(); $('cmixImportContent').replaceChildren(); text($('cmixImportStatus'),'SELECT .CMIX PACKAGE'); $('cmixImportModal').hidden=false; input.click(); }
  function installButton(pkg){
    const button=document.createElement('button'); button.className='songPlayBtn'; button.type='button'; button.textContent='INSTALL';
    button.onclick=async()=>{
      if(installing || !pkg || pkg.manifest.packageType!=='full') return;
      installing=true; button.disabled=true; text($('cmixImportStatus'),'PREPARING INSTALL');
      try{
        const record=CircleMixCmixLocalInstall.recordFromPackage(pkg);
        let existing;
        try{ existing=await CircleMixLocalSongs.get(record.id); }catch(error){ throw new Error('IndexedDB is unavailable. Local installation could not start.'); }
        const policy=CircleMixCmixLocalInstall.replacementInfo(existing,record);
        if(existing){
          const removed=policy.removed?.length ? `\nRemoved difficulties: ${policy.removed.join(', ')}` : '';
          if(!confirm(`${policy.message}\nInstall ${record.title} v${record.packageVersion} over the existing song?${removed}`)){ text($('cmixImportStatus'),'INSTALL CANCELLED'); return; }
          record.installedAt=existing.installedAt||record.installedAt;
        }
        text($('cmixImportStatus'),'SAVING TO LOCAL LIBRARY');
        await CircleMixLocalSongs.put(record);
        await CircleMixSongRegistry.refreshLocal();
        text($('cmixImportStatus'),'INSTALL COMPLETE'); button.textContent='OPEN IN LOCAL SONGS'; button.disabled=false;
        button.onclick=async()=>{ await window.CircleMixOpenLocalSong?.(record.id); clean(); };
      }catch(error){ console.error('cmix install failed',error); text($('cmixImportStatus'),`INSTALL FAILED: ${error?.message||'IndexedDB transaction failed.'}`); button.disabled=false; }
      finally{ installing=false; }
    };
    return button;
  }
  function show(file){
    const g=++generation, modal=$('cmixImportModal'), content=$('cmixImportContent'); discard(); modal.hidden=false; content.replaceChildren(); text($('cmixImportStatus'),'READING PACKAGE');
    CircleMixCmixImporter.inspect(file,{onProgress:state=>{if(g===generation)text($('cmixImportStatus'),state);}}).then(result=>{
      if(g!==generation)return; content.replaceChildren();
      if(!result.ok){ text($('cmixImportStatus'),'PACKAGE CHECK FAILED'); const details=document.createElement('details'), summary=document.createElement('summary'); summary.textContent='ERROR DETAILS'; details.append(summary); for(const error of result.errors){const p=document.createElement('p');p.textContent=`${error.code} · ${error.path}\n${error.message}`;details.append(p);} content.append(details); return; }
      const pkg=result.package, manifest=pkg.manifest; inspectedPackage=pkg;
      const preview=document.createElement('pre'); preview.textContent=`${manifest.title}\n${manifest.artist}\n\nPACKAGE: ${manifest.packageType.toUpperCase()}\nVERSION: ${manifest.packageVersion}\nBPM: ${manifest.bpm}\nCHARTS: ${manifest.charts.length}\nAUDIO: ${manifest.packageType==='chart'?'LOCAL FILE REQUIRED':'INCLUDED'}\nSIZE: ${file.size} bytes\nSHA-256: ${pkg.packageHash||'UNAVAILABLE'}\n\n${manifest.charts.map(chart=>`${chart.name} ${chart.level}${chart.style?' · '+chart.style:''}`).join('\n')}`; content.append(preview);
      if(pkg.jacketBlob){const image=document.createElement('img');jacketUrl=URL.createObjectURL(pkg.jacketBlob);image.src=jacketUrl;image.alt='Package jacket preview';image.style.cssText='max-width:180px;display:block';content.append(image);}
      if(manifest.packageType==='full') content.append(installButton(pkg)); else {const note=document.createElement('p');note.textContent='CHART packages can be previewed only. A local audio file connection will be available in a later step.';content.append(note);}
      text($('cmixImportStatus'),'PACKAGE READY');
    }).catch(()=>{if(g===generation)text($('cmixImportStatus'),'PACKAGE CHECK FAILED');});
  }
  document.addEventListener('DOMContentLoaded',()=>{const btn=$('cmixImportBtn'),input=$('cmixImportInput');if(!dev())return;btn.hidden=false;btn.onclick=()=>preparePicker(input);input.onchange=()=>{const files=[...input.files];input.value='';if(files.length===1)show(files[0]);};$('cmixImportClose').onclick=clean;window.addEventListener('beforeunload',discard);window.addEventListener('dragenter',event=>{if(!dev()||!event.dataTransfer?.types.includes('Files'))return;dragDepth++;$('cmixDropOverlay').hidden=false;});window.addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;$('cmixDropOverlay').hidden=true;}});window.addEventListener('dragover',event=>{if(dev()&&event.dataTransfer?.types.includes('Files'))event.preventDefault();});window.addEventListener('drop',event=>{if(!dev()||!event.dataTransfer?.files)return;event.preventDefault();dragDepth=0;$('cmixDropOverlay').hidden=true;const files=[...event.dataTransfer.files];show(files.length===1&&/\.cmix$/i.test(files[0]?.name||'')?files[0]:null);});});
})();
