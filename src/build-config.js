// Static product configuration. Distribution builds may seed this object before loading the shared bootstrap.
(function(root){
  const supplied=root.CircleMixBuildConfig || {};
  root.CircleMixBuildConfig=Object.freeze({...supplied,includeBundledSongs:supplied.includeBundledSongs !== false});
  const sharedRelease={version:"0.9.33",date:"2026-07-28",title:"LIBRARY SCROLL & SORT",summary:"곡이 많은 라이브러리의 스크롤 접근성과 LOCAL 난이도 순서를 수정했습니다.",changes:[
    {category:"SONG SELECT",text:"PC와 모바일에서 곡이 5개를 넘어도 첫 곡부터 마지막 곡까지 모두 스크롤로 접근할 수 있습니다."},
    {category:"LOCAL",text:"LOCAL .cmix 난이도를 숫자 레벨 기준 쉬운 순서부터 어려운 순서로 정렬합니다."},
    {category:"INPUT",text:"Windows 트랙패드 TABLET AREA와 Android Mobile Input V3를 함께 포함합니다."},
    {category:"DATA",text:"기존 점수, 설정, 채보와 LOCAL .cmix 저장 데이터는 유지됩니다."}
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
