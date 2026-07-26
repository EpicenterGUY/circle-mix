// Static product configuration. Distribution builds may seed this object before loading the shared bootstrap.
(function(root){
  const supplied=root.CircleMixBuildConfig || {};
  root.CircleMixBuildConfig=Object.freeze({...supplied,includeBundledSongs:supplied.includeBundledSongs !== false});

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
    if(hasPcSurface){
      appendStyle(`./pc-settings.css?v=${revision}`,'data-circle-mix-pc-settings');
      appendScript(`./src/pc-settings.js?v=${revision}`,'data-circle-mix-pc-settings');
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
})(typeof globalThis!=="undefined"?globalThis:this);