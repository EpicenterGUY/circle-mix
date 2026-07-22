(function(){
  "use strict";
  const AUTO_CHECK_DELAY_MS=1800;
  const UPDATE_CHECKED_KEY="circleMixDesktopUpdaterChecked.v1";
  let pending=null,checking=false,installing=false;

  function invoke(command,args){
    const fn=window.__TAURI__?.core?.invoke;
    if(typeof fn!=="function") throw new Error("TAURI_CORE_UNAVAILABLE");
    return fn(command,args||{});
  }
  function createUi(){
    if(document.getElementById("desktopUpdaterButton")) return;
    const style=document.createElement("style");
    style.textContent=`
      #desktopUpdaterButton{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:10020;border:1px solid rgba(255,190,72,.7);border-radius:999px;padding:9px 14px;background:rgba(8,20,38,.92);color:#ffd177;font:800 11px/1 system-ui;letter-spacing:.08em;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.35)}
      #desktopUpdaterButton[hidden]{display:none}#desktopUpdaterButton:disabled{opacity:.58;cursor:default}
      #desktopUpdaterPanel{position:fixed;inset:0;z-index:10030;display:grid;place-items:center;padding:20px;background:rgba(1,7,16,.72);backdrop-filter:blur(7px)}
      #desktopUpdaterPanel[hidden]{display:none}.desktopUpdaterCard{width:min(480px,calc(100vw - 32px));border:1px solid rgba(255,190,72,.62);border-radius:20px;padding:22px;background:linear-gradient(155deg,rgba(10,29,52,.98),rgba(5,14,28,.98));color:#eef6ff;box-shadow:0 28px 90px rgba(0,0,0,.55)}
      .desktopUpdaterEyebrow{color:#ffbd48;font:900 11px system-ui;letter-spacing:.14em}.desktopUpdaterTitle{margin:8px 0 8px;font:900 25px system-ui}.desktopUpdaterBody{white-space:pre-wrap;color:#c5d5e7;font:600 13px/1.55 system-ui;max-height:180px;overflow:auto}.desktopUpdaterProgress{margin-top:14px;height:6px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden}.desktopUpdaterProgress>i{display:block;width:0;height:100%;background:#ffbd48;transition:width .15s}.desktopUpdaterStatus{margin-top:9px;color:#ffd994;font:700 12px system-ui}.desktopUpdaterActions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}.desktopUpdaterActions button{border-radius:11px;padding:10px 14px;font:800 12px system-ui;cursor:pointer}.desktopUpdaterLater{border:1px solid rgba(255,255,255,.2);background:transparent;color:#dbe8f4}.desktopUpdaterInstall{border:0;background:#ffb83e;color:#172033}.desktopUpdaterInstall:disabled,.desktopUpdaterLater:disabled{opacity:.55;cursor:default}`;
    document.head.appendChild(style);
    const button=document.createElement("button");button.id="desktopUpdaterButton";button.type="button";button.textContent="UPDATE CHECK";button.title="Windows 업데이트 확인";
    const panel=document.createElement("div");panel.id="desktopUpdaterPanel";panel.hidden=true;panel.innerHTML=`<section class="desktopUpdaterCard" role="dialog" aria-modal="true" aria-labelledby="desktopUpdaterTitle"><div class="desktopUpdaterEyebrow">WINDOWS UPDATE</div><h2 class="desktopUpdaterTitle" id="desktopUpdaterTitle">업데이트 확인</h2><div class="desktopUpdaterBody" id="desktopUpdaterBody"></div><div class="desktopUpdaterProgress"><i id="desktopUpdaterBar"></i></div><div class="desktopUpdaterStatus" id="desktopUpdaterStatus"></div><div class="desktopUpdaterActions"><button class="desktopUpdaterLater" id="desktopUpdaterLater" type="button">나중에</button><button class="desktopUpdaterInstall" id="desktopUpdaterInstall" type="button">다운로드 및 설치</button></div></section>`;
    document.body.append(button,panel);
    button.addEventListener("click",()=>checkForUpdate({manual:true}));
    document.getElementById("desktopUpdaterLater").addEventListener("click",()=>{if(!installing)panel.hidden=true;});
    document.getElementById("desktopUpdaterInstall").addEventListener("click",installPendingUpdate);
  }
  function el(id){return document.getElementById(id)}
  function setButton(text,disabled=false){const b=el("desktopUpdaterButton");if(b){b.textContent=text;b.disabled=disabled;}}
  function openPanel(title,body,status,canInstall){
    el("desktopUpdaterTitle").textContent=title;el("desktopUpdaterBody").textContent=body||"";el("desktopUpdaterStatus").textContent=status||"";el("desktopUpdaterBar").style.width="0%";
    el("desktopUpdaterInstall").hidden=!canInstall;el("desktopUpdaterInstall").disabled=false;el("desktopUpdaterLater").disabled=false;el("desktopUpdaterPanel").hidden=false;
  }
  async function checkForUpdate({manual=false}={}){
    if(checking||installing)return;checking=true;setButton("CHECKING…",true);
    try{
      const result=await invoke("check_desktop_update");
      pending=result||null;
      if(pending){
        openPanel(`CIRCLE MIX ${pending.version}`,pending.notes||"새 Windows 업데이트가 준비되었습니다.",`현재 ${pending.currentVersion} → 최신 ${pending.version}`,true);
        setButton(`UPDATE ${pending.version}`,false);
      }else{
        setButton("UP TO DATE",false);
        if(manual)openPanel("최신 버전입니다","현재 설치된 CIRCLE MIX가 최신 상태입니다.","업데이트 없음",false);
      }
    }catch(error){
      setButton("UPDATE CHECK",false);
      if(manual)openPanel("업데이트 확인 실패","인터넷 연결 또는 GitHub Releases의 latest.json을 확인할 수 없습니다. 게임과 로컬 데이터에는 영향이 없습니다.",String(error?.message||error),false);
    }finally{checking=false;}
  }
  async function installPendingUpdate(){
    if(installing)return;installing=true;
    const install=el("desktopUpdaterInstall"),later=el("desktopUpdaterLater"),bar=el("desktopUpdaterBar");install.disabled=true;later.disabled=true;el("desktopUpdaterStatus").textContent="업데이트를 다운로드하고 설치하는 중입니다…";bar.style.width="42%";setButton("UPDATING…",true);
    try{
      await invoke("install_desktop_update");
      bar.style.width="100%";el("desktopUpdaterStatus").textContent="설치 완료. 앱을 다시 시작합니다…";
    }catch(error){
      installing=false;install.disabled=false;later.disabled=false;bar.style.width="0%";setButton("UPDATE RETRY",false);el("desktopUpdaterStatus").textContent=`업데이트 실패: ${String(error?.message||error)}`;
    }
  }
  function boot(){
    createUi();
    window.CircleMixDesktopUpdater=Object.freeze({check:()=>checkForUpdate({manual:true}),state:()=>({checking,installing,pending})});
    setTimeout(()=>{try{sessionStorage.setItem(UPDATE_CHECKED_KEY,"1")}catch(_){ }checkForUpdate({manual:false});},AUTO_CHECK_DELAY_MS);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
