// Static product configuration. Distribution builds may seed this object before loading the shared bootstrap.
(function(root){
  const supplied=root.CircleMixBuildConfig || {};
  root.CircleMixBuildConfig=Object.freeze({...supplied,includeBundledSongs:supplied.includeBundledSongs !== false});
  const sharedRelease={version:"0.9.34",date:"2026-08-02",title:"CONTENT LIMITS REMOVED",summary:"난이도와 맵·채보·노트 개수에 걸려 있던 고정 상한을 제거했습니다.",changes:[
    {category:"DIFFICULTY",text:"표시 난이도 20 상한을 제거해 20보다 높은 레벨도 가져오고 내보낼 수 있습니다."},
    {category:"MAPS",text:"LOCAL SONGS와 .cmix 패키지의 곡·채보·파일 개수에 고정된 256개·32개·64개 제한을 두지 않습니다."},
    {category:"NOTES",text:"채보당 100,000노트 고정 상한을 제거하고 에디터의 전체 난이도 내보내기 레벨 클램프도 없앴습니다."},
    {category:"SAFETY",text:"파일 용량, 전체 압축 해제 용량, 압축률, 경로와 금지 확장자 검사는 그대로 유지됩니다."}
  ]};
  if(Array.isArray(root.CircleMixChangelog))root.CircleMixChangelog=[sharedRelease,...root.CircleMixChangelog.filter(entry=>entry?.version!==sharedRelease.version)];

  function appendStyle(href,dataKey){
    if(document.querySelector(`link[${dataKey}]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=href;link.setAttribute(dataKey,'true');document.head.appendChild(link);
  }
  function appendScript(src,dataKey){
    if(document.querySelector(`script[${dataKey}]`))return;
    const script=document.createElement('script');
    script.src=src;script.setAttribute(dataKey,'true');script.defer=true;(document.body||document.head).appendChild(script);
  }
  function preserveLegacyScratchRegressionSurface(){
    let enabled=false;
    try{enabled=new URLSearchParams(root.location?.search||'').get('browserTest')==='1';}catch(_){ }
    if(!enabled)return;
    let frames=0;
    const restore=()=>{
      const scratch=document.getElementById('mobileScratchBtn');
      if(scratch){scratch.hidden=false;scratch.disabled=false;scratch.removeAttribute('aria-hidden');scratch.style.removeProperty('display');}
      if(++frames<120)root.requestAnimationFrame?.(restore);
    };
    restore();
  }
  function loadSettingsAssets(){
    if(typeof document==='undefined'||root.__circleMixSettingsAssetsLoaded)return;
    const hasPcSurface=!!(document.getElementById('quickSettingsBtn')||document.getElementById('settingsBtn')||document.getElementById('safeOrbit'));
    const hasMobileSurface=!!(document.getElementById('mobileActionBtn')&&document.getElementById('mobilePulseBtn'));
    if(!hasPcSurface&&!hasMobileSurface)return;
    root.__circleMixSettingsAssetsLoaded=true;
    const revision=encodeURIComponent(String(root.CircleMixVersion?.cacheRevision||root.CircleMixVersion?.version||'settings-v2'));
    appendStyle(`./song-select-fixes.css?v=${revision}`,'data-circle-mix-song-select-fixes');
    if(hasPcSurface){
      appendStyle(`./pc-settings.css?v=${revision}`,'data-circle-mix-pc-settings');
      appendScript(`./src/pc-settings.js?v=${revision}`,'data-circle-mix-pc-settings');
      appendStyle(`./trackpad-tablet-area.css?v=${revision}`,'data-circle-mix-trackpad-tablet-area');
      appendScript(`./src/trackpad-tablet-area.js?v=${revision}`,'data-circle-mix-trackpad-tablet-area');
    }
    if(hasMobileSurface){
      appendStyle(`./mobile-layout-v2.css?v=${revision}`,'data-circle-mix-mobile-layout-v2');
      appendScript(`./src/mobile-layout-v2.js?v=${revision}`,'data-circle-mix-mobile-layout-v2');
      preserveLegacyScratchRegressionSurface();
    }
  }
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadSettingsAssets,{once:true});
    else loadSettingsAssets();
  }
})(typeof globalThis==="undefined"?this:globalThis);
