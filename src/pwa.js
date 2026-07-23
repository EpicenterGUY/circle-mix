(function(){
  "use strict";
  const desktop=window.CircleMixBuildConfig?.enableServiceWorker===false;
  if(desktop) return;
  const RELEASE=window.CircleMixVersion;
  const VERSION=String(RELEASE?.version||"").trim();
  const CACHE_REVISION=String(RELEASE?.cacheRevision||VERSION).trim();
  if(!VERSION){ console.error("CIRCLE MIX release metadata is unavailable"); return; }
  const OFFLINE_KEY=`circleMixOfflineReady.${VERSION}.${CACHE_REVISION}`;
  const INSTALL_HELP_TEXT="Android Chrome / Edge / Samsung Internet: 브라우저 메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 선택하세요.\n\niPhone / iPad Safari: 공유 버튼을 누르고 '홈 화면에 추가'를 선택하세요.";
  const PWA_DEBUG=new URLSearchParams(window.location.search).get("pwaDebug")==="1";
  const OFFLINE_STATUS_TIMEOUT_MS=1200;
  const UPDATE_CHECK_INTERVAL_MS=5*60*1000;
  let deferredInstallPrompt=null, waitingWorker=null, refreshing=false;
  let beforeInstallPromptReceived=false, appInstalledReceived=false;
  let running=false, paused=false, wakeLock=null;
  let offlineDownloadSession=null, serviceWorkerRegistration=null, lastUpdateCheck=0;
  const $=id=>document.getElementById(id);
  function standalone(){ return window.matchMedia?.("(display-mode: standalone)").matches || window.matchMedia?.("(display-mode: fullscreen)").matches || window.navigator.standalone===true; }
  function setText(id,text){ const el=$(id); if(el) el.textContent=text; }
  function offlineReady(){ try{return localStorage.getItem(OFFLINE_KEY)==="ready";}catch(e){return false;} }
  function rememberOfflineReady(ready){ try{ ready ? localStorage.setItem(OFFLINE_KEY,"ready") : localStorage.removeItem(OFFLINE_KEY); }catch(e){} }
  function formatMissing(count){ return `${count} FILE${count===1?"":"S"} MISSING`; }
  function setInstallHelp(visible){ const help=$("installHelp"); if(!help) return; help.textContent=INSTALL_HELP_TEXT; help.hidden=standalone() || !visible; }
  function manifestUrl(){ const link=document.querySelector('link[rel="manifest"]'); return link ? new URL(link.getAttribute("href"), document.baseURI).href : ""; }
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
  function finishOfflineDownload(session){
    if(!session || offlineDownloadSession!==session) return;
    clearTimeout(session.timeoutId);
    closePort(session.port1);
    closePort(session.port2);
    offlineDownloadSession=null;
    const btn=$("offlineDataBtn"); if(btn){ btn.disabled=false; btn.setAttribute("aria-disabled","false"); }
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
    const btn=$("offlineDataBtn"); if(btn){ btn.disabled=true; btn.setAttribute("aria-disabled","false"); }
    const channel=new MessageChannel();
    const session={port1:channel.port1, port2:channel.port2, timeoutId:null};
    offlineDownloadSession=session;
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
  function updateInstallUi(){ const btn=$("installAppBtn"); if(btn){ btn.hidden=standalone(); btn.disabled=false; btn.setAttribute("aria-disabled","false"); } if(deferredInstallPrompt) setInstallHelp(false); document.body.classList.toggle("pwaStandalone", standalone()); updatePwaDebug(); }
  async function promptInstall(){ if(standalone()){ updateInstallUi(); return; } if(!deferredInstallPrompt){ setInstallHelp(true); return; } const promptEvent=deferredInstallPrompt; deferredInstallPrompt=null; updateInstallUi(); try{ await promptEvent.prompt(); await promptEvent.userChoice; }catch(e){} updateInstallUi(); }
  function showUpdateReady(worker){ waitingWorker=worker||waitingWorker; const row=$("pwaUpdateRow"), btn=$("pwaUpdateBtn"); if(row) row.hidden=false; if(btn) btn.hidden=false; setOfflineState("UPDATE REQUIRED"); }
  function applyUpdate(){ if(!waitingWorker || running) return; waitingWorker.postMessage({type:"SKIP_WAITING"}); }
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
  window.addEventListener("circlemix:gameplay-state",e=>{ running=!!e.detail?.running; paused=!!e.detail?.paused; if(running&&!paused) requestWakeLock(); else releaseWakeLock(); });
  document.addEventListener("visibilitychange",()=>{ if(document.hidden) releaseWakeLock(); else { if(running&&!paused) requestWakeLock(); checkForUpdate(); } });
  window.addEventListener("focus",()=>checkForUpdate());
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
    navigator.serviceWorker.addEventListener("controllerchange",()=>{ if(refreshing) return; refreshing=true; window.location.reload(); });
  }
  window.CircleMixPWA={setGameplayState(detail){ window.dispatchEvent(new CustomEvent("circlemix:gameplay-state",{detail})); }, canApplyUpdate(){return !running;}, isOfflineDownloadActive(){return !!offlineDownloadSession;}, checkForUpdate};
  document.addEventListener("DOMContentLoaded",()=>{ $("offlineDataBtn")?.addEventListener("click",downloadOffline); $("installAppBtn")?.addEventListener("click",promptInstall); $("pwaUpdateBtn")?.addEventListener("click",applyUpdate); setInstallHelp(false); setOfflineState(); updateInstallUi(); });
})();
