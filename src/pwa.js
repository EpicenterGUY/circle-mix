(function(){
  "use strict";
  const VERSION="0.9.2";
  const OFFLINE_KEY=`circleMixOfflineReady.${VERSION}`;
  const INSTALL_HELP_TEXT="Android Chrome / Edge / Samsung Internet: 브라우저 메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 선택하세요.\n\niPhone / iPad Safari: 공유 버튼을 누르고 '홈 화면에 추가'를 선택하세요.";
  const PWA_DEBUG=new URLSearchParams(window.location.search).get("pwaDebug")==="1";
  let deferredInstallPrompt=null, waitingWorker=null, refreshing=false;
  let beforeInstallPromptReceived=false, appInstalledReceived=false;
  let running=false, paused=false, wakeLock=null;
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
      serviceWorkerSupported:"serviceWorker" in navigator,
      serviceWorkerController:!!navigator.serviceWorker?.controller,
      manifestUrl:manifestUrl(),
      standalone:standalone(),
      beforeinstallpromptReceived:beforeInstallPromptReceived,
      appinstalledReceived:appInstalledReceived,
      userAgent:navigator.userAgent,
      onLine:navigator.onLine
    }, null, 2);
  }
  function setOfflineState(state,progress,detail){
    const online=navigator.onLine!==false;
    let label=state;
    if(!label) label = online ? (offlineReady()?"READY":"NOT DOWNLOADED") : (offlineReady()?"UPDATE REQUIRED":"NOT DOWNLOADED");
    if(label==="INCOMPLETE" && detail?.missingCount) label = `INCOMPLETE · ${formatMissing(detail.missingCount)}`;
    if(label==="UPDATE_REQUIRED") label = "UPDATE REQUIRED";
    setText("pwaNetworkState", online ? label : `OFFLINE · ${label}`);
    setText("offlineDataStatus", label);
    if(progress!=null) setText("offlineDataProgress", `${Math.round(progress)}%`);
    updatePwaDebug();
  }
  function postToSW(msg){ if(navigator.serviceWorker?.controller) navigator.serviceWorker.controller.postMessage(msg); }
  async function refreshOfflineStatus(){
    if(!navigator.serviceWorker?.controller) return setOfflineState();
    const channel=new MessageChannel();
    const result=await new Promise(resolve=>{ channel.port1.onmessage=e=>resolve(e.data); postToSW({type:"OFFLINE_STATUS", version:VERSION, port:channel.port2}); setTimeout(()=>resolve(null),1200); });
    if(result?.ready){ rememberOfflineReady(true); setOfflineState("READY",100); return; }
    if(result){ rememberOfflineReady(false); setOfflineState(result.cachedCount>0?"INCOMPLETE":"NOT DOWNLOADED", null, {missingCount:result.missing?.length || result.requiredCount || 0}); return; }
    setOfflineState(offlineReady()?"UPDATE REQUIRED":null);
  }
  async function downloadOffline(){
    if(!navigator.serviceWorker?.controller){ setOfflineState("FAILED"); return; }
    setOfflineState("DOWNLOADING",0);
    const channel=new MessageChannel();
    channel.port1.onmessage=e=>{
      const data=e.data||{};
      if(data.type==="OFFLINE_PROGRESS") setOfflineState("DOWNLOADING",Math.min(95,data.progress||0));
      if(data.type==="OFFLINE_VERIFYING") setOfflineState("VERIFYING");
      if(data.type==="OFFLINE_COMPLETE"){ rememberOfflineReady(true); setOfflineState("READY",100); }
      if(data.type==="OFFLINE_FAILED"){ rememberOfflineReady(false); setOfflineState("FAILED",null,{missingCount:data.status?.missing?.length || data.failures?.length || 0}); console.warn("OFFLINE DATA failed", data.failures || data.status?.missing || []); }
    };
    postToSW({type:"DOWNLOAD_OFFLINE", version:VERSION, port:channel.port2});
  }
  function updateInstallUi(){ const btn=$("installAppBtn"); if(btn){ btn.hidden=standalone(); btn.disabled=false; btn.setAttribute("aria-disabled","false"); } if(deferredInstallPrompt) setInstallHelp(false); document.body.classList.toggle("pwaStandalone", standalone()); updatePwaDebug(); }
  async function promptInstall(){ if(standalone()){ updateInstallUi(); return; } if(!deferredInstallPrompt){ setInstallHelp(true); return; } const promptEvent=deferredInstallPrompt; deferredInstallPrompt=null; updateInstallUi(); try{ await promptEvent.prompt(); await promptEvent.userChoice; }catch(e){} updateInstallUi(); }
  function showUpdateReady(worker){ waitingWorker=worker||waitingWorker; const row=$("pwaUpdateRow"), btn=$("pwaUpdateBtn"); if(row) row.hidden=false; if(btn) btn.hidden=false; setOfflineState("UPDATE REQUIRED"); }
  function applyUpdate(){ if(!waitingWorker || running) return; waitingWorker.postMessage({type:"SKIP_WAITING"}); }
  async function requestWakeLock(){ if(!running||paused||document.hidden||!("wakeLock" in navigator)) return; try{ wakeLock=await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release",()=>{ wakeLock=null; }); }catch(e){} }
  async function releaseWakeLock(){ const lock=wakeLock; wakeLock=null; if(lock){ try{ await lock.release(); }catch(e){} } }
  window.addEventListener("circlemix:gameplay-state",e=>{ running=!!e.detail?.running; paused=!!e.detail?.paused; if(running&&!paused) requestWakeLock(); else releaseWakeLock(); });
  document.addEventListener("visibilitychange",()=>{ if(document.hidden) releaseWakeLock(); else if(running&&!paused) requestWakeLock(); });
  window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); beforeInstallPromptReceived=true; deferredInstallPrompt=e; updateInstallUi(); });
  window.addEventListener("appinstalled",()=>{ appInstalledReceived=true; deferredInstallPrompt=null; updateInstallUi(); });
  window.addEventListener("online",()=>setOfflineState()); window.addEventListener("offline",()=>setOfflineState());
  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").then(reg=>{
      if(reg.waiting) showUpdateReady(reg.waiting);
      reg.addEventListener("updatefound",()=>{ const sw=reg.installing; if(!sw) return; sw.addEventListener("statechange",()=>{ if(sw.state==="installed" && navigator.serviceWorker.controller) showUpdateReady(sw); }); });
      refreshOfflineStatus();
    }).catch(()=>setOfflineState("FAILED")));
    navigator.serviceWorker.addEventListener("controllerchange",()=>{ if(refreshing) return; refreshing=true; window.location.reload(); });
  }
  window.CircleMixPWA={setGameplayState(detail){ window.dispatchEvent(new CustomEvent("circlemix:gameplay-state",{detail})); }, canApplyUpdate(){return !running;}};
  document.addEventListener("DOMContentLoaded",()=>{ $("offlineDataBtn")?.addEventListener("click",downloadOffline); $("installAppBtn")?.addEventListener("click",promptInstall); $("pwaUpdateBtn")?.addEventListener("click",applyUpdate); setInstallHelp(false); setOfflineState(); updateInstallUi(); });
})();
