(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root){
    root.CircleMixTrackpad=api;
    api.seedStoredPreset(root);
    if(root.document)api.boot(root,root.document);
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const STORAGE_KEY="circleMixTrackpadSettings.v1";
  const INPUT_SETTINGS_KEY="circleMixInputSettings.v1";
  const PRESET_ORDER=Object.freeze(["OFF","BALANCED","PRECISION","SPEED"]);
  const PRESETS=Object.freeze({
    OFF:Object.freeze({label:"OFF",pcAimMode:null,lockedAimSensitivity:null,aimStabilizer:null,aimVisual:null,aimVisualResponse:null,keyboardOnly:false,jumpGuard:false,gestureGuard:false}),
    BALANCED:Object.freeze({label:"BALANCED",pcAimMode:"LOCKED",lockedAimSensitivity:1,aimStabilizer:"LOW",aimVisual:"SMOOTH",aimVisualResponse:"FAST",keyboardOnly:true,jumpGuard:true,gestureGuard:true}),
    PRECISION:Object.freeze({label:"PRECISION",pcAimMode:"ABSOLUTE",lockedAimSensitivity:1,aimStabilizer:"LOW",aimVisual:"DIRECT",aimVisualResponse:"FAST",keyboardOnly:true,jumpGuard:true,gestureGuard:true}),
    SPEED:Object.freeze({label:"SPEED",pcAimMode:"LOCKED",lockedAimSensitivity:1.25,aimStabilizer:"OFF",aimVisual:"DIRECT",aimVisualResponse:"FAST",keyboardOnly:true,jumpGuard:false,gestureGuard:true})
  });
  const DEFAULT_STATE=Object.freeze({preset:"OFF",keyboardOnly:false,jumpGuard:false,gestureGuard:false});

  function normalizePreset(value){return PRESET_ORDER.includes(String(value||"").toUpperCase())?String(value).toUpperCase():"OFF";}
  function safeJsonParse(value,fallback={}){try{const parsed=JSON.parse(value||"{}");return parsed&&typeof parsed==="object"?parsed:fallback;}catch(_){return fallback;}}
  function sanitizeState(value={}){
    const preset=normalizePreset(value.preset);
    const base=PRESETS[preset];
    return {
      preset,
      keyboardOnly:typeof value.keyboardOnly==="boolean"?value.keyboardOnly:base.keyboardOnly,
      jumpGuard:typeof value.jumpGuard==="boolean"?value.jumpGuard:base.jumpGuard,
      gestureGuard:typeof value.gestureGuard==="boolean"?value.gestureGuard:base.gestureGuard
    };
  }
  function loadState(win){
    try{return sanitizeState(safeJsonParse(win?.localStorage?.getItem(STORAGE_KEY),DEFAULT_STATE));}
    catch(_){return {...DEFAULT_STATE};}
  }
  function saveState(win,state){
    const safe=sanitizeState(state);
    try{win?.localStorage?.setItem(STORAGE_KEY,JSON.stringify(safe));}catch(_){}
    return safe;
  }
  function inputPatchForPreset(name){
    const preset=PRESETS[normalizePreset(name)];
    if(!preset||preset===PRESETS.OFF)return {};
    return {
      pcAimMode:preset.pcAimMode,
      lockedAimSensitivity:preset.lockedAimSensitivity,
      aimStabilizer:preset.aimStabilizer,
      aimVisual:preset.aimVisual,
      aimVisualResponse:preset.aimVisualResponse
    };
  }
  function mergePresetIntoInputSettings(input={},name){
    return {...input,...inputPatchForPreset(name)};
  }
  function seedStoredPreset(win){
    const state=loadState(win);
    if(state.preset==="OFF")return state;
    try{
      const current=safeJsonParse(win?.localStorage?.getItem(INPUT_SETTINGS_KEY),{});
      win?.localStorage?.setItem(INPUT_SETTINGS_KEY,JSON.stringify(mergePresetIntoInputSettings(current,state.preset)));
    }catch(_){}
    return state;
  }
  function jumpThreshold(viewport={}){
    const width=Math.max(1,Number(viewport.width)||1);
    const height=Math.max(1,Number(viewport.height)||1);
    return Math.max(120,Math.min(width,height)*.22);
  }
  function isRecontactJump(previous,current,viewport={}){
    if(!previous||!current)return false;
    const dt=Number(current.time)-Number(previous.time);
    if(!Number.isFinite(dt)||dt<85)return false;
    const distance=Math.hypot(Number(current.x)-Number(previous.x),Number(current.y)-Number(previous.y));
    return Number.isFinite(distance)&&distance>jumpThreshold(viewport);
  }
  function isGameplayActive(doc){
    const body=doc?.body;
    if(!body?.classList?.contains("safeGame"))return false;
    return !body.classList.contains("safeSettings")&&!body.classList.contains("pauseSettingsOpen");
  }
  function isUiTarget(target){
    return !!(target?.closest&&target.closest("button,a,input,select,textarea,#safeMenu,#safeOverlay,.pcSettingsHub,.updateLogOverlay,.keymapOverlay,.pauseOverlay,.tutorialPrompt,.tutorialHud,.tutorialComplete,.tuner,.editorPanel,.start,.quickMenu,.mobileControls,.mobileGameplayControls,.mobileLayoutOverlay,.mobileInputTestOverlay,.selfTestOverlay"));
  }
  function createCard(doc,{id,group,title,description,keywords,onClick}){
    const card=doc.createElement("article");
    card.className="pcSettingCard";
    card.dataset.setting=id;
    card.dataset.group=group;
    card.dataset.search=[title,description,keywords,group].join(" ").toLowerCase();
    card.dataset.quick="false";
    const copy=doc.createElement("div");
    copy.className="pcSettingCopy";
    copy.innerHTML=`<div class="pcSettingTitleRow"><h4>${title}</h4><span class="pcSettingChanged" aria-label="변경됨">●</span></div><p>${description}</p>`;
    const control=doc.createElement("div");
    control.className="pcSettingControl";
    const button=doc.createElement("button");
    button.type="button";
    button.className="pcSettingAction";
    button.addEventListener("click",onClick);
    control.appendChild(button);
    card.append(copy,control);
    card._button=button;
    return card;
  }
  function setCardChanged(card,changed){card?.classList?.toggle("isChanged",!!changed);}
  function refreshNavCount(hub,group){
    const section=hub.querySelector(`.pcSettingsSection[data-group="${group}"]`);
    const count=section?.querySelectorAll(".pcSettingCard").length||0;
    const em=hub.querySelector(`.pcSettingsNavButton[data-group="${group}"] em`);
    if(em)em.textContent=String(count);
  }
  function delay(win,ms){return new Promise(resolve=>win.setTimeout(resolve,ms));}
  async function cycleButtonTo(win,doc,id,match,maxClicks=8){
    const button=doc.getElementById(id);
    if(!button||typeof button.click!=="function")return false;
    for(let i=0;i<=maxClicks;i++){
      if(match(String(button.textContent||"").toUpperCase()))return true;
      button.click();
      await delay(win,230);
    }
    return match(String(button.textContent||"").toUpperCase());
  }
  async function syncRuntimePreset(win,doc,name){
    const preset=PRESETS[normalizePreset(name)];
    if(!preset||name==="OFF")return true;
    const tasks=[
      cycleButtonTo(win,doc,"pauseSetPcAim",text=>text.includes(preset.pcAimMode),4),
      cycleButtonTo(win,doc,"pauseSetAimStabilizer",text=>text.includes(preset.aimStabilizer),4),
      cycleButtonTo(win,doc,"pauseSetAimVisual",text=>text.includes(preset.aimVisual),3)
    ];
    if(preset.pcAimMode==="LOCKED"){
      const expected=preset.lockedAimSensitivity.toFixed(2);
      tasks.push(cycleButtonTo(win,doc,"pauseSetLockedSensitivity",text=>text.includes(expected),8));
    }
    const results=await Promise.all(tasks);
    return results.every(Boolean);
  }
  function applyGuardStyles(doc,enabled){
    const canvas=doc.getElementById("game");
    const root=doc.getElementById("gameRoot");
    for(const el of [canvas,root]){
      if(!el?.style)continue;
      if(enabled){
        el.style.touchAction="none";
        el.style.overscrollBehavior="none";
        el.style.userSelect="none";
      }else{
        el.style.removeProperty("touch-action");
        el.style.removeProperty("overscroll-behavior");
        el.style.removeProperty("user-select");
      }
    }
  }
  function dispatchStablePointer(win,previous,event){
    const init={bubbles:true,cancelable:true,clientX:previous.x,clientY:previous.y,screenX:event.screenX||0,screenY:event.screenY||0,buttons:event.buttons||0,button:event.button||0,pointerId:event.pointerId||1,pointerType:"mouse",isPrimary:true,movementX:0,movementY:0};
    let replacement;
    try{replacement=new win.PointerEvent("pointermove",init);}
    catch(_){replacement=new win.MouseEvent("mousemove",init);}
    win.dispatchEvent(replacement);
  }
  function boot(win,doc){
    if(!win||!doc||win.__circleMixTrackpadBooted)return;
    win.__circleMixTrackpadBooted=true;
    const safeStartButton=doc.getElementById("safeStart");
    if(safeStartButton)safeStartButton.style.animation="none";

    let state=loadState(win);
    let lastPointer=null;
    const cards={};

    function refreshCards(status=""){
      if(cards.preset){
        cards.preset._button.textContent=`TRACKPAD ${state.preset}`;
        setCardChanged(cards.preset,state.preset!=="OFF");
        const p=cards.preset.querySelector("p");
        if(p)p.textContent=status||"권장 에임 방식·감도·안정화를 한 번에 적용합니다.";
      }
      if(cards.keyboardOnly){cards.keyboardOnly._button.textContent=`CLICK JUDGEMENT ${state.keyboardOnly?"OFF":"ON"}`;setCardChanged(cards.keyboardOnly,state.keyboardOnly);}
      if(cards.jumpGuard){cards.jumpGuard._button.textContent=`RECONTACT GUARD ${state.jumpGuard?"ON":"OFF"}`;setCardChanged(cards.jumpGuard,state.jumpGuard);}
      if(cards.gestureGuard){cards.gestureGuard._button.textContent=`GESTURE GUARD ${state.gestureGuard?"ON":"OFF"}`;setCardChanged(cards.gestureGuard,state.gestureGuard);}
      applyGuardStyles(doc,state.gestureGuard);
    }
    async function applyPreset(name){
      const preset=PRESETS[normalizePreset(name)];
      state=saveState(win,{preset:preset.label,keyboardOnly:preset.keyboardOnly,jumpGuard:preset.jumpGuard,gestureGuard:preset.gestureGuard});
      seedStoredPreset(win);
      refreshCards("적용 중…");
      const live=await syncRuntimePreset(win,doc,preset.label);
      refreshCards(live?"즉시 적용됨 · 판정키는 Z / X / SPACE":"저장됨 · 다음 게임 시작 또는 앱 재시작 후 완전 적용");
      return state;
    }
    function toggle(key){
      state=saveState(win,{...state,[key]:!state[key]});
      refreshCards();
      return state;
    }
    function desktopUpdateCheck(){
      const api=win.CircleMixDesktopUpdater;
      if(api?.check)return api.check();
      const button=doc.getElementById("desktopUpdaterButton");
      if(button?.click)return button.click();
      win.alert?.("Windows 설치판에서만 업데이트를 확인할 수 있습니다.");
    }
    function injectHub(){
      const hub=doc.getElementById("pcSettingsHub");
      if(!hub||hub.dataset.trackpadEnhanced==="true")return false;
      const inputGrid=hub.querySelector('.pcSettingsSection[data-group="input"] .pcSettingsGrid');
      if(!inputGrid)return false;
      hub.dataset.trackpadEnhanced="true";
      cards.preset=createCard(doc,{id:"trackpadPreset",group:"input",title:"트랙패드 프리셋",description:"권장 에임 방식·감도·안정화를 한 번에 적용합니다.",keywords:"trackpad touchpad preset 트랙패드 터치패드",onClick:()=>{const next=PRESET_ORDER[(PRESET_ORDER.indexOf(state.preset)+1)%PRESET_ORDER.length];applyPreset(next);}});
      cards.keyboardOnly=createCard(doc,{id:"trackpadKeyboardOnly",group:"input",title:"키보드 판정 전용",description:"트랙패드 클릭으로 CUT이 오입력되는 것을 막고 Z·X·SPACE만 사용합니다.",keywords:"keyboard click tap 키보드 클릭 탭 오입력",onClick:()=>toggle("keyboardOnly")});
      cards.jumpGuard=createCard(doc,{id:"trackpadJumpGuard",group:"input",title:"재접촉 튐 방지",description:"손가락을 떼었다 다시 놓을 때 발생하는 비정상적인 순간이동만 차단합니다.",keywords:"recontact jump teleport 튐 재접촉",onClick:()=>toggle("jumpGuard")});
      cards.gestureGuard=createCard(doc,{id:"trackpadGestureGuard",group:"input",title:"브라우저 제스처 차단",description:"플레이 중 스크롤·확대·뒤로가기 제스처 간섭을 줄입니다.",keywords:"gesture wheel scroll zoom 제스처 스크롤",onClick:()=>toggle("gestureGuard")});
      inputGrid.append(cards.preset,cards.keyboardOnly,cards.jumpGuard,cards.gestureGuard);
      refreshNavCount(hub,"input");

      const desktopEnabled=win.CircleMixBuildConfig?.target==="desktop"||win.CircleMixBuildConfig?.enableSignedUpdater===true||!!win.CircleMixDesktopUpdater;
      const systemGrid=hub.querySelector('.pcSettingsSection[data-group="system"] .pcSettingsGrid');
      if(desktopEnabled&&systemGrid){
        cards.desktopUpdate=createCard(doc,{id:"desktopUpdateCheck",group:"system",title:"Windows 업데이트 확인",description:"GitHub Releases의 서명된 최신 설치판을 확인하고 앱 안에서 설치합니다.",keywords:"windows desktop update updater pc 업데이트",onClick:desktopUpdateCheck});
        cards.desktopUpdate._button.textContent="업데이트 확인";
        systemGrid.append(cards.desktopUpdate);
        refreshNavCount(hub,"system");
      }
      refreshCards();
      return true;
    }
    const install=()=>{
      injectHub();
      if(win.MutationObserver){
        const observer=new win.MutationObserver(()=>injectHub());
        observer.observe(doc.documentElement,{childList:true,subtree:true});
      }
    };
    if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",install,{once:true});
    else install();

    win.addEventListener("mousedown",event=>{
      if(!state.keyboardOnly||event.button!==0||!isGameplayActive(doc)||isUiTarget(event.target))return;
      const canvas=doc.getElementById("game");
      if(event.target!==canvas&&!canvas?.contains?.(event.target))return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },true);
    const blockGesture=event=>{
      if(!state.gestureGuard||!isGameplayActive(doc)||isUiTarget(event.target))return;
      if(event.cancelable)event.preventDefault();
    };
    win.addEventListener("wheel",blockGesture,{capture:true,passive:false});
    win.addEventListener("contextmenu",blockGesture,{capture:true,passive:false});
    for(const type of ["gesturestart","gesturechange","gestureend"])win.addEventListener(type,blockGesture,{capture:true,passive:false});

    win.addEventListener("pointermove",event=>{
      if(!event.isTrusted||event.pointerType&&event.pointerType!=="mouse")return;
      if(!state.jumpGuard||!isGameplayActive(doc)||doc.pointerLockElement)return;
      if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return;
      const current={x:event.clientX,y:event.clientY,time:Number.isFinite(event.timeStamp)?event.timeStamp:win.performance.now()};
      if(isRecontactJump(lastPointer,current,{width:win.innerWidth,height:win.innerHeight})){
        event.preventDefault();
        event.stopImmediatePropagation();
        dispatchStablePointer(win,lastPointer,event);
        lastPointer={...lastPointer,time:current.time};
        return;
      }
      lastPointer=current;
    },true);
    const resetPointer=()=>{lastPointer=null;};
    win.addEventListener("blur",resetPointer);
    doc.addEventListener("visibilitychange",()=>{if(doc.hidden)resetPointer();});
    doc.addEventListener("pointerlockchange",resetPointer);

    Object.assign(win.CircleMixTrackpad,{
      getSettings:()=>({...state}),
      applyPreset,
      toggleKeyboardOnly:()=>toggle("keyboardOnly"),
      toggleJumpGuard:()=>toggle("jumpGuard"),
      toggleGestureGuard:()=>toggle("gestureGuard"),
      checkDesktopUpdate:desktopUpdateCheck,
      injectSettings:injectHub
    });
    refreshCards();
  }

  return {
    STORAGE_KEY,INPUT_SETTINGS_KEY,PRESET_ORDER,PRESETS,
    normalizePreset,sanitizeState,loadState,saveState,inputPatchForPreset,
    mergePresetIntoInputSettings,seedStoredPreset,jumpThreshold,isRecontactJump,
    isGameplayActive,boot
  };
});
