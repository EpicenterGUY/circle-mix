(function(){
  "use strict";
  const desktop=window.CircleMixBuildConfig?.enableServiceWorker===false;
  if(desktop) return;
  const RELEASE=window.CircleMixVersion;
  const VERSION=String(RELEASE?.version||"").trim();
  const CACHE_REVISION=String(RELEASE?.cacheRevision||VERSION).trim();
  if(!VERSION){ console.error("CIRCLE MIX release metadata is unavailable"); return; }
  const OFFLINE_KEY=`circleMixOfflineReady.${VERSION}.${CACHE_REVISION}`;
  const RELOAD_GUARD_KEY=`circleMixPwaReload.${VERSION}.${CACHE_REVISION}`;
  const MOBILE_VIEWPORT_STYLE_ID="circleMixMobileViewportRuntime";
  const INSTALL_HELP_TEXT="Android Chrome / Edge / Samsung Internet: 브라우저 메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 선택하세요.\n\niPhone / iPad Safari: 공유 버튼을 누르고 '홈 화면에 추가'를 선택하세요.";
  const PWA_DEBUG=new URLSearchParams(window.location.search).get("pwaDebug")==="1";
  const OFFLINE_STATUS_TIMEOUT_MS=1200;
  const UPDATE_CHECK_INTERVAL_MS=5*60*1000;
  const VIEWPORT_SETTLE_DELAYS=[0,80,220,500];
  let deferredInstallPrompt=null, waitingWorker=null, refreshing=false;
  let beforeInstallPromptReceived=false, appInstalledReceived=false;
  let running=false, paused=false, wakeLock=null;
  let offlineDownloadSession=null, serviceWorkerRegistration=null, lastUpdateCheck=0;
  let viewportTimers=[], viewportRaf=0, settleTimer=0, lastViewportSignature="";
  const $=id=>document.getElementById(id);
  function standalone(){ return window.matchMedia?.("(display-mode: standalone)").matches || window.matchMedia?.("(display-mode: fullscreen)").matches || window.navigator.standalone===true; }
  function setText(id,text){ const el=$(id); if(el) el.textContent=text; }
  function offlineReady(){ try{return localStorage.getItem(OFFLINE_KEY)==="ready";}catch(e){return false;} }
  function rememberOfflineReady(ready){ try{ ready ? localStorage.setItem(OFFLINE_KEY,"ready") : localStorage.removeItem(OFFLINE_KEY); }catch(e){} }
  function formatMissing(count){ return `${count} FILE${count===1?"":"S"} MISSING`; }
  function setInstallHelp(visible){ const help=$("installHelp"); if(!help) return; help.textContent=INSTALL_HELP_TEXT; help.hidden=standalone() || !visible; }
  function manifestUrl(){ const link=document.querySelector('link[rel="manifest"]'); return link ? new URL(link.getAttribute("href"), document.baseURI).href : ""; }

  function installMobileViewportCss(){
    if(document.getElementById(MOBILE_VIEWPORT_STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=MOBILE_VIEWPORT_STYLE_ID;
    style.textContent=`
@media (pointer:coarse), (max-width:932px){
  body.safeTitle #safeMenu,
  body.safeSongSelect .songSelect,
  body.safeSettings #safeOverlay{
    width:var(--app-width,100vw)!important;
    height:var(--app-height,100dvh)!important;
    left:var(--viewport-offset-left,0px)!important;
    top:var(--viewport-offset-top,0px)!important;
    right:auto!important;
    bottom:auto!important;
    box-sizing:border-box;
  }
  body.safeSongSelect{overflow:hidden!important;}
  body.safeSongSelect .songSelect{align-items:stretch!important;overflow:hidden!important;}
  body.safeSongSelect .songSelectShell{height:100%;max-height:100%!important;min-height:0;overflow:hidden!important;grid-template-rows:auto minmax(0,1fr) auto;}
  body.safeSongSelect .songCarousel{min-height:0;overflow-y:auto!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
  body.safeSongSelect .songTabs{position:sticky;top:0;z-index:8;}
  body.safeSongSelect .songSelectFooter{position:relative!important;z-index:9;min-width:0;padding-bottom:max(0px,env(safe-area-inset-bottom));}
  body.safeSongSelect .songDifficulty{min-width:0;}
  body.safeSongSelect .songManage,
  body.safeSongSelect .cmixImportEntry{width:100%;max-width:100%;min-width:0;box-sizing:border-box;justify-content:center;}
  body.safeSongSelect .cmixImportBtn{width:min(100%,280px);max-width:100%;box-sizing:border-box;}
  body.safeSongSelect .songCard,
  body.safeSongSelect .songCardPick{max-width:100%;box-sizing:border-box;min-width:0;}
  body.mobileShortLandscape.safeSongSelect .songSelectShell{padding:7px 9px;gap:5px;border-radius:16px;}
  body.mobileShortLandscape.safeSongSelect .songSelectEyebrow{display:none;}
  body.mobileShortLandscape.safeSongSelect .songSelectHeader h2{font-size:clamp(20px,6.4vh,28px);line-height:1;}
  body.mobileShortLandscape.safeSongSelect .songSelectBack{min-height:34px;padding:5px 9px;}
  body.mobileShortLandscape.safeSongSelect .songTabs{padding-top:2px;padding-bottom:5px;margin-bottom:4px;}
  body.mobileShortLandscape.safeSongSelect .songSelectFooter{gap:6px;}
  body.mobileShortLandscape.safeSongSelect .songDiffBtn{min-height:36px;padding:6px 8px;}
  body.mobileViewportSettling .songSelectShell,
  body.mobileViewportSettling .mobilePlayBtn,
  body.mobileViewportSettling .rhythmHud{transition:none!important;animation:none!important;}
  :root{
    --mobile-action-x:calc(var(--viewport-offset-left,0px) + var(--app-width,100vw) - max(18px,env(safe-area-inset-right)) - 44px);
    --mobile-action-y:calc(var(--viewport-offset-top,0px) + var(--app-height,100dvh) - max(16px,env(safe-area-inset-bottom)) - 44px);
    --mobile-pulse-x:calc(var(--viewport-offset-left,0px) + max(18px,env(safe-area-inset-left)) + 48px);
    --mobile-pulse-y:calc(var(--viewport-offset-top,0px) + var(--app-height,100dvh) - max(16px,env(safe-area-inset-bottom)) - 48px);
    --mobile-scratch-x:calc(var(--viewport-offset-left,0px) + max(18px,env(safe-area-inset-left)) + 44px);
    --mobile-scratch-y:calc(var(--viewport-offset-top,0px) + var(--app-height,100dvh) - max(16px,env(safe-area-inset-bottom)) - 146px);
  }
}
`;
    (document.head||document.documentElement).appendChild(style);
  }
  function viewportBox(){
    const vv=window.visualViewport;
    const width=Math.max(1,Math.round(vv?.width||window.innerWidth||document.documentElement.clientWidth||1));
    const height=Math.max(1,Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||1));
    return {width,height,offsetLeft:Math.max(0,Math.round(vv?.offsetLeft||0)),offsetTop:Math.max(0,Math.round(vv?.offsetTop||0)),scale:Number(vv?.scale||1)};
  }
  function applyViewportMetrics(reason="sync"){
    const box=viewportBox();
    const root=document.documentElement;
    root.style.setProperty("--app-width",`${box.width}px`);
    root.style.setProperty("--app-height",`${box.height}px`);
    root.style.setProperty("--viewport-offset-left",`${box.offsetLeft}px`);
    root.style.setProperty("--viewport-offset-top",`${box.offsetTop}px`);
    const expanded=Math.min(box.width,box.height)>=600&&Math.max(box.width,box.height)>=700;
    const landscape=box.width>box.height;
    document.body?.classList.toggle("foldExpanded",expanded);
    document.body?.classList.toggle("mobileLandscape",landscape);
    document.body?.classList.toggle("mobileShortLandscape",landscape&&box.height<=560);
    const signature=[box.width,box.height,box.offsetLeft,box.offsetTop,box.scale,expanded,landscape].join(":");
    if(signature!==lastViewportSignature){
      lastViewportSignature=signature;
      window.dispatchEvent(new CustomEvent("circlemix:viewportchange",{detail:{...box,expanded,landscape,reason}}));
    }
    updatePwaDebug();
    return box;
  }
  function scheduleViewportSync(reason="event"){
    viewportTimers.forEach(clearTimeout); viewportTimers=[];
    if(viewportRaf) cancelAnimationFrame(viewportRaf);
    document.body?.classList.add("mobileViewportSettling");
    clearTimeout(settleTimer);
    viewportRaf=requestAnimationFrame(()=>{viewportRaf=0;applyViewportMetrics(reason);});
    for(const delay of VIEWPORT_SETTLE_DELAYS.slice(1)) viewportTimers.push(setTimeout(()=>applyViewportMetrics(`${reason}:${delay}`),delay));
    settleTimer=setTimeout(()=>document.body?.classList.remove("mobileViewportSettling"),620);
  }

  function updatePwaDebug(){
    if(!PWA_DEBUG) return;
    let panel=$("pwaDebugPanel");
    if(!panel){ panel=document.createElement("pre"); panel.id="pwaDebugPanel"; panel.setAttribute("aria-label","PWA debug status"); panel.style.cssText="position:fixed;left:8px;bottom:8px;z-index:10000;max-width:min(92vw,720px);max-height:40vh;overflow:auto;margin:0;padding:8px;border:1px solid #38d5ff;background:rgba(0,0,0,.82);color:#d8f7ff;font:12px/1.4 monospace;white-space:pre-wrap;"; document.body.appendChild(panel); }
    panel.textContent=JSON.stringify({
      version:VERSION,
      cacheRevision:CACHE_REVISION,
      serviceWorkerSupported:"serviceWorker" in navigator,
      serviceWorkerController:!!navigator.serviceWorker?.controller,
      manifestUrl:manifestUrl(),
      standalone:standalone(),
      beforeinstallpromptReceived:beforeInstallPromptReceived,
      appinstalledReceived:appInstalledReceived,
      offlineDownloadActive:!!offlineDownloadSession,
      updateWorkerWaiting:!!waitingWorker,
      updateCanApply:canApplyUpdate(),
      viewport:viewportBox(),
      userAgent:navigator.userAgent,
      onLine:navigator.onLine
    }, null, 2);
  }
  function setOfflineState(state,progress,detail){
    const online=navigator.onLine!==false;
    let label=state;
    if(!label) label = online ? (offlineReady()?"READY":"NOT DOWNLOADED") : (offlineReady()?"UPDATE REQUIRED":"NOT DOWNLOADED");
    if(label==="INCOMPLETE" && detail?.missingCount) label = `INCOMPLETE · ${formatMissing(detail.missingCount)}`;
    if(label==="FAILED" && detail?.missingCount) label = `FAILED · ${formatMissing(detail.missingCount)}`;
    if(label==="UPDATE_REQUIRED") label = "UPDATE REQUIRED";
    setText("pwaNetworkState", online ? label : `OFFLINE · ${label}`);
    setText("offlineDataStatus", label);
    if(progress!=null) setText("offlineDataProgress", `${Math.round(progress)}%`);
    updatePwaDebug();
  }
  function closePort(port){ try{ port?.close?.(); }catch(e){} }
  function postToSW(msg, transfer){ if(!navigator.serviceWorker?.controller) return false; navigator.serviceWorker.controller.postMessage(msg, transfer); return true; }
  function canApplyUpdate(){ return !!waitingWorker&&!running&&!offlineDownloadSession; }
  function syncUpdateUi(){
    const row=$("pwaUpdateRow"), btn=$("pwaUpdateBtn");
    if(row) row.hidden=!waitingWorker;
    if(!btn) return;
    btn.hidden=!waitingWorker;
    if(!waitingWorker) return;
    const blocked=running||!!offlineDownloadSession;
    btn.disabled=blocked;
    btn.setAttribute("aria-disabled",blocked?"true":"false");
    btn.textContent=running?"UPDATE AFTER PLAY":(offlineDownloadSession?"WAIT FOR OFFLINE DATA":"APPLY UPDATE");
    btn.title=running?"곡을 끝내거나 메뉴로 돌아온 뒤 업데이트할 수 있습니다.":(offlineDownloadSession?"오프라인 데이터 다운로드가 끝난 뒤 업데이트할 수 있습니다.":"새 버전을 적용하고 앱을 다시 불러옵니다.");
  }
  function finishOfflineDownload(session){
    if(!session || offlineDownloadSession!==session) return;
    clearTimeout(session.timeoutId);
    closePort(session.port1);
    closePort(session.port2);
    offlineDownloadSession=null;
    const btn=$("offlineDataBtn"); if(btn){ btn.disabled=false; btn.setAttribute("aria-disabled","false"); }
    syncUpdateUi();
    updatePwaDebug();
  }
  async function refreshOfflineStatus(){
    if(!navigator.serviceWorker?.controller) return setOfflineState();
    const channel=new MessageChannel();
    const result=await new Promise(resolve=>{
      let settled=false;
      const done=value=>{ if(settled) return; settled=true; clearTimeout(timeoutId); closePort(channel.port1); resolve(value); };
      const timeoutId=setTimeout(()=>done(null),OFFLINE_STATUS_TIMEOUT_MS);
      channel.port1.onmessage=e=>done(e.data);
      try{ postToSW({type:"OFFLINE_STATUS", version:VERSION, revision:CACHE_REVISION}, [channel.port2]); }
      catch(error){ console.warn("OFFLINE_STATUS postMessage failed", error); closePort(channel.port2); done(null); }
    });
    if(result?.version && (String(result.version)!==VERSION || String(result.revision||result.version)!==CACHE_REVISION)){
      rememberOfflineReady(false); setOfflineState("UPDATE REQUIRED"); return;
    }
    if(result?.ready){ rememberOfflineReady(true); setOfflineState("READY",100); return; }
    if(result){ rememberOfflineReady(false); setOfflineState(result.cachedCount>0?"INCOMPLETE":"NOT DOWNLOADED", null, {missingCount:result.missing?.length || result.requiredCount || 0}); return; }
    setOfflineState(offlineReady()?"UPDATE REQUIRED":null);
  }
  async function downloadOffline(){
    if(offlineDownloadSession) return;
    if(!navigator.serviceWorker?.controller){ rememberOfflineReady(false); setOfflineState("FAILED"); return; }
    setOfflineState("DOWNLOADING",0);
    const btn=$("offlineDataBtn"); if(btn){ btn.disabled=true; btn.setAttribute("aria-disabled","true"); }
    const channel=new MessageChannel();
    const session={port1:channel.port1, port2:channel.port2, timeoutId:null};
    offlineDownloadSession=session; syncUpdateUi();
    session.timeoutId=setTimeout(()=>{ rememberOfflineReady(false); setOfflineState("FAILED"); finishOfflineDownload(session); }, 120000);
    channel.port1.onmessage=e=>{
      if(offlineDownloadSession!==session) return;
      const data=e.data||{};
      if(data.type==="OFFLINE_PROGRESS") setOfflineState("DOWNLOADING",Math.min(95,data.progress||0));
      if(data.type==="OFFLINE_VERIFYING") setOfflineState("VERIFYING");
      if(data.type==="OFFLINE_COMPLETE"){ rememberOfflineReady(true); setOfflineState("READY",100); finishOfflineDownload(session); }
      if(data.type==="OFFLINE_FAILED"){ rememberOfflineReady(false); setOfflineState("FAILED",null,{missingCount:data.status?.missing?.length || data.failures?.length || 0}); console.warn("OFFLINE DATA failed", data.failures || data.status?.missing || []); finishOfflineDownload(session); }
    };
    try{ postToSW({type:"DOWNLOAD_OFFLINE", version:VERSION, revision:CACHE_REVISION}, [channel.port2]); }
    catch(error){ console.warn("DOWNLOAD_OFFLINE postMessage failed", error); rememberOfflineReady(false); setOfflineState("FAILED"); finishOfflineDownload(session); }
  }
  function updateInstallUi(){ const btn=$("installAppBtn"); if(btn){ btn.hidden=standalone(); btn.disabled=false; btn.setAttribute("aria-disabled","false"); } if(deferredInstallPrompt) setInstallHelp(false); document.body.classList.toggle("pwaStandalone", standalone()); scheduleViewportSync("install-ui"); updatePwaDebug(); }
  async function promptInstall(){ if(standalone()){ updateInstallUi(); return; } if(!deferredInstallPrompt){ setInstallHelp(true); return; } const promptEvent=deferredInstallPrompt; deferredInstallPrompt=null; updateInstallUi(); try{ await promptEvent.prompt(); await promptEvent.userChoice; }catch(e){} updateInstallUi(); }
  function showUpdateReady(worker){ waitingWorker=worker||waitingWorker; syncUpdateUi(); setOfflineState("UPDATE REQUIRED"); }
  function applyUpdate(){
    if(!waitingWorker) return;
    if(!canApplyUpdate()){ syncUpdateUi(); return; }
    const btn=$("pwaUpdateBtn"); if(btn){btn.disabled=true;btn.textContent="APPLYING UPDATE";}
    waitingWorker.postMessage({type:"SKIP_WAITING"});
  }
  async function checkForUpdate(force=false){
    if(!serviceWorkerRegistration || navigator.onLine===false) return false;
    const now=Date.now();
    if(!force && now-lastUpdateCheck<UPDATE_CHECK_INTERVAL_MS) return false;
    lastUpdateCheck=now;
    try{ await serviceWorkerRegistration.update(); return true; }
    catch(error){ if(PWA_DEBUG) console.warn("Service worker update check failed", error); return false; }
  }
  async function requestWakeLock(){ if(!running||paused||document.hidden||!("wakeLock" in navigator)) return; try{ wakeLock=await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release",()=>{ wakeLock=null; }); }catch(e){} }
  async function releaseWakeLock(){ const lock=wakeLock; wakeLock=null; if(lock){ try{ await lock.release(); }catch(e){} } }
  window.addEventListener("circlemix:gameplay-state",e=>{ running=!!e.detail?.running; paused=!!e.detail?.paused; syncUpdateUi(); if(running&&!paused) requestWakeLock(); else releaseWakeLock(); });
  document.addEventListener("visibilitychange",()=>{ if(document.hidden) releaseWakeLock(); else { if(running&&!paused) requestWakeLock(); checkForUpdate(); scheduleViewportSync("visibility"); } });
  window.addEventListener("focus",()=>checkForUpdate());
  window.addEventListener("pageshow",()=>{ checkForUpdate(true); scheduleViewportSync("pageshow"); });
  window.addEventListener("resize",()=>scheduleViewportSync("resize"),{passive:true});
  window.addEventListener("orientationchange",()=>scheduleViewportSync("orientationchange"),{passive:true});
  window.visualViewport?.addEventListener("resize",()=>scheduleViewportSync("visualViewport.resize"),{passive:true});
  window.visualViewport?.addEventListener("scroll",()=>scheduleViewportSync("visualViewport.scroll"),{passive:true});
  window.screen?.orientation?.addEventListener?.("change",()=>scheduleViewportSync("screen.orientation"));
  window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); beforeInstallPromptReceived=true; deferredInstallPrompt=e; updateInstallUi(); });
  window.addEventListener("appinstalled",()=>{ appInstalledReceived=true; deferredInstallPrompt=null; updateInstallUi(); });
  window.addEventListener("online",()=>{ setOfflineState(); checkForUpdate(true); }); window.addEventListener("offline",()=>setOfflineState());
  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"}).then(reg=>{
      serviceWorkerRegistration=reg;
      if(reg.waiting) showUpdateReady(reg.waiting);
      reg.addEventListener("updatefound",()=>{ const sw=reg.installing; if(!sw) return; sw.addEventListener("statechange",()=>{ if(sw.state==="installed" && navigator.serviceWorker.controller) showUpdateReady(sw); }); });
      checkForUpdate(true);
      refreshOfflineStatus();
    }).catch(()=>setOfflineState("FAILED")));
    navigator.serviceWorker.addEventListener("message",event=>{
      const data=event.data||{};
      if(data.type!=="RELEASE_ACTIVE") return;
      if(String(data.version)!==VERSION || String(data.revision||data.version)!==CACHE_REVISION){ rememberOfflineReady(false); setOfflineState("UPDATE REQUIRED"); checkForUpdate(true); }
      else refreshOfflineStatus();
    });
    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(refreshing) return;
      refreshing=true;
      try{
        const last=Number(sessionStorage.getItem(RELOAD_GUARD_KEY)||0);
        if(last&&Date.now()-last<10000){ refreshing=false; return; }
        sessionStorage.setItem(RELOAD_GUARD_KEY,String(Date.now()));
      }catch(e){}
      window.location.reload();
    });
  }
  window.CircleMixPWA={
    setGameplayState(detail){ window.dispatchEvent(new CustomEvent("circlemix:gameplay-state",{detail})); },
    canApplyUpdate,
    isOfflineDownloadActive(){return !!offlineDownloadSession;},
    checkForUpdate,
    syncViewport(reason="api"){scheduleViewportSync(reason);return viewportBox();},
    viewportState:viewportBox
  };
  function boot(){
    installMobileViewportCss();
    scheduleViewportSync("boot");
    $("offlineDataBtn")?.addEventListener("click",downloadOffline);
    $("installAppBtn")?.addEventListener("click",promptInstall);
    $("pwaUpdateBtn")?.addEventListener("click",applyUpdate);
    setInstallHelp(false); setOfflineState(); updateInstallUi(); syncUpdateUi();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true}); else boot();
})();