// Static product configuration. Distribution builds may seed this object before loading the shared bootstrap.
(function(root){
  const supplied=root.CircleMixBuildConfig || {};
  root.CircleMixBuildConfig=Object.freeze({...supplied,includeBundledSongs:supplied.includeBundledSongs !== false});
  const sharedRelease={version:"0.9.35",date:"2026-08-05",title:"UNLIMITED DIFFICULTY DISPLAY",summary:"작성 LEVEL과 자동 별을 분리 표시하고 자동 난이도의 15★ 상한을 제거했습니다.",changes:[
    {category:"LEVEL",text:"LOCAL 난이도 버튼과 곡 목록에 .cmix 작성 LEVEL을 그대로 표시합니다."},
    {category:"AUTO",text:"자동 난이도를 별도 AUTO 값으로 함께 표시하며 15★ 이상도 그대로 표시합니다."},
    {category:"POWER",text:"정렬·POWER·플레이 계산은 자동 별을 계속 사용해 작성 LEVEL 조작의 영향을 받지 않습니다."},
    {category:"COMPATIBILITY",text:"기존 LOCAL 곡·채보·기록과 설정을 유지합니다."}
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
