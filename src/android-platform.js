(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){
    root.CircleMixAndroidPlatform=api;
    if(root.document)api.autoMount(root.document,root);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='android-shell-v1';
  const VIEWPORT_DELAYS=[0,80,220,500];
  const $=(doc,id)=>doc.getElementById(id);
  const visible=element=>!!element&&!element.hidden&&element.getAttribute?.('aria-hidden')!=='true'&&getComputedStyleSafe(element,'display')!=='none';

  function getComputedStyleSafe(element,property){
    try{return element.ownerDocument?.defaultView?.getComputedStyle?.(element)?.[property]||element.style?.[property]||'';}catch(_){return element.style?.[property]||'';}
  }

  function viewportBox(win){
    const viewport=win.visualViewport;
    return {
      width:Math.max(1,Math.round(viewport?.width||win.innerWidth||win.document?.documentElement?.clientWidth||1)),
      height:Math.max(1,Math.round(viewport?.height||win.innerHeight||win.document?.documentElement?.clientHeight||1)),
      offsetLeft:Math.max(0,Math.round(viewport?.offsetLeft||0)),
      offsetTop:Math.max(0,Math.round(viewport?.offsetTop||0)),
      scale:Number(viewport?.scale||1)
    };
  }

  function foldExpanded(box){
    const shortest=Math.min(box.width,box.height);
    const longest=Math.max(box.width,box.height);
    return shortest>=600&&longest>=700;
  }

  function applyViewportMetrics(doc,win,reason='sync'){
    const box=viewportBox(win);
    const expanded=foldExpanded(box);
    const landscape=box.width>box.height;
    const root=doc.documentElement;
    root.style.setProperty('--app-width',`${box.width}px`);
    root.style.setProperty('--app-height',`${box.height}px`);
    root.style.setProperty('--viewport-offset-left',`${box.offsetLeft}px`);
    root.style.setProperty('--viewport-offset-top',`${box.offsetTop}px`);
    root.dataset.circleMixPlatform='android';
    doc.body?.classList.toggle('foldExpanded',expanded);
    doc.body?.classList.toggle('mobileLandscape',landscape);
    doc.body?.classList.toggle('mobileShortLandscape',landscape&&box.height<=560);
    const detail={...box,expanded,landscape,reason,platform:'android'};
    try{win.dispatchEvent(new win.CustomEvent('circlemix:viewportchange',{detail}));}catch(_){ }
    return detail;
  }

  function setText(doc,id,text){const element=$(doc,id);if(element)element.textContent=text;}

  function syncAndroidUi(doc){
    doc.documentElement.dataset.circleMixPlatform='android';
    doc.body?.classList.add('circleMixAndroidApp');
    setText(doc,'pwaNetworkState','ANDROID · READY');
    setText(doc,'offlineDataStatus','READY');
    setText(doc,'offlineDataProgress','100%');
    const offline=$(doc,'offlineDataBtn');
    if(offline){offline.hidden=true;offline.disabled=true;offline.setAttribute('aria-hidden','true');}
    const install=$(doc,'installAppBtn');
    if(install){install.hidden=true;install.disabled=true;install.setAttribute('aria-hidden','true');}
    const help=$(doc,'installHelp');if(help)help.hidden=true;
    const updateRow=$(doc,'pwaUpdateRow');if(updateRow)updateRow.hidden=true;
    const desktopUpdate=$(doc,'desktopUpdateBtn');if(desktopUpdate)desktopUpdate.hidden=true;
  }

  function dismiss(element){
    if(!element)return;
    element.hidden=true;
    element.classList?.remove('show','open','active');
    element.setAttribute?.('aria-hidden','true');
  }

  function click(doc,id){
    const element=$(doc,id);
    if(!element||element.disabled)return false;
    element.click?.();
    return true;
  }

  function closeFirstVisible(doc,pairs){
    for(const [overlayId,buttonId] of pairs){
      const overlay=$(doc,overlayId);
      if(!visible(overlay))continue;
      if(!click(doc,buttonId))dismiss(overlay);
      return true;
    }
    return false;
  }

  function handleAndroidBack(doc,win){
    const layout=$(doc,'mobileLayoutV2Overlay');
    if(visible(layout)){
      const layoutApi=win.CircleMixMobileLayoutV2TestApi;
      if(typeof layoutApi?.close==='function')layoutApi.close(false);else dismiss(layout);
      return false;
    }

    if(closeFirstVisible(doc,[
      ['mobileInputTestOverlay','mobileInputTestClose'],
      ['pauseSettingsOverlay','pauseSettingsBack'],
      ['keymapOverlay','closeKeymap'],
      ['updateLogOverlay','updateLogClose'],
      ['selfTestOverlay','selfTestClose'],
      ['tutorialComplete','tutorialBackTitle']
    ]))return false;

    const result=$(doc,'resultOverlay');
    if(visible(result)){if(!click(doc,'resultBackTitle'))dismiss(result);return false;}

    const pause=$(doc,'pauseOverlay');
    if(visible(pause)){if(!click(doc,'resumeBtn'))dismiss(pause);return false;}

    const body=doc.body;
    if(body?.classList.contains('safeGame')||body?.classList.contains('gameRunning')||visible($(doc,'gameRoot'))&&body?.classList.contains('playing')){
      if(!click(doc,'mobilePauseBtn'))click(doc,'settingsBtn');
      return false;
    }

    if(body?.classList.contains('safeSongSelect')||visible($(doc,'songSelect'))){
      click(doc,'songSelectBack');
      return false;
    }

    if(body?.classList.contains('tutorialMode')||visible($(doc,'tutorialHud'))){
      if(!click(doc,'tutorialExit'))click(doc,'tutorialBackTitle');
      return false;
    }

    if(body?.classList.contains('safeSettings')){
      if(!click(doc,'safeSettingsBack'))click(doc,'settingsCloseBtn');
      return false;
    }

    return !!body?.classList.contains('safeTitle');
  }

  function createPwaApi(){
    let running=false;
    return Object.freeze({
      setGameplayState(state={}){running=!!state.running;},
      canApplyUpdate(){return !running;},
      isOfflineDownloadActive(){return false;},
      isDesktopOfflineReady(){return true;},
      isAndroidApp(){return true;}
    });
  }

  function mount(doc,win){
    if(!doc||!win||win.__circleMixAndroidMounted)return win.CircleMixAndroidPlatform||null;
    win.__circleMixAndroidMounted=true;
    const pwaApi=createPwaApi();
    win.CircleMixPWA=pwaApi;
    syncAndroidUi(doc);

    let timers=[];
    let raf=0;
    const sync=reason=>{
      for(const timer of timers)win.clearTimeout(timer);timers=[];
      if(raf)win.cancelAnimationFrame?.(raf);
      const apply=()=>applyViewportMetrics(doc,win,reason);
      raf=win.requestAnimationFrame?win.requestAnimationFrame(()=>{raf=0;apply();}):0;
      if(!raf)apply();
      for(const delay of VIEWPORT_DELAYS.slice(1))timers.push(win.setTimeout(()=>applyViewportMetrics(doc,win,`${reason}:${delay}`),delay));
    };

    for(const eventName of ['resize','orientationchange','pageshow','fullscreenchange'])win.addEventListener?.(eventName,()=>sync(eventName),{passive:true});
    win.visualViewport?.addEventListener?.('resize',()=>sync('visualViewport:resize'),{passive:true});
    win.visualViewport?.addEventListener?.('scroll',()=>sync('visualViewport:scroll'),{passive:true});
    doc.addEventListener?.('visibilitychange',()=>{if(!doc.hidden)sync('visibility');});
    win.androidBackCallback=()=>handleAndroidBack(doc,win);
    sync('mount');

    const nativeInvoke=win.__TAURI__?.core?.invoke;
    if(typeof nativeInvoke==='function')nativeInvoke('android_shell_info').then(info=>{win.CircleMixAndroidShellInfo=info;}).catch(()=>{});

    return Object.freeze({VERSION,pwaApi,sync,back:()=>handleAndroidBack(doc,win),viewport:()=>viewportBox(win)});
  }

  function autoMount(doc,win){
    const run=()=>mount(doc,win);
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',run,{once:true});else run();
  }

  return Object.freeze({VERSION,VIEWPORT_DELAYS,viewportBox,foldExpanded,applyViewportMetrics,handleAndroidBack,createPwaApi,mount,autoMount});
});
