/* Public .cmix import surface. Validation and installation remain in the hardened modules. */
(function(){
'use strict';

const $=id=>document.getElementById(id);
const fmt=n=>`${Math.max(0,Number(n)||0).toLocaleString()} bytes`;
const MOBILE_SONG_SELECT_STYLE_ID='circleMixMobileSongSelectLayout';
let generation=0,aborter=null,jacketUrl=null,installing=false,returnFocus=null,firstUseOpen=false;

const status=v=>{$('cmixImportStatus').textContent=v;};
const err=e=>`${e?.code||'STORAGE_ACCESS_FAILED'}: ${e?.message||'The package could not be processed.'}`;
function safeScene(){ return !!window.CircleMixCanImportCmix?.() || (!document.getElementById('songSelect')?.hidden && !document.getElementById('tutorialHud')?.hidden===false); }
function clear(){ generation++; aborter?.abort(); aborter=null; if(jacketUrl)URL.revokeObjectURL(jacketUrl),jacketUrl=null; }
function close(){ clear(); installing=false; firstUseOpen=false; $('cmixDropOverlay').hidden=true; $('cmixImportModal').hidden=true; $('cmixImportContent').replaceChildren(); returnFocus?.focus?.(); returnFocus=null; }
function btn(label,fn,kind=''){ const b=document.createElement('button'); b.type='button'; b.className=`songPlayBtn ${kind}`; b.textContent=label; b.onclick=fn; return b; }

function autoButtonState(button){
  if(!button)return false;
  const pressed=button.getAttribute?.('aria-pressed');
  if(pressed==='true')return true;
  if(pressed==='false')return false;
  if(button.classList?.contains?.('on'))return true;
  return /(?:^|\s)ON(?:\s|$)/i.test(String(button.textContent||''));
}

function syncAutoButton(button,enabled){
  if(!button)return;
  const on=!!enabled;
  button.classList?.toggle?.('on',on);
  button.setAttribute?.('aria-pressed',on?'true':'false');
  const state=button.querySelector?.('span');
  if(state)state.textContent=on?'ON':'OFF';
  else if(/AUTO PLAY/i.test(String(button.textContent||'')))button.textContent=`AUTO PLAY ${on?'ON':'OFF'}`;
}

function stableAutoControl(doc){
  return doc.getElementById?.('safeAuto')||doc.getElementById?.('autoToggle')||null;
}

function dispatchAutoShortcut(doc){
  const view=doc?.defaultView||window;
  if(!view?.dispatchEvent)return false;
  try{
    const event=typeof view.KeyboardEvent==='function'
      ? new view.KeyboardEvent('keydown',{code:'KeyO',key:'o',bubbles:true,cancelable:true,repeat:false})
      : {type:'keydown',code:'KeyO',key:'o',bubbles:true,cancelable:true,repeat:false};
    view.dispatchEvent(event);
    return true;
  }catch(_){return false;}
}

function installAutoToggleFallback(doc=document){
  if(!doc?.addEventListener || doc.__circleMixLocalAutoFallbackInstalled)return false;
  doc.__circleMixLocalAutoFallbackInstalled=true;
  let sequence=0,pending=null;
  const findButton=event=>event?.target?.closest?.('[data-auto-play]')||null;
  const begin=event=>{
    const button=findButton(event);
    if(!button)return null;
    if(pending && !pending.done && pending.button===button)return pending;
    const stable=stableAutoControl(doc);
    pending={id:++sequence,button,initialButton:autoButtonState(button),initialStable:autoButtonState(stable),scheduled:false,done:false};
    return pending;
  };
  const finish=(gesture,enabled)=>{
    const current=doc.querySelector?.('[data-auto-play]')||gesture.button;
    syncAutoButton(current,enabled);
    gesture.done=true;
    if(pending===gesture)pending=null;
  };
  const recover=(gesture,attempt=0)=>{
    if(gesture.done)return;
    const stable=stableAutoControl(doc);
    if(!stable){
      if(dispatchAutoShortcut(doc)) finish(gesture,!gesture.initialButton);
      else finish(gesture,gesture.initialButton);
      return;
    }
    if(typeof stable.click!=='function'){finish(gesture,gesture.initialStable);return;}
    const before=autoButtonState(stable);
    stable.click();
    setTimeout(()=>{
      if(gesture.done)return;
      const currentStable=stableAutoControl(doc);
      const after=autoButtonState(currentStable);
      if(after===before && attempt<1){
        setTimeout(()=>recover(gesture,attempt+1),220);
        return;
      }
      finish(gesture,after);
    },0);
  };
  const verify=event=>{
    const button=findButton(event);
    if(!button)return;
    const gesture=pending && !pending.done && pending.button===button ? pending : begin(event);
    if(!gesture || gesture.scheduled)return;
    gesture.scheduled=true;
    setTimeout(()=>{
      if(gesture.done)return;
      const live=doc.querySelector?.('[data-auto-play]')||gesture.button;
      const stable=stableAutoControl(doc);
      const liveChanged=autoButtonState(live)!==gesture.initialButton;
      const stableChanged=stable?autoButtonState(stable)!==gesture.initialStable:false;
      if(stableChanged || liveChanged) finish(gesture,stable?autoButtonState(stable):autoButtonState(live));
      else recover(gesture);
    },0);
  };
  doc.addEventListener('pointerdown',begin,true);
  doc.addEventListener('touchstart',begin,true);
  doc.addEventListener('pointerup',verify,true);
  doc.addEventListener('touchend',verify,true);
  doc.addEventListener('click',verify,true);
  return true;
}

function installMobileSongSelectLayout(doc=document){
  if(!doc?.createElement || doc.getElementById?.(MOBILE_SONG_SELECT_STYLE_ID))return false;
  const target=doc.head||doc.documentElement;
  if(!target?.appendChild)return false;
  const style=doc.createElement('style');
  style.id=MOBILE_SONG_SELECT_STYLE_ID;
  style.textContent=`
@media (pointer:coarse), (max-width:932px){
  body.safeSongSelect{overflow:hidden!important;}
  body.safeSongSelect .songSelect{
    align-items:stretch!important;
    justify-content:center;
    overflow:hidden!important;
    box-sizing:border-box;
    padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))!important;
  }
  body.safeSongSelect .songSelectShell{
    width:min(920px,100%);
    height:100%;
    max-height:100%!important;
    min-height:0;
    overflow:hidden!important;
    box-sizing:border-box;
    grid-template-rows:auto minmax(0,1fr) auto;
    gap:clamp(8px,1.8vh,14px);
    padding:clamp(10px,2.2vw,18px);
  }
  body.safeSongSelect .songSelectHeader,
  body.safeSongSelect .songSelectFooter{min-width:0;}
  body.safeSongSelect .songCarousel{
    min-height:0;
    overflow-y:auto!important;
    overflow-x:hidden!important;
    align-content:flex-start!important;
    justify-content:center;
    padding:0 4px max(12px,env(safe-area-inset-bottom));
    scroll-snap-type:none!important;
    scroll-padding-top:54px;
    overscroll-behavior:contain;
    -webkit-overflow-scrolling:touch;
  }
  body.safeSongSelect .songTabs{
    position:sticky;
    top:0;
    z-index:6;
    flex:0 0 100%;
    box-sizing:border-box;
    margin:0 0 8px;
    padding:6px 6px 10px;
    background:linear-gradient(180deg,rgba(5,12,28,.98) 0 76%,rgba(5,12,28,0));
    backdrop-filter:blur(8px);
  }
  body.safeSongSelect .songSelectFooter{
    position:relative!important;
    z-index:7;
    padding-top:2px;
  }
  body.safeSongSelect .songCard{box-sizing:border-box;max-width:100%;}
  body.safeSongSelect .songManage{flex:0 0 100%;box-sizing:border-box;}
}
@media (pointer:coarse) and (min-width:540px), (min-width:540px) and (max-width:932px){
  body.safeSongSelect .songSelectHeader{grid-template-columns:auto minmax(0,1fr)!important;text-align:center;}
  body.safeSongSelect .songCardPick{grid-template-columns:110px minmax(0,1fr)!important;text-align:left!important;}
  body.safeSongSelect .songJacket{width:110px!important;}
  body.safeSongSelect .songSelectFooter{grid-template-columns:minmax(0,1fr) auto!important;}
  body.safeSongSelect .songPlayBtn{width:auto!important;}
}
@media (orientation:landscape) and (max-height:700px){
  body.safeSongSelect .songSelect{
    padding:max(5px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(5px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left))!important;
  }
  body.safeSongSelect .songSelectShell{padding:8px 10px;gap:6px;border-radius:18px;}
  body.safeSongSelect .songSelectHeader{grid-template-columns:auto minmax(0,1fr)!important;gap:8px;text-align:center;}
  body.safeSongSelect .songSelectEyebrow{font-size:9px;letter-spacing:.18em;}
  body.safeSongSelect .songSelectHeader h2{margin:0;font-size:clamp(22px,6vh,32px);line-height:1;}
  body.safeSongSelect .songSelectBack{min-height:36px;padding:6px 10px;font-size:11px;}
  body.safeSongSelect .songCarousel{gap:8px;padding:0 2px 4px;scroll-padding-top:40px;}
  body.safeSongSelect .songTabs{gap:6px;margin:0;padding:2px 4px 5px;}
  body.safeSongSelect .songTab,
  body.safeSongSelect .songManage button,
  body.safeSongSelect .songManage a{padding:6px 9px;font-size:10px;}
  body.safeSongSelect .songCard{width:min(330px,calc(50% - 6px));padding:8px;border-radius:16px;}
  body.safeSongSelect .songCardPick{grid-template-columns:68px minmax(0,1fr)!important;gap:8px;text-align:left!important;}
  body.safeSongSelect .songJacket{width:68px!important;border-radius:11px;}
  body.safeSongSelect .songMeta span,
  body.safeSongSelect .songMeta em{font-size:9px;}
  body.safeSongSelect .songMeta strong{margin:3px 0 2px;font-size:20px;line-height:1;}
  body.safeSongSelect .songSelectFooter{grid-template-columns:minmax(0,1fr) auto!important;gap:8px;}
  body.safeSongSelect .songDifficulty{min-width:0;justify-content:flex-start;flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px;overscroll-behavior-x:contain;}
  body.safeSongSelect .songDiffBtn{min-height:38px;padding:7px 9px;font-size:10px;white-space:nowrap;}
  body.safeSongSelect .songDiffBtn small{display:none;}
  body.safeSongSelect .songAutoBtn{min-width:112px;}
  body.safeSongSelect .songPlayBtn{width:auto!important;min-width:88px;min-height:40px;padding:8px 16px;font-size:12px;}
}
`;
  target.appendChild(style);
  return true;
}

function loadPlayerProfile(doc=document){
  if(window.CircleMixPlayerProfile){window.CircleMixPlayerProfile.installResultRecorder?.(doc);return true;}
  if(doc.querySelector?.('script[data-circle-mix-player-profile]'))return false;
  const script=doc.createElement('script');
  script.src='./src/player-profile.js?v=20260722-local-profile-records';
  script.dataset.circleMixPlayerProfile='1';
  script.onload=()=>window.CircleMixPlayerProfile?.installResultRecorder?.(doc);
  script.onerror=()=>console.warn('Player profile module failed to load');
  doc.head.append(script);
  return true;
}

function open(){ if(!safeScene())return; returnFocus=document.activeElement; clear(); $('cmixImportContent').replaceChildren(); $('cmixImportModal').hidden=false; $('cmixImportTitle').focus(); status('SELECT .CMIX PACKAGE'); try{ if(localStorage.getItem('circleMixCmixImportNotice')!=='seen')notice(); else $('cmixImportInput').click(); }catch(_){ notice(); } }
function notice(){ if(firstUseOpen)return; firstUseOpen=true; const c=$('cmixImportContent'), p=document.createElement('p'); p.textContent='.cmix is a local song package. Files are never uploaded to a server and are stored only in this browser. CHART packages need an audio file you own; FULL packages may include audio. Import only packages from sources you trust. Copyright and distribution rights remain with the package provider and you.'; const dont=document.createElement('label'), check=document.createElement('input'); check.type='checkbox'; dont.append(check,' DO NOT SHOW AGAIN'); c.append(p,dont,document.createElement('br'),btn('CONTINUE',()=>{firstUseOpen=false;try{if(check.checked)localStorage.setItem('circleMixCmixImportNotice','seen');}catch(_){} $('cmixImportInput').click();}),btn('CANCEL',close)); }
function packageInfo(pkg,file){ const m=pkg.manifest, box=document.createElement('section'), pre=document.createElement('p'); pre.textContent=`${m.title}\n${m.artist}\n${m.packageType.toUpperCase()} · VERSION ${m.packageVersion}\n${m.charts.length} CHART${m.charts.length===1?'':'S'} · PACKAGE ${fmt(file.size)}\nESTIMATED LOCAL STORAGE: ${fmt(file.size)}`; box.append(pre); if(pkg.jacketBlob){const i=document.createElement('img'); jacketUrl=URL.createObjectURL(pkg.jacketBlob); i.src=jacketUrl;i.alt=`Jacket for ${m.title}`;i.className='cmixJacket';box.append(i);} const levels=(m.charts||[]).map(x=>`${x.difficulty||x.id||'CHART'} ${x.level??''}`.trim()); if(levels.length)box.append(Object.assign(document.createElement('p'),{textContent:`DIFFICULTIES: ${levels.join(', ')}`})); return box; }
async function install(pkg,link,override){ if(installing)return; installing=true; status('PREPARING ATOMIC INSTALL'); try{ const record=pkg.manifest.packageType==='full'?CircleMixCmixLocalInstall.recordFromPackage(pkg):CircleMixCmixLocalInstall.recordFromChartPackage(pkg,{...link,hashOverride:!!override}); const library=window.CircleMixLocalLibrary, old=await CircleMixLocalSongs.get(record.id), policy=CircleMixCmixLocalInstall.replacementInfo(old,record); const c=$('cmixImportContent'); if(old&&!c.querySelector('[data-replace]')){ const p=document.createElement('p');p.dataset.replace='1';p.textContent=`UPDATE ${old.packageVersion} → ${record.packageVersion}\nAdded: ${(policy.added||[]).join(', ')||'none'}\nChanged: ${(policy.changed||[]).join(', ')||'none'}\nRemoved: ${(policy.removed||[]).join(', ')||'none'}\nBackup space: ${fmt(library.estimateRecordBytes(old))}`; c.append(p,btn('INSTALL UPDATE WITH BACKUP',()=>install(pkg,link,override)),btn('REPLACE WITHOUT BACKUP',()=>install(pkg,link,override))); installing=false; status('REVIEW UPDATE'); return; } await library.install(record,{expectedCurrent:{exists:!!old,...(old||{})},keepBackup:!!old}); await CircleMixSongRegistry.refreshLocal(); status('INSTALL COMPLETE'); c.append(btn('OPEN IN LOCAL SONGS',async()=>{await window.CircleMixOpenLocalSong?.(record.id);close();}),btn('IMPORT ANOTHER',open)); }catch(e){status(`INSTALL FAILED [${err(e)}]`);}finally{installing=false;} }
function chartUi(pkg){ const m=pkg.manifest, match=m.audioMatch, tol=match.durationToleranceSeconds??2, box=document.createElement('section'), out=document.createElement('p'), input=document.createElement('input'); input.type='file';input.hidden=true;input.accept='.mp3,.ogg,.wav,audio/mpeg,audio/ogg,audio/wav'; box.append(Object.assign(document.createElement('p'),{textContent:`LOCAL AUDIO REQUIRED: ${match.suggestedFilename||'audio file'}\nEXPECTED DURATION: ${match.durationSeconds}s ± ${tol}s\nSHA-256: ${match.sha256?'provided':'not provided'}\nYour audio is not uploaded to a server.`}),btn('SELECT LOCAL AUDIO',()=>input.click()),input,out); input.onchange=async()=>{const file=input.files[0];input.value='';if(!file)return; const token=++generation;status('CHECKING LOCAL AUDIO');out.textContent=`CHECKING ${file.name}…`;try{const a=await CircleMixCmixAudio.inspect(file);if(token!==generation)return;const delta=Math.abs(a.duration-match.durationSeconds),durationOk=delta<=tol+1e-7,hashOk=!match.sha256||a.sha256===match.sha256;out.textContent=`FILE: ${file.name}\nDuration: ${a.duration.toFixed(3)}s (difference ${delta.toFixed(3)}s; allowed ${tol}s)\nSHA-256 expected: ${match.sha256||'not provided'}\nSHA-256 actual: ${a.sha256||'unavailable'}`; if(!durationOk){status('AUDIO_DURATION_MISMATCH: select another audio file');return;} if(!hashOk){status('AUDIO_HASH_MISMATCH: automatic installation blocked');box.append(btn('OVERRIDE HASH MISMATCH',()=>install(pkg,{...a,fileName:file.name,matchMethod:'hash-override'},true),'cmixDanger'));return;}status(match.sha256?'EXACT HASH MATCH':'DURATION MATCH');box.append(btn('INSTALL',()=>install(pkg,{...a,fileName:file.name,matchMethod:match.sha256?'exact-hash':'duration-only'})));}catch(e){if(token===generation)status(`AUDIO CHECK FAILED [${err(e)}]`);}}; return box; }
function inspect(file){ const token=++generation;clear();generation=token; aborter=new AbortController(); $('cmixImportModal').hidden=false;const c=$('cmixImportContent');c.replaceChildren();status('READING PACKAGE'); CircleMixCmixImporter.inspect(file,{signal:aborter.signal,onProgress:x=>token===generation&&status(x)}).then(async r=>{if(token!==generation)return;if(!r.ok){status('PACKAGE CHECK FAILED');c.textContent=r.errors.map(err).join('\n');return;} const old=await CircleMixLocalSongs.get(r.package.manifest.id); if(token!==generation)return;c.append(packageInfo(r.package,file),Object.assign(document.createElement('p'),{textContent:old?`UPDATE AVAILABLE · installed version ${old.packageVersion}`:'NEW LOCAL SONG'})); c.append(r.package.manifest.packageType==='full'?btn('INSTALL',()=>install(r.package)):chartUi(r.package));status('PACKAGE READY');}).catch(e=>token===generation&&status(`PACKAGE CHECK FAILED [${err(e)}]`)); }
function fileDragCandidate(dt){ return [...(dt?.types||[])].includes('Files') || [...(dt?.items||[])].some(item=>item?.kind==='file') || (dt?.files?.length||0)>0; }
function cmixFiles(dt){return [...(dt?.files||[])].filter(f=>/\.cmix$/i.test(f.name)||f.type==='application/vnd.circle-mix.cmix');}

document.addEventListener('DOMContentLoaded',()=>{
  installMobileSongSelectLayout(document);
  installAutoToggleFallback(document);
  loadPlayerProfile(document);
  const input=$('cmixImportInput'), b=$('cmixImportBtn');
  b.onclick=open;
  input.onchange=()=>{const f=input.files[0];input.value='';if(f)inspect(f);};
  $('cmixImportClose').onclick=close;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('cmixImportModal').hidden)close();});
  for(const type of ['dragover','dragleave','drop'])window.addEventListener(type,e=>{if(type==='dragleave'){if(safeScene())$('cmixDropOverlay').hidden=true;return;}if(!safeScene()||['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)||!fileDragCandidate(e.dataTransfer))return;e.preventDefault();if(type==='dragover'){if(e.dataTransfer)e.dataTransfer.dropEffect='copy';$('cmixDropOverlay').hidden=false;return;}$('cmixDropOverlay').hidden=true;const files=cmixFiles(e.dataTransfer);if(files.length===1)inspect(files[0]);else if(files.length>1){$('cmixImportModal').hidden=false;status('SELECT ONE .CMIX PACKAGE AT A TIME');}});
  window.addEventListener('beforeunload',clear);
});

window.CircleMixCmixImportUi={canImport:safeScene,isFileDrag:fileDragCandidate,filterDragFiles:cmixFiles,installAutoToggleFallback,installMobileSongSelectLayout,autoButtonState,syncAutoButton,dispatchAutoShortcut,loadPlayerProfile};
})();
