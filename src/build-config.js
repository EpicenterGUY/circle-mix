// Static product configuration. Distribution builds may seed this object before loading the shared bootstrap.
(function(root){
  const supplied=root.CircleMixBuildConfig || {};
  root.CircleMixBuildConfig=Object.freeze({...supplied,includeBundledSongs:supplied.includeBundledSongs !== false});
  function loadPcSettingsAssets(){
    if(typeof document==='undefined'||root.__circleMixPcSettingsAssetsLoaded)return;
    if(!document.getElementById('quickSettingsBtn')&&!document.getElementById('settingsBtn')&&!document.getElementById('safeOrbit'))return;
    root.__circleMixPcSettingsAssetsLoaded=true;
    const revision=encodeURIComponent(String(root.CircleMixVersion?.cacheRevision||root.CircleMixVersion?.version||'pc-settings-v1'));
    if(!document.querySelector('link[data-circle-mix-pc-settings]')){
      const link=document.createElement('link');
      link.rel='stylesheet';link.href=`./pc-settings.css?v=${revision}`;link.dataset.circleMixPcSettings='true';document.head.appendChild(link);
    }
    if(!document.querySelector('script[data-circle-mix-pc-settings]')){
      const script=document.createElement('script');
      script.src=`./src/pc-settings.js?v=${revision}`;script.dataset.circleMixPcSettings='true';script.defer=true;(document.body||document.head).appendChild(script);
    }
  }
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadPcSettingsAssets,{once:true});
    else loadPcSettingsAssets();
  }
})(typeof globalThis!=="undefined"?globalThis:this);
