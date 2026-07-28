(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root){
    root.CircleMixTrackpadTabletArea=api;
    if(root.document)api.boot(root,root.document);
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="trackpad-tablet-area-v1";
  const STORAGE_KEY="circleMixTrackpadTabletArea.v1";
  const TRACKPAD_STORAGE_KEY="circleMixTrackpadSettings.v1";
  const INPUT_SETTINGS_KEY="circleMixInputSettings.v1";
  const TABLET_PRESET="TABLET_AREA";
  const DEFAULTS=Object.freeze({x:.18,y:.12,width:.64,height:.76,rotation:0,mirrorX:false,mirrorY:false,deadzone:.06});
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
  const bool=(value,fallback)=>typeof value==="boolean"?value:fallback;
  const normalizeAngle=value=>{
    const tau=Math.PI*2;
    let angle=finite(value,0)%tau;
    if(angle<=-Math.PI)angle+=tau;
    if(angle>Math.PI)angle-=tau;
    return angle;
  };

  function sanitizeSettings(value={}){
    const width=clamp(finite(value.width,DEFAULTS.width),.20,.96);
    const height=clamp(finite(value.height,DEFAULTS.height),.20,.96);
    return {
      x:clamp(finite(value.x,DEFAULTS.x),0,1-width),
      y:clamp(finite(value.y,DEFAULTS.y),0,1-height),
      width,
      height,
      rotation:((Math.round(finite(value.rotation,DEFAULTS.rotation)/90)*90)%360+360)%360,
      mirrorX:bool(value.mirrorX,DEFAULTS.mirrorX),
      mirrorY:bool(value.mirrorY,DEFAULTS.mirrorY),
      deadzone:clamp(finite(value.deadzone,DEFAULTS.deadzone),0,.22)
    };
  }
  function readSettings(win){
    try{return sanitizeSettings(JSON.parse(win?.localStorage?.getItem(STORAGE_KEY)||"{}"));}
    catch(_){return {...DEFAULTS};}
  }
  function writeSettings(win,value){
    const safe=sanitizeSettings(value);
    try{win?.localStorage?.setItem(STORAGE_KEY,JSON.stringify(safe));}catch(_){ }
    try{win?.dispatchEvent(new win.CustomEvent("circlemix:trackpadtabletarea",{detail:{...safe}}));}catch(_){ }
    return safe;
  }
  function presetFromStorage(win){
    try{return String(JSON.parse(win?.localStorage?.getItem(TRACKPAD_STORAGE_KEY)||"{}").preset||"OFF").toUpperCase();}
    catch(_){return "OFF";}
  }
  function activePreset(win){
    return String(win?.CircleMixTrackpad?.getSettings?.().preset||presetFromStorage(win)).toUpperCase()===TABLET_PRESET;
  }
  function viewportSize(win){
    const vv=win?.visualViewport;
    return {width:Math.max(1,finite(vv?.width,finite(win?.innerWidth,1))),height:Math.max(1,finite(vv?.height,finite(win?.innerHeight,1))),left:Math.max(0,finite(vv?.offsetLeft,0)),top:Math.max(0,finite(vv?.offsetTop,0))};
  }
  function areaRect(settings,viewport={width:1280,height:720,left:0,top:0}){
    const safe=sanitizeSettings(settings);
    const width=Math.max(1,finite(viewport.width,1)),height=Math.max(1,finite(viewport.height,1));
    const left=finite(viewport.left,0)+safe.x*width,top=finite(viewport.top,0)+safe.y*height;
    return {left,top,width:safe.width*width,height:safe.height*height,right:left+safe.width*width,bottom:top+safe.height*height};
  }
  function mapPointToAngle(point,rect,settings=DEFAULTS,previousAngle=-Math.PI/2){
    const safe=sanitizeSettings(settings);
    let u=clamp((finite(point?.x,rect.left)-rect.left)/Math.max(1,rect.width),0,1);
    let v=clamp((finite(point?.y,rect.top)-rect.top)/Math.max(1,rect.height),0,1);
    if(safe.mirrorX)u=1-u;
    if(safe.mirrorY)v=1-v;
    const nx=u*2-1,ny=v*2-1;
    const distance=Math.hypot(nx,ny);
    if(distance<=safe.deadzone)return {angle:normalizeAngle(previousAngle),u,v,nx,ny,distance,deadzone:true};
    const rotation=safe.rotation*Math.PI/180;
    return {angle:normalizeAngle(Math.atan2(ny,nx)+rotation),u,v,nx,ny,distance,deadzone:false};
  }
  function virtualAimPoint(canvasRect,angle){
    const width=Math.max(1,finite(canvasRect?.width,1)),height=Math.max(1,finite(canvasRect?.height,1));
    const radius=Math.max(64,Math.min(width,height)*.34);
    return {x:finite(canvasRect?.left,0)+width/2+Math.cos(angle)*radius,y:finite(canvasRect?.top,0)+height/2+Math.sin(angle)*radius,radius};
  }
  function isDesktopEnvironment(win){
    if(!win)return false;
    if(win.CircleMixBuildConfig?.target==="android")return false;
    const coarse=!!win.matchMedia?.("(pointer: coarse)").matches;
    const touch=(Number(win.navigator?.maxTouchPoints)||0)>0;
    return !(coarse&&touch);
  }
  function isGameplayActive(doc){
    const body=doc?.body;
    return !!body?.classList?.contains("safeGame")&&!body.classList.contains("safeSettings")&&!body.classList.contains("pauseSettingsOpen");
  }
  function isUiTarget(target){return !!(target?.closest&&target.closest("button,a,input,select,textarea,#safeMenu,#safeOverlay,.pcSettingsHub,.trackpadTabletOverlay,.updateLogOverlay,.keymapOverlay,.pauseOverlay,.tutorialPrompt,.tutorialHud,.tutorialComplete,.tuner,.editorPanel,.start,.quickMenu,.mobileControls,.mobileGameplayControls,.selfTestOverlay"));}
  function create(doc,tag,className,text){const element=doc.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;}

  function installPointerMapping(win,doc,getSettings){
    if(!win?.PointerEvent||win.__circleMixTabletAreaPointerInstalled)return null;
    win.__circleMixTabletAreaPointerInstalled=true;
    const synthetic=new WeakSet();
    const state={angle:-Math.PI/2,lastInput:null,mappedCount:0};
    const enabled=()=>isDesktopEnvironment(win)&&activePreset(win)&&isGameplayActive(doc)&&!doc.pointerLockElement;
    const dispatch=(source,angle)=>{
      const canvas=doc.getElementById("game");
      if(!canvas)return false;
      const point=virtualAimPoint(canvas.getBoundingClientRect(),angle);
      let replacement;
      const init={bubbles:true,cancelable:true,composed:true,pointerId:source.pointerId||1,pointerType:"mouse",isPrimary:true,clientX:point.x,clientY:point.y,screenX:point.x,screenY:point.y,buttons:source.buttons||0,button:source.button??-1,movementX:0,movementY:0,pressure:source.buttons?0.5:0};
      try{replacement=new win.PointerEvent("pointermove",init);}catch(_){return false;}
      synthetic.add(replacement);win.dispatchEvent(replacement);state.mappedCount++;return true;
    };
    const move=event=>{
      if(synthetic.has(event)||!event.isTrusted||event.pointerType&&event.pointerType!=="mouse"||!enabled()||isUiTarget(event.target))return;
      if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return;
      const settings=sanitizeSettings(getSettings?.()||readSettings(win));
      const rect=areaRect(settings,viewportSize(win));
      const mapped=mapPointToAngle({x:event.clientX,y:event.clientY},rect,settings,state.angle);
      state.angle=mapped.angle;state.lastInput={x:event.clientX,y:event.clientY,u:mapped.u,v:mapped.v,deadzone:mapped.deadzone};
      if(event.cancelable)event.preventDefault();
      event.stopImmediatePropagation();
      dispatch(event,state.angle);
    };
    win.addEventListener("pointermove",move,{capture:true,passive:false});
    const reset=()=>{state.lastInput=null;};
    win.addEventListener("blur",reset);doc.addEventListener("pointerlockchange",reset);doc.addEventListener("visibilitychange",()=>{if(doc.hidden)reset();});
    return Object.freeze({state:()=>({...state,lastInput:state.lastInput?{...state.lastInput}:null}),reset});
  }

  function boot(win,doc){
    if(!win||!doc||win.__circleMixTrackpadTabletAreaBooted||!isDesktopEnvironment(win))return null;
    win.__circleMixTrackpadTabletAreaBooted=true;
    const state={saved:readSettings(win),draft:null,snapshot:null,open:false,pointer:null};
    const overlay=create(doc,"section","trackpadTabletOverlay");
    overlay.id="trackpadTabletOverlay";overlay.hidden=true;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-labelledby","trackpadTabletTitle");
    overlay.innerHTML=`<div class="trackpadTabletShell"><header><div><span>TRACKPAD · TABLET AREA</span><h2 id="trackpadTabletTitle">가상 태블릿 영역</h2><p>사각형 안의 커서 위치를 원형 에임 각도에 절대 대응시킵니다.</p></div><button id="trackpadTabletClose" type="button" aria-label="취소">×</button></header><div class="trackpadTabletPreview" id="trackpadTabletPreview"><div class="trackpadTabletScreenLabel">CURSOR WORKSPACE</div><div class="trackpadTabletArea" id="trackpadTabletArea"><i></i><span>TABLET AREA</span><button id="trackpadTabletResize" type="button" aria-label="영역 크기 조정"></button></div><div class="trackpadTabletCenter"></div></div><output id="trackpadTabletStatus">READY</output><div class="trackpadTabletTools"><button id="trackpadTabletSmaller" type="button">전체 축소</button><button id="trackpadTabletLarger" type="button">전체 확대</button><button id="trackpadTabletWidthDown" type="button">가로 −</button><button id="trackpadTabletWidthUp" type="button">가로 ＋</button><button id="trackpadTabletHeightDown" type="button">세로 −</button><button id="trackpadTabletHeightUp" type="button">세로 ＋</button><button id="trackpadTabletCenterArea" type="button">가운데 정렬</button><button id="trackpadTabletRotate" type="button">회전</button><button id="trackpadTabletMirrorX" type="button">좌우 반전</button><button id="trackpadTabletMirrorY" type="button">상하 반전</button><button id="trackpadTabletDeadzoneDown" type="button">중앙 데드존 −</button><button id="trackpadTabletDeadzoneUp" type="button">중앙 데드존 ＋</button><button id="trackpadTabletReset" type="button">초기화</button></div><footer><div><strong id="trackpadTabletSummary">READY</strong><span>Z / X / SPACE 판정 권장</span></div><button id="trackpadTabletCancel" type="button">취소</button><button id="trackpadTabletSave" type="button">저장·적용</button></footer></div>`;
    doc.body.appendChild(overlay);
    const preview=overlay.querySelector("#trackpadTabletPreview"),area=overlay.querySelector("#trackpadTabletArea"),resizeHandle=overlay.querySelector("#trackpadTabletResize"),status=overlay.querySelector("#trackpadTabletStatus"),summary=overlay.querySelector("#trackpadTabletSummary");
    const button=id=>overlay.querySelector(`#${id}`);
    function render(){
      if(!state.open||!state.draft)return;
      const safe=sanitizeSettings(state.draft);state.draft=safe;
      area.style.left=`${safe.x*100}%`;area.style.top=`${safe.y*100}%`;area.style.width=`${safe.width*100}%`;area.style.height=`${safe.height*100}%`;
      area.classList.toggle("mirrorX",safe.mirrorX);area.classList.toggle("mirrorY",safe.mirrorY);
      area.style.setProperty("--tablet-rotation",`${safe.rotation}deg`);
      summary.textContent=`${Math.round(safe.width*100)}% × ${Math.round(safe.height*100)}% · ROT ${safe.rotation}° · DEAD ${Math.round(safe.deadzone*100)}%`;
      status.textContent=`POSITION ${Math.round(safe.x*100)}% / ${Math.round(safe.y*100)}% · MIRROR ${safe.mirrorX?"X":"-"}${safe.mirrorY?"Y":"-"}`;
      button("trackpadTabletRotate").textContent=`회전 ${safe.rotation}°`;
      button("trackpadTabletMirrorX").classList.toggle("on",safe.mirrorX);button("trackpadTabletMirrorY").classList.toggle("on",safe.mirrorY);
    }
    function setDraft(patch){state.draft=sanitizeSettings({...state.draft,...patch});render();}
    function resizeAroundCenter(width,height){const current=sanitizeSettings(state.draft);const nextWidth=clamp(width,.2,.96),nextHeight=clamp(height,.2,.96);setDraft({width:nextWidth,height:nextHeight,x:clamp(current.x+(current.width-nextWidth)/2,0,1-nextWidth),y:clamp(current.y+(current.height-nextHeight)/2,0,1-nextHeight)});}
    function open(){state.saved=readSettings(win);state.snapshot={...state.saved};state.draft={...state.saved};state.open=true;overlay.hidden=false;doc.body.classList.add("trackpadTabletOpen");render();}
    function close(save){
      if(save){state.saved=writeSettings(win,state.draft);const apply=win.CircleMixTrackpad?.applyPreset;if(typeof apply==="function")apply(TABLET_PRESET);else{try{win.localStorage.setItem(TRACKPAD_STORAGE_KEY,JSON.stringify({preset:TABLET_PRESET,keyboardOnly:true,jumpGuard:false,gestureGuard:true}));const input=JSON.parse(win.localStorage.getItem(INPUT_SETTINGS_KEY)||"{}");win.localStorage.setItem(INPUT_SETTINGS_KEY,JSON.stringify({...input,pcAimMode:"ABSOLUTE",lockedAimSensitivity:1,aimStabilizer:"OFF",aimVisual:"DIRECT",aimVisualResponse:"FAST"}));}catch(_){ }}}
      else if(state.snapshot)state.saved=sanitizeSettings(state.snapshot);
      state.open=false;state.draft=null;state.snapshot=null;overlay.hidden=true;doc.body.classList.remove("trackpadTabletOpen");
    }
    function bindAreaDrag(){
      area.addEventListener("pointerdown",event=>{
        if(!state.open||event.target===resizeHandle)return;event.preventDefault();event.stopPropagation();
        const start={x:event.clientX,y:event.clientY,settings:{...state.draft}};try{area.setPointerCapture(event.pointerId);}catch(_){ }
        const move=ev=>{const rect=preview.getBoundingClientRect();setDraft({x:start.settings.x+(ev.clientX-start.x)/Math.max(1,rect.width),y:start.settings.y+(ev.clientY-start.y)/Math.max(1,rect.height)});};
        const end=()=>{area.removeEventListener("pointermove",move);area.removeEventListener("pointerup",end);area.removeEventListener("pointercancel",end);};
        area.addEventListener("pointermove",move);area.addEventListener("pointerup",end);area.addEventListener("pointercancel",end);
      },{passive:false});
      resizeHandle.addEventListener("pointerdown",event=>{
        if(!state.open)return;event.preventDefault();event.stopPropagation();
        const rect=preview.getBoundingClientRect(),start={x:event.clientX,y:event.clientY,settings:{...state.draft}};try{resizeHandle.setPointerCapture(event.pointerId);}catch(_){ }
        const move=ev=>setDraft({width:start.settings.width+(ev.clientX-start.x)/Math.max(1,rect.width),height:start.settings.height+(ev.clientY-start.y)/Math.max(1,rect.height)});
        const end=()=>{resizeHandle.removeEventListener("pointermove",move);resizeHandle.removeEventListener("pointerup",end);resizeHandle.removeEventListener("pointercancel",end);};
        resizeHandle.addEventListener("pointermove",move);resizeHandle.addEventListener("pointerup",end);resizeHandle.addEventListener("pointercancel",end);
      },{passive:false});
    }
    bindAreaDrag();
    button("trackpadTabletClose").addEventListener("click",()=>close(false));button("trackpadTabletCancel").addEventListener("click",()=>close(false));button("trackpadTabletSave").addEventListener("click",()=>close(true));
    button("trackpadTabletSmaller").addEventListener("click",()=>resizeAroundCenter(state.draft.width-.06,state.draft.height-.06));button("trackpadTabletLarger").addEventListener("click",()=>resizeAroundCenter(state.draft.width+.06,state.draft.height+.06));
    button("trackpadTabletWidthDown").addEventListener("click",()=>resizeAroundCenter(state.draft.width-.04,state.draft.height));button("trackpadTabletWidthUp").addEventListener("click",()=>resizeAroundCenter(state.draft.width+.04,state.draft.height));
    button("trackpadTabletHeightDown").addEventListener("click",()=>resizeAroundCenter(state.draft.width,state.draft.height-.04));button("trackpadTabletHeightUp").addEventListener("click",()=>resizeAroundCenter(state.draft.width,state.draft.height+.04));
    button("trackpadTabletCenterArea").addEventListener("click",()=>setDraft({x:(1-state.draft.width)/2,y:(1-state.draft.height)/2}));button("trackpadTabletRotate").addEventListener("click",()=>setDraft({rotation:(state.draft.rotation+90)%360}));
    button("trackpadTabletMirrorX").addEventListener("click",()=>setDraft({mirrorX:!state.draft.mirrorX}));button("trackpadTabletMirrorY").addEventListener("click",()=>setDraft({mirrorY:!state.draft.mirrorY}));
    button("trackpadTabletDeadzoneDown").addEventListener("click",()=>setDraft({deadzone:state.draft.deadzone-.01}));button("trackpadTabletDeadzoneUp").addEventListener("click",()=>setDraft({deadzone:state.draft.deadzone+.01}));button("trackpadTabletReset").addEventListener("click",()=>setDraft(DEFAULTS));
    overlay.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();close(false);}});
    state.pointer=installPointerMapping(win,doc,()=>state.open&&state.draft?state.draft:state.saved);
    const api={open,close,render,state:()=>({open:state.open,saved:{...state.saved},draft:state.draft?{...state.draft}:null,active:activePreset(win),pointer:state.pointer?.state?.()||null}),setDraft};
    win.CircleMixTrackpadTabletArea={...win.CircleMixTrackpadTabletArea,...api};return api;
  }

  return Object.freeze({VERSION,STORAGE_KEY,TRACKPAD_STORAGE_KEY,INPUT_SETTINGS_KEY,TABLET_PRESET,DEFAULTS,sanitizeSettings,readSettings,writeSettings,presetFromStorage,activePreset,viewportSize,areaRect,mapPointToAngle,virtualAimPoint,isDesktopEnvironment,isGameplayActive,installPointerMapping,boot});
});
