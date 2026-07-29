(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){
    root.CircleMixMobileLayoutV2=api;
    if(root.document)api.autoMount(root.document,root);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='mobile-layout-v2';
  const INPUT_VERSION='mobile-input-v3';
  const STORAGE_KEY='circleMixInputSettings.v1';
  const PRESETS=Object.freeze(['STANDARD','LEFT_HANDED','RIGHT_HANDED','CUSTOM']);
  const AIM_PRESETS=Object.freeze(['ABSOLUTE','BALANCED','PRECISION','SPEED']);
  const AIM_PROFILES=Object.freeze({
    ABSOLUTE:Object.freeze({mode:'ABSOLUTE',sensitivity:1}),
    BALANCED:Object.freeze({mode:'RELATIVE',sensitivity:1}),
    PRECISION:Object.freeze({mode:'RELATIVE',sensitivity:.82}),
    SPEED:Object.freeze({mode:'RELATIVE',sensitivity:1.28})
  });
  const DEFAULTS=Object.freeze({
    mobileControlPreset:'STANDARD',
    mobileActionSize:88,
    mobilePulseSize:96,
    mobileButtonOpacity:.68,
    mobileControlGap:18,
    mobileActionX:null,
    mobileActionY:null,
    mobilePulseX:null,
    mobilePulseY:null,
    mobileAimPreset:'ABSOLUTE',
    mobileAimSensitivity:1,
    mobileAimRecontactGuard:true,
    mobileGestureGuard:true
  });

  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
  const finiteRange=(value,min,max,fallback)=>clamp(finite(value,fallback),min,max);
  const finite01=(value,fallback=null)=>Number.isFinite(Number(value))?clamp(Number(value),0,1):fallback;
  const bool=(value,fallback)=>typeof value==='boolean'?value:fallback;
  const normalizeAngle=value=>{
    const tau=Math.PI*2;
    let angle=finite(value,0)%tau;
    if(angle<=-Math.PI)angle+=tau;
    if(angle>Math.PI)angle-=tau;
    return angle;
  };

  function defaultAimPreset(win){
    return win?.CircleMixBuildConfig?.target==='android'?'BALANCED':'ABSOLUTE';
  }

  function defaultsFor(win){
    const mobileAimPreset=defaultAimPreset(win);
    return {...DEFAULTS,mobileAimPreset,mobileAimSensitivity:AIM_PROFILES[mobileAimPreset].sensitivity};
  }

  function sanitizeSettings(input={},fallbacks=DEFAULTS){
    const preset=PRESETS.includes(input.mobileControlPreset)?input.mobileControlPreset:'STANDARD';
    const aimPreset=AIM_PRESETS.includes(input.mobileAimPreset)?input.mobileAimPreset:(AIM_PRESETS.includes(fallbacks.mobileAimPreset)?fallbacks.mobileAimPreset:'ABSOLUTE');
    const legacyPulseX=finite01(input.mobileScratchX,null);
    const legacyPulseY=finite01(input.mobileScratchY,null);
    const pulseX=finite01(input.mobilePulseX,legacyPulseX);
    const pulseY=finite01(input.mobilePulseY,legacyPulseY);
    const profile=AIM_PROFILES[aimPreset]||AIM_PROFILES.ABSOLUTE;
    return {
      ...input,
      mobileControlPreset:preset,
      mobileActionSize:finiteRange(input.mobileActionSize,64,132,fallbacks.mobileActionSize??DEFAULTS.mobileActionSize),
      mobilePulseSize:finiteRange(input.mobilePulseSize ?? input.mobileScratchSize,72,140,fallbacks.mobilePulseSize??DEFAULTS.mobilePulseSize),
      mobileButtonOpacity:finiteRange(input.mobileButtonOpacity,.35,1,fallbacks.mobileButtonOpacity??DEFAULTS.mobileButtonOpacity),
      mobileControlGap:finiteRange(input.mobileControlGap,4,36,fallbacks.mobileControlGap??DEFAULTS.mobileControlGap),
      mobileActionX:finite01(input.mobileActionX,null),
      mobileActionY:finite01(input.mobileActionY,null),
      mobilePulseX:pulseX,
      mobilePulseY:pulseY,
      mobileAimPreset:aimPreset,
      mobileAimSensitivity:finiteRange(input.mobileAimSensitivity,.55,1.7,profile.sensitivity),
      mobileAimRecontactGuard:bool(input.mobileAimRecontactGuard,fallbacks.mobileAimRecontactGuard??true),
      mobileGestureGuard:bool(input.mobileGestureGuard,fallbacks.mobileGestureGuard??true)
    };
  }

  function pointFromPixels(x,y,width,height){
    return {x:clamp(x/Math.max(1,width),0,1),y:clamp(y/Math.max(1,height),0,1)};
  }

  function presetLayout(preset='STANDARD',width=1280,height=720,settings=DEFAULTS){
    const safe=sanitizeSettings(settings);
    const gap=safe.mobileControlGap;
    const actionHalf=safe.mobileActionSize/2;
    const pulseHalf=safe.mobilePulseSize/2;
    const leftAction=gap+actionHalf;
    const rightAction=Math.max(leftAction,width-gap-actionHalf);
    const leftPulse=gap+pulseHalf;
    const rightPulse=Math.max(leftPulse,width-gap-pulseHalf);
    const bottomAction=Math.max(58+actionHalf,height-gap-actionHalf);
    const bottomPulse=Math.max(58+pulseHalf,height-gap-pulseHalf);
    const upperPulse=Math.max(58+pulseHalf,bottomPulse-safe.mobilePulseSize-20);
    if(preset==='LEFT_HANDED')return {...pointFromPixels(leftAction,bottomAction,width,height),pulse:pointFromPixels(rightPulse,bottomPulse,width,height)};
    if(preset==='RIGHT_HANDED')return {...pointFromPixels(rightAction,bottomAction,width,height),pulse:pointFromPixels(rightPulse,upperPulse,width,height)};
    return {...pointFromPixels(rightAction,bottomAction,width,height),pulse:pointFromPixels(leftPulse,bottomPulse,width,height)};
  }

  function resolveLayout(input,width=1280,height=720){
    const settings=sanitizeSettings(input);
    const preset=presetLayout(settings.mobileControlPreset,width,height,settings);
    const custom=settings.mobileControlPreset==='CUSTOM';
    const action={
      x:custom&&settings.mobileActionX!==null?settings.mobileActionX:preset.x,
      y:custom&&settings.mobileActionY!==null?settings.mobileActionY:preset.y
    };
    const pulse={
      x:custom&&settings.mobilePulseX!==null?settings.mobilePulseX:preset.pulse.x,
      y:custom&&settings.mobilePulseY!==null?settings.mobilePulseY:preset.pulse.y
    };
    return {settings,action,pulse};
  }

  function clampPoint(point,size,width,height,gap=18){
    const half=size/2;
    const minX=gap+half,maxX=Math.max(minX,width-gap-half);
    const minY=58+half,maxY=Math.max(minY,height-gap-half);
    return {x:clamp(point.x*width,minX,maxX)/Math.max(1,width),y:clamp(point.y*height,minY,maxY)/Math.max(1,height)};
  }

  function layoutPixels(input,width=1280,height=720){
    const resolved=resolveLayout(input,width,height);
    const action=clampPoint(resolved.action,resolved.settings.mobileActionSize,width,height,resolved.settings.mobileControlGap);
    const pulse=clampPoint(resolved.pulse,resolved.settings.mobilePulseSize,width,height,resolved.settings.mobileControlGap);
    return {...resolved,action,pulse,actionPx:{x:action.x*width,y:action.y*height},pulsePx:{x:pulse.x*width,y:pulse.y*height}};
  }

  function isMobileEnvironment(win){
    if(!win)return false;
    try{
      const query=new URLSearchParams(win.location?.search||'');
      if(query.get('mobileLayoutV2')==='1')return true;
      if(query.get('mobileLayoutV2')==='0')return false;
    }catch(_){ }
    const coarse=!!win.matchMedia?.('(pointer: coarse)').matches;
    const touch=(Number(win.navigator?.maxTouchPoints)||0)>0;
    const compact=Math.min(Number(win.innerWidth)||0,Number(win.innerHeight)||0)<=960;
    return (coarse&&touch)||(touch&&compact);
  }

  function readSettings(win){
    const fallbacks=defaultsFor(win);
    try{
      const parsed=JSON.parse(win.localStorage?.getItem(STORAGE_KEY)||'{}');
      if(!Object.prototype.hasOwnProperty.call(parsed,'mobileAimPreset'))parsed.mobileAimPreset=fallbacks.mobileAimPreset;
      return sanitizeSettings(parsed,fallbacks);
    }catch(_){return sanitizeSettings({},fallbacks);}
  }

  function notifySettings(win,value){
    try{win.dispatchEvent(new win.CustomEvent('circlemix:mobileinputsettingschange',{detail:{...value}}));}catch(_){ }
  }

  function writeSettings(win,settings){
    const value=sanitizeSettings(settings,defaultsFor(win));
    try{win.localStorage?.setItem(STORAGE_KEY,JSON.stringify(value));}catch(_){ }
    notifySettings(win,value);
    return value;
  }

  function exportSettings(settings,win){
    const safe=sanitizeSettings(settings,defaultsFor(win));
    return JSON.stringify({
      version:VERSION,
      inputVersion:INPUT_VERSION,
      appVersion:win?.CircleMixVersion?.version||'0.0.0',
      preset:safe.mobileControlPreset,
      mobileActionX:safe.mobileActionX,
      mobileActionY:safe.mobileActionY,
      mobilePulseX:safe.mobilePulseX,
      mobilePulseY:safe.mobilePulseY,
      mobileActionSize:safe.mobileActionSize,
      mobilePulseSize:safe.mobilePulseSize,
      mobileButtonOpacity:safe.mobileButtonOpacity,
      mobileControlGap:safe.mobileControlGap,
      mobileAimPreset:safe.mobileAimPreset,
      mobileAimSensitivity:safe.mobileAimSensitivity,
      mobileAimRecontactGuard:safe.mobileAimRecontactGuard,
      mobileGestureGuard:safe.mobileGestureGuard
    },null,2);
  }

  function aimProfile(settings){
    const safe=sanitizeSettings(settings);
    const preset=AIM_PROFILES[safe.mobileAimPreset]||AIM_PROFILES.ABSOLUTE;
    return {...preset,sensitivity:safe.mobileAimSensitivity};
  }

  function tangentMovement(angle,dx,dy){
    return -Math.sin(angle)*finite(dx,0)+Math.cos(angle)*finite(dy,0);
  }

  function jumpThreshold(width,height){
    return Math.max(96,Math.min(Math.max(1,finite(width,1)),Math.max(1,finite(height,1)))*.24);
  }

  function shouldSuppressJump(sample={},previous={},width=1280,height=720){
    const dt=finite(sample.timeStamp,0)-finite(previous.timeStamp,0);
    const distance=Math.hypot(finite(sample.x,0)-finite(previous.x,0),finite(sample.y,0)-finite(previous.y,0));
    return dt>110||distance>jumpThreshold(width,height);
  }

  function virtualAimPoint(rect,angle){
    const width=Math.max(1,finite(rect?.width,1)),height=Math.max(1,finite(rect?.height,1));
    const radius=Math.max(64,Math.min(width,height)*.34);
    return {
      x:finite(rect?.left,0)+width/2+Math.cos(angle)*radius,
      y:finite(rect?.top,0)+height/2+Math.sin(angle)*radius,
      radius
    };
  }

  function installMobileInput(doc,win,getSettings){
    const canvas=doc.getElementById('game');
    if(!canvas||!win.PointerEvent||canvas.dataset.mobileInputV3==='true')return null;
    canvas.dataset.mobileInputV3='true';
    const synthetic=new WeakSet();
    const state={pointerId:null,last:null,virtualAngle:-Math.PI/2,initialized:false};

    function activeSettings(){return sanitizeSettings(getSettings?.()||readSettings(win),defaultsFor(win));}
    function relativeEnabled(){return aimProfile(activeSettings()).mode==='RELATIVE';}
    function pointAngle(event){
      const rect=canvas.getBoundingClientRect();
      return Math.atan2(event.clientY-(rect.top+rect.height/2),event.clientX-(rect.left+rect.width/2));
    }
    function dispatch(type,source){
      const rect=canvas.getBoundingClientRect();
      const point=virtualAimPoint(rect,state.virtualAngle);
      let event;
      try{
        event=new win.PointerEvent(type,{
          bubbles:true,cancelable:true,composed:true,pointerId:source.pointerId,
          pointerType:'touch',isPrimary:true,clientX:point.x,clientY:point.y,
          screenX:point.x,screenY:point.y,buttons:type==='pointerup'||type==='pointercancel'?0:1,
          button:type==='pointerup'||type==='pointercancel'?0:-1,pressure:type==='pointerup'||type==='pointercancel'?0:.5,
          width:source.width||1,height:source.height||1
        });
      }catch(_){return false;}
      synthetic.add(event);
      canvas.dispatchEvent(event);
      return true;
    }
    function take(event){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    function onDown(event){
      if(synthetic.has(event)||event.pointerType!=='touch'||!isMobileEnvironment(win)||!relativeEnabled()||state.pointerId!==null)return;
      state.pointerId=event.pointerId;
      state.last={x:event.clientX,y:event.clientY,timeStamp:finite(event.timeStamp,win.performance?.now?.()||0)};
      if(!state.initialized){state.virtualAngle=normalizeAngle(pointAngle(event));state.initialized=true;}
      try{canvas.setPointerCapture(event.pointerId);}catch(_){ }
      take(event);
      dispatch('pointerdown',event);
    }
    function onMove(event){
      if(synthetic.has(event)||event.pointerType!=='touch'||event.pointerId!==state.pointerId||!relativeEnabled())return;
      const settings=activeSettings();
      const current={x:event.clientX,y:event.clientY,timeStamp:finite(event.timeStamp,win.performance?.now?.()||0)};
      const rect=canvas.getBoundingClientRect();
      const previous=state.last||current;
      state.last=current;
      take(event);
      if(settings.mobileAimRecontactGuard&&shouldSuppressJump(current,previous,rect.width,rect.height)){
        dispatch('pointermove',event);
        return;
      }
      const dx=current.x-previous.x,dy=current.y-previous.y;
      const point=virtualAimPoint(rect,state.virtualAngle);
      const maxStep=Math.max(42,Math.min(rect.width,rect.height)*.16);
      const tangent=clamp(tangentMovement(state.virtualAngle,dx,dy),-maxStep,maxStep);
      state.virtualAngle=normalizeAngle(state.virtualAngle+tangent/Math.max(1,point.radius)*settings.mobileAimSensitivity);
      dispatch('pointermove',event);
    }
    function onEnd(event){
      if(synthetic.has(event)||event.pointerType!=='touch'||event.pointerId!==state.pointerId||!relativeEnabled())return;
      take(event);
      dispatch(event.type==='pointercancel'?'pointercancel':'pointerup',event);
      state.pointerId=null;
      state.last=null;
    }
    function reset(){state.pointerId=null;state.last=null;}
    canvas.addEventListener('pointerdown',onDown,{capture:true,passive:false});
    canvas.addEventListener('pointermove',onMove,{capture:true,passive:false});
    canvas.addEventListener('pointerup',onEnd,{capture:true,passive:false});
    canvas.addEventListener('pointercancel',onEnd,{capture:true,passive:false});
    for(const name of ['blur','pagehide','orientationchange'])win.addEventListener(name,reset,{passive:true});
    win.addEventListener('circlemix:mobileinputsettingschange',()=>{if(!relativeEnabled())reset();});
    return Object.freeze({state:()=>({...state,last:state.last?{...state.last}:null}),reset});
  }

  function installGestureGuard(doc,win,getSettings){
    if(doc.documentElement.dataset.mobileGestureGuard==='true')return;
    doc.documentElement.dataset.mobileGestureGuard='true';
    const enabled=()=>isMobileEnvironment(win)&&sanitizeSettings(getSettings?.()||readSettings(win),defaultsFor(win)).mobileGestureGuard;
    const playing=()=>doc.body?.classList?.contains('safeGame')||doc.body?.classList?.contains('gameRunning')||doc.body?.classList?.contains('playing');
    const prevent=event=>{if(enabled()&&playing())event.preventDefault();};
    for(const name of ['wheel','contextmenu','gesturestart','gesturechange','gestureend'])doc.addEventListener(name,prevent,{capture:true,passive:false});
    doc.addEventListener('touchmove',prevent,{capture:true,passive:false});
  }

  function create(doc,tag,className,text){const el=doc.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}

  function mount(doc,win){
    if(!doc||!win||doc.getElementById('mobileLayoutV2Overlay'))return win.CircleMixMobileLayoutV2TestApi||null;
    if(!isMobileEnvironment(win))return null;
    const actionButton=doc.getElementById('mobileActionBtn');
    const pulseButton=doc.getElementById('mobilePulseBtn');
    const legacyScratch=doc.getElementById('mobileScratchBtn');
    if(!actionButton||!pulseButton)return null;
    if(legacyScratch){legacyScratch.hidden=true;legacyScratch.disabled=true;legacyScratch.setAttribute('aria-hidden','true');legacyScratch.style.display='none';}

    const state={saved:readSettings(win),draft:null,snapshot:null,open:false,applying:false,lastPixels:null};
    const overlay=create(doc,'section','mobileLayoutV2Overlay');
    overlay.id='mobileLayoutV2Overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','mobileLayoutV2Title');
    overlay.innerHTML=`<div class="mobileLayoutV2Shell"><header><div><span>MOBILE INPUT V3</span><h2 id="mobileLayoutV2Title">에임·버튼 조정</h2></div><button id="mobileLayoutV2Close" type="button" aria-label="취소">×</button></header><div class="mobileLayoutV2Preview" id="mobileLayoutV2Preview"><div class="mobileLayoutV2Safe"></div><div class="mobileLayoutV2Hud">HUD / PAUSE SAFE AREA</div><div class="mobileLayoutV2Judge">PLAY FIELD</div><button class="mobileLayoutV2Handle action" id="mobileLayoutV2Action" type="button">ACTION</button><button class="mobileLayoutV2Handle pulse" id="mobileLayoutV2Pulse" type="button">PULSE</button><output id="mobileLayoutV2Coord">READY</output></div><p id="mobileLayoutV2Warning" class="mobileLayoutV2Warning"></p><div class="mobileLayoutV2Tools"><button id="mobileAimPreset" type="button">AIM</button><button id="mobileAimSensitivityDown" type="button">AIM SENS −</button><button id="mobileAimSensitivityUp" type="button">AIM SENS ＋</button><button id="mobileAimRecontact" type="button">RECONTACT</button><button id="mobileGestureGuard" type="button">GESTURE</button><button id="mobileLayoutV2Preset" type="button">LAYOUT PRESET</button><button id="mobileLayoutV2Swap" type="button">SWAP</button><button id="mobileLayoutV2ActionDown" type="button">ACTION −</button><button id="mobileLayoutV2ActionUp" type="button">ACTION ＋</button><button id="mobileLayoutV2PulseDown" type="button">PULSE −</button><button id="mobileLayoutV2PulseUp" type="button">PULSE ＋</button><button id="mobileLayoutV2OpacityDown" type="button">OPACITY −</button><button id="mobileLayoutV2OpacityUp" type="button">OPACITY ＋</button><button id="mobileLayoutV2Reset" type="button">RESET</button><button id="mobileLayoutV2Export" type="button">EXPORT</button></div><footer><div><strong id="mobileLayoutV2PresetLabel">STANDARD</strong><span id="mobileLayoutV2SizeLabel">READY</span></div><button id="mobileLayoutV2Cancel" type="button">취소</button><button id="mobileLayoutV2Save" type="button">저장</button></footer></div>`;
    doc.body.appendChild(overlay);

    const preview=overlay.querySelector('#mobileLayoutV2Preview');
    const actionHandle=overlay.querySelector('#mobileLayoutV2Action');
    const pulseHandle=overlay.querySelector('#mobileLayoutV2Pulse');
    const coord=overlay.querySelector('#mobileLayoutV2Coord');
    const warning=overlay.querySelector('#mobileLayoutV2Warning');
    const presetLabel=overlay.querySelector('#mobileLayoutV2PresetLabel');
    const sizeLabel=overlay.querySelector('#mobileLayoutV2SizeLabel');
    const aimPresetButton=overlay.querySelector('#mobileAimPreset');
    const recontactButton=overlay.querySelector('#mobileAimRecontact');
    const gestureButton=overlay.querySelector('#mobileGestureGuard');
    let rootObserver=null,refreshRaf=0;

    function apply(settings=state.open&&state.draft?state.draft:state.saved){
      state.applying=true;
      const width=Math.max(1,Number(win.innerWidth)||1),height=Math.max(1,Number(win.innerHeight)||1);
      const result=layoutPixels(settings,width,height);
      const style=doc.documentElement.style;
      style.setProperty('--mobile-action-size',`${result.settings.mobileActionSize}px`);
      style.setProperty('--mobile-pulse-size',`${result.settings.mobilePulseSize}px`);
      style.setProperty('--mobile-control-opacity',String(result.settings.mobileButtonOpacity));
      style.setProperty('--mobile-action-x',`${result.actionPx.x}px`);
      style.setProperty('--mobile-action-y',`${result.actionPx.y}px`);
      style.setProperty('--mobile-pulse-x',`${result.pulsePx.x}px`);
      style.setProperty('--mobile-pulse-y',`${result.pulsePx.y}px`);
      doc.documentElement.dataset.mobileLayout='v2';
      doc.documentElement.dataset.mobileAim=result.settings.mobileAimPreset.toLowerCase();
      state.lastPixels=result;
      state.applying=false;
      return result;
    }

    function warningText(result){
      const distance=Math.hypot(result.actionPx.x-result.pulsePx.x,result.actionPx.y-result.pulsePx.y);
      const overlap=(result.settings.mobileActionSize+result.settings.mobilePulseSize)*.48;
      const center={x:win.innerWidth/2,y:win.innerHeight/2};
      const radius=Math.min(win.innerWidth,win.innerHeight)*.29;
      const coversPlay=Math.hypot(result.actionPx.x-center.x,result.actionPx.y-center.y)<radius||Math.hypot(result.pulsePx.x-center.x,result.pulsePx.y-center.y)<radius;
      const messages=[];
      if(distance<overlap)messages.push('ACTION과 PULSE가 너무 가깝습니다.');
      if(coversPlay)messages.push('버튼이 노트 표시 영역을 가릴 수 있습니다.');
      if(result.settings.mobileAimPreset==='ABSOLUTE')messages.push('ABSOLUTE는 손을 다시 올릴 때 에임 위치가 바뀔 수 있습니다.');
      return messages.join(' ');
    }

    function render(){
      if(!state.open||!state.draft)return;
      const result=apply(state.draft);
      const rect=preview.getBoundingClientRect();
      if(!rect.width||!rect.height){win.setTimeout(render,0);return;}
      const scaleX=rect.width/Math.max(1,win.innerWidth),scaleY=rect.height/Math.max(1,win.innerHeight);
      const setHandle=(el,point,size)=>{el.style.left=`${point.x*rect.width}px`;el.style.top=`${point.y*rect.height}px`;el.style.width=`${Math.max(54,size*scaleX)}px`;el.style.height=`${Math.max(54,size*scaleY)}px`;el.style.opacity=String(state.draft.mobileButtonOpacity);};
      setHandle(actionHandle,result.action,result.settings.mobileActionSize);
      setHandle(pulseHandle,result.pulse,result.settings.mobilePulseSize);
      presetLabel.textContent=`${result.settings.mobileControlPreset} · AIM ${result.settings.mobileAimPreset}`;
      sizeLabel.textContent=`SENS ${result.settings.mobileAimSensitivity.toFixed(2)}x · ACTION ${Math.round(result.settings.mobileActionSize)} · PULSE ${Math.round(result.settings.mobilePulseSize)} · ${Math.round(result.settings.mobileButtonOpacity*100)}%`;
      aimPresetButton.textContent=`AIM ${result.settings.mobileAimPreset}`;
      recontactButton.textContent=`RECONTACT ${result.settings.mobileAimRecontactGuard?'ON':'OFF'}`;
      gestureButton.textContent=`GESTURE ${result.settings.mobileGestureGuard?'ON':'OFF'}`;
      recontactButton.classList.toggle('on',result.settings.mobileAimRecontactGuard);
      gestureButton.classList.toggle('on',result.settings.mobileGestureGuard);
      warning.textContent=warningText(result);
    }

    function close(save){
      if(save){state.saved=writeSettings(win,{...state.draft,mobileControlPreset:state.draft.mobileControlPreset==='CUSTOM'?'CUSTOM':state.draft.mobileControlPreset});}
      else if(state.snapshot)state.saved=sanitizeSettings(state.snapshot,defaultsFor(win));
      state.open=false;state.draft=null;state.snapshot=null;overlay.hidden=true;doc.body.classList.remove('mobileLayoutV2Open');apply(state.saved);
    }
    function open(){
      state.saved=readSettings(win);state.snapshot={...state.saved};state.draft={...state.saved};state.open=true;overlay.hidden=false;doc.body.classList.add('mobileLayoutV2Open');render();
    }
    function setDraft(next){state.draft=sanitizeSettings({...state.draft,...next,mobileControlPreset:next.mobileControlPreset||state.draft.mobileControlPreset},defaultsFor(win));render();}

    function bindDrag(handle,key,sizeKey){
      handle.addEventListener('pointerdown',event=>{
        if(!state.open)return;event.preventDefault();event.stopPropagation();
        try{handle.setPointerCapture(event.pointerId);}catch(_){ }
        const move=ev=>{
          const rect=preview.getBoundingClientRect();
          const viewportPoint={x:clamp((ev.clientX-rect.left)/Math.max(1,rect.width),0,1),y:clamp((ev.clientY-rect.top)/Math.max(1,rect.height),0,1)};
          const clamped=clampPoint(viewportPoint,state.draft[sizeKey],Math.max(1,win.innerWidth),Math.max(1,win.innerHeight),state.draft.mobileControlGap);
          state.draft.mobileControlPreset='CUSTOM';state.draft[`mobile${key}X`]=clamped.x;state.draft[`mobile${key}Y`]=clamped.y;
          coord.textContent=`${key.toUpperCase()} · ${(clamped.x*100).toFixed(1)}% / ${(clamped.y*100).toFixed(1)}%`;render();
        };
        const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);};
        handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);move(event);
      },{passive:false});
    }
    bindDrag(actionHandle,'Action','mobileActionSize');
    bindDrag(pulseHandle,'Pulse','mobilePulseSize');

    const button=id=>overlay.querySelector(`#${id}`);
    button('mobileLayoutV2Close').addEventListener('click',()=>close(false));
    button('mobileLayoutV2Cancel').addEventListener('click',()=>close(false));
    button('mobileLayoutV2Save').addEventListener('click',()=>close(true));
    button('mobileAimPreset').addEventListener('click',()=>{const next=AIM_PRESETS[(AIM_PRESETS.indexOf(state.draft.mobileAimPreset)+1)%AIM_PRESETS.length];setDraft({mobileAimPreset:next,mobileAimSensitivity:AIM_PROFILES[next].sensitivity});});
    button('mobileAimSensitivityDown').addEventListener('click',()=>setDraft({mobileAimSensitivity:state.draft.mobileAimSensitivity-.05}));
    button('mobileAimSensitivityUp').addEventListener('click',()=>setDraft({mobileAimSensitivity:state.draft.mobileAimSensitivity+.05}));
    button('mobileAimRecontact').addEventListener('click',()=>setDraft({mobileAimRecontactGuard:!state.draft.mobileAimRecontactGuard}));
    button('mobileGestureGuard').addEventListener('click',()=>setDraft({mobileGestureGuard:!state.draft.mobileGestureGuard}));
    button('mobileLayoutV2Preset').addEventListener('click',()=>{const active=PRESETS.slice(0,3);const next=active[(active.indexOf(state.draft.mobileControlPreset)+1)%active.length]||'STANDARD';setDraft({mobileControlPreset:next,mobileActionX:null,mobileActionY:null,mobilePulseX:null,mobilePulseY:null});});
    button('mobileLayoutV2Swap').addEventListener('click',()=>{const result=resolveLayout(state.draft,win.innerWidth,win.innerHeight);setDraft({mobileControlPreset:'CUSTOM',mobileActionX:result.pulse.x,mobileActionY:result.pulse.y,mobilePulseX:result.action.x,mobilePulseY:result.action.y});});
    button('mobileLayoutV2ActionDown').addEventListener('click',()=>setDraft({mobileActionSize:state.draft.mobileActionSize-4}));
    button('mobileLayoutV2ActionUp').addEventListener('click',()=>setDraft({mobileActionSize:state.draft.mobileActionSize+4}));
    button('mobileLayoutV2PulseDown').addEventListener('click',()=>setDraft({mobilePulseSize:state.draft.mobilePulseSize-4}));
    button('mobileLayoutV2PulseUp').addEventListener('click',()=>setDraft({mobilePulseSize:state.draft.mobilePulseSize+4}));
    button('mobileLayoutV2OpacityDown').addEventListener('click',()=>setDraft({mobileButtonOpacity:state.draft.mobileButtonOpacity-.05}));
    button('mobileLayoutV2OpacityUp').addEventListener('click',()=>setDraft({mobileButtonOpacity:state.draft.mobileButtonOpacity+.05}));
    button('mobileLayoutV2Reset').addEventListener('click',()=>setDraft({...defaultsFor(win),mobileControlPreset:'STANDARD'}));
    button('mobileLayoutV2Export').addEventListener('click',async()=>{const text=exportSettings(state.draft,win);try{await win.navigator.clipboard?.writeText(text);coord.textContent='모바일 입력 JSON을 복사했습니다.';}catch(_){win.prompt?.('MOBILE INPUT JSON',text);}});
    overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close(false);}});

    function replaceLegacyButton(id,label,handler){
      const old=doc.getElementById(id);if(!old)return null;
      const clone=old.cloneNode(true);clone.textContent=label;old.replaceWith(clone);clone.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();handler();});return clone;
    }
    const layoutEntry=replaceLegacyButton('pauseSetMobileLayout','MOBILE INPUT · AIM / ACTION / PULSE',open);
    replaceLegacyButton('pauseSetMobileReset','RESET MOBILE INPUT',()=>{state.saved=writeSettings(win,{...readSettings(win),...defaultsFor(win),mobileControlPreset:'STANDARD'});apply(state.saved);});
    replaceLegacyButton('pauseSetMobileExport','EXPORT MOBILE INPUT',async()=>{const text=exportSettings(readSettings(win),win);try{await win.navigator.clipboard?.writeText(text);}catch(_){win.prompt?.('MOBILE INPUT JSON',text);}});
    if(layoutEntry){layoutEntry.title='상대 이동 에임, 재접촉 보호와 ACTION·PULSE 버튼 위치를 조절합니다.';}

    const reapply=()=>{if(refreshRaf)win.cancelAnimationFrame(refreshRaf);refreshRaf=win.requestAnimationFrame(()=>apply());};
    for(const name of ['resize','orientationchange','pageshow','fullscreenchange'])win.addEventListener(name,reapply,{passive:true});
    if(win.MutationObserver){rootObserver=new win.MutationObserver(()=>{if(!state.applying)reapply();});rootObserver.observe(doc.documentElement,{attributes:true,attributeFilter:['style']});}
    state.saved=writeSettings(win,state.saved);apply(state.saved);
    const mobileInput=installMobileInput(doc,win,()=>state.open&&state.draft?state.draft:state.saved);
    installGestureGuard(doc,win,()=>state.open&&state.draft?state.draft:state.saved);

    const api={open,close,render,apply:()=>apply(),state:()=>({open:state.open,saved:{...state.saved},draft:state.draft?{...state.draft}:null,lastPixels:state.lastPixels,mobileInput:mobileInput?.state?.()||null}),setDraft};
    win.CircleMixMobileLayoutV2TestApi=api;
    return api;
  }

  function autoMount(doc,win){
    const run=()=>mount(doc,win);
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',run,{once:true});else run();
  }

  return Object.freeze({VERSION,INPUT_VERSION,STORAGE_KEY,PRESETS,AIM_PRESETS,AIM_PROFILES,DEFAULTS,defaultsFor,sanitizeSettings,presetLayout,resolveLayout,clampPoint,layoutPixels,isMobileEnvironment,readSettings,writeSettings,exportSettings,aimProfile,normalizeAngle,tangentMovement,jumpThreshold,shouldSuppressJump,virtualAimPoint,installMobileInput,installGestureGuard,mount,autoMount});
});
