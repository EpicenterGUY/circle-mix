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
  const STORAGE_KEY='circleMixInputSettings.v1';
  const PRESETS=Object.freeze(['STANDARD','LEFT_HANDED','RIGHT_HANDED','CUSTOM']);
  const DEFAULTS=Object.freeze({
    mobileControlPreset:'STANDARD',
    mobileActionSize:88,
    mobilePulseSize:96,
    mobileButtonOpacity:.68,
    mobileControlGap:18,
    mobileActionX:null,
    mobileActionY:null,
    mobilePulseX:null,
    mobilePulseY:null
  });

  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
  const finiteRange=(value,min,max,fallback)=>clamp(finite(value,fallback),min,max);
  const finite01=(value,fallback=null)=>Number.isFinite(Number(value))?clamp(Number(value),0,1):fallback;

  function sanitizeSettings(input={}){
    const preset=PRESETS.includes(input.mobileControlPreset)?input.mobileControlPreset:'STANDARD';
    const legacyPulseX=finite01(input.mobileScratchX,null);
    const legacyPulseY=finite01(input.mobileScratchY,null);
    const pulseX=finite01(input.mobilePulseX,legacyPulseX);
    const pulseY=finite01(input.mobilePulseY,legacyPulseY);
    return {
      ...input,
      mobileControlPreset:preset,
      mobileActionSize:finiteRange(input.mobileActionSize,64,132,DEFAULTS.mobileActionSize),
      mobilePulseSize:finiteRange(input.mobilePulseSize ?? input.mobileScratchSize,72,140,DEFAULTS.mobilePulseSize),
      mobileButtonOpacity:finiteRange(input.mobileButtonOpacity,.35,1,DEFAULTS.mobileButtonOpacity),
      mobileControlGap:finiteRange(input.mobileControlGap,4,36,DEFAULTS.mobileControlGap),
      mobileActionX:finite01(input.mobileActionX,null),
      mobileActionY:finite01(input.mobileActionY,null),
      mobilePulseX:pulseX,
      mobilePulseY:pulseY
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
    try{return sanitizeSettings(JSON.parse(win.localStorage?.getItem(STORAGE_KEY)||'{}'));}
    catch(_){return sanitizeSettings({});}
  }
  function writeSettings(win,settings){
    const value=sanitizeSettings(settings);
    try{win.localStorage?.setItem(STORAGE_KEY,JSON.stringify(value));}catch(_){ }
    return value;
  }
  function exportSettings(settings,win){
    const safe=sanitizeSettings(settings);
    return JSON.stringify({version:VERSION,appVersion:win?.CircleMixVersion?.version||'0.0.0',preset:safe.mobileControlPreset,mobileActionX:safe.mobileActionX,mobileActionY:safe.mobileActionY,mobilePulseX:safe.mobilePulseX,mobilePulseY:safe.mobilePulseY,mobileActionSize:safe.mobileActionSize,mobilePulseSize:safe.mobilePulseSize,mobileButtonOpacity:safe.mobileButtonOpacity,mobileControlGap:safe.mobileControlGap},null,2);
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
    overlay.innerHTML=`<div class="mobileLayoutV2Shell"><header><div><span>MOBILE CONTROL LAYOUT V2</span><h2 id="mobileLayoutV2Title">버튼 위치 조정</h2></div><button id="mobileLayoutV2Close" type="button" aria-label="취소">×</button></header><div class="mobileLayoutV2Preview" id="mobileLayoutV2Preview"><div class="mobileLayoutV2Safe"></div><div class="mobileLayoutV2Hud">HUD / PAUSE SAFE AREA</div><div class="mobileLayoutV2Judge">PLAY FIELD</div><button class="mobileLayoutV2Handle action" id="mobileLayoutV2Action" type="button">ACTION</button><button class="mobileLayoutV2Handle pulse" id="mobileLayoutV2Pulse" type="button">PULSE</button><output id="mobileLayoutV2Coord">READY</output></div><p id="mobileLayoutV2Warning" class="mobileLayoutV2Warning"></p><div class="mobileLayoutV2Tools"><button id="mobileLayoutV2Preset" type="button">PRESET</button><button id="mobileLayoutV2Swap" type="button">SWAP</button><button id="mobileLayoutV2ActionDown" type="button">ACTION −</button><button id="mobileLayoutV2ActionUp" type="button">ACTION ＋</button><button id="mobileLayoutV2PulseDown" type="button">PULSE −</button><button id="mobileLayoutV2PulseUp" type="button">PULSE ＋</button><button id="mobileLayoutV2OpacityDown" type="button">OPACITY −</button><button id="mobileLayoutV2OpacityUp" type="button">OPACITY ＋</button><button id="mobileLayoutV2Reset" type="button">RESET</button><button id="mobileLayoutV2Export" type="button">EXPORT</button></div><footer><div><strong id="mobileLayoutV2PresetLabel">STANDARD</strong><span id="mobileLayoutV2SizeLabel">ACTION 88 · PULSE 96 · 68%</span></div><button id="mobileLayoutV2Cancel" type="button">취소</button><button id="mobileLayoutV2Save" type="button">저장</button></footer></div>`;
    doc.body.appendChild(overlay);

    const preview=overlay.querySelector('#mobileLayoutV2Preview');
    const actionHandle=overlay.querySelector('#mobileLayoutV2Action');
    const pulseHandle=overlay.querySelector('#mobileLayoutV2Pulse');
    const coord=overlay.querySelector('#mobileLayoutV2Coord');
    const warning=overlay.querySelector('#mobileLayoutV2Warning');
    const presetLabel=overlay.querySelector('#mobileLayoutV2PresetLabel');
    const sizeLabel=overlay.querySelector('#mobileLayoutV2SizeLabel');
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
      presetLabel.textContent=result.settings.mobileControlPreset;
      sizeLabel.textContent=`ACTION ${Math.round(result.settings.mobileActionSize)} · PULSE ${Math.round(result.settings.mobilePulseSize)} · ${Math.round(result.settings.mobileButtonOpacity*100)}%`;
      warning.textContent=warningText(result);
    }

    function close(save){
      if(save){state.saved=writeSettings(win,{...state.draft,mobileControlPreset:state.draft.mobileControlPreset==='CUSTOM'?'CUSTOM':state.draft.mobileControlPreset});}
      else if(state.snapshot)state.saved=sanitizeSettings(state.snapshot);
      state.open=false;state.draft=null;state.snapshot=null;overlay.hidden=true;doc.body.classList.remove('mobileLayoutV2Open');apply(state.saved);
    }
    function open(){
      state.saved=readSettings(win);state.snapshot={...state.saved};state.draft={...state.saved};state.open=true;overlay.hidden=false;doc.body.classList.add('mobileLayoutV2Open');render();
    }
    function setDraft(next){state.draft=sanitizeSettings({...state.draft,...next,mobileControlPreset:next.mobileControlPreset||state.draft.mobileControlPreset});render();}

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
    button('mobileLayoutV2Preset').addEventListener('click',()=>{const active=PRESETS.slice(0,3);const next=active[(active.indexOf(state.draft.mobileControlPreset)+1)%active.length]||'STANDARD';setDraft({mobileControlPreset:next,mobileActionX:null,mobileActionY:null,mobilePulseX:null,mobilePulseY:null});});
    button('mobileLayoutV2Swap').addEventListener('click',()=>{const result=resolveLayout(state.draft,win.innerWidth,win.innerHeight);setDraft({mobileControlPreset:'CUSTOM',mobileActionX:result.pulse.x,mobileActionY:result.pulse.y,mobilePulseX:result.action.x,mobilePulseY:result.action.y});});
    button('mobileLayoutV2ActionDown').addEventListener('click',()=>setDraft({mobileActionSize:state.draft.mobileActionSize-4}));
    button('mobileLayoutV2ActionUp').addEventListener('click',()=>setDraft({mobileActionSize:state.draft.mobileActionSize+4}));
    button('mobileLayoutV2PulseDown').addEventListener('click',()=>setDraft({mobilePulseSize:state.draft.mobilePulseSize-4}));
    button('mobileLayoutV2PulseUp').addEventListener('click',()=>setDraft({mobilePulseSize:state.draft.mobilePulseSize+4}));
    button('mobileLayoutV2OpacityDown').addEventListener('click',()=>setDraft({mobileButtonOpacity:state.draft.mobileButtonOpacity-.05}));
    button('mobileLayoutV2OpacityUp').addEventListener('click',()=>setDraft({mobileButtonOpacity:state.draft.mobileButtonOpacity+.05}));
    button('mobileLayoutV2Reset').addEventListener('click',()=>setDraft({...DEFAULTS,mobileControlPreset:'STANDARD'}));
    button('mobileLayoutV2Export').addEventListener('click',async()=>{const text=exportSettings(state.draft,win);try{await win.navigator.clipboard?.writeText(text);coord.textContent='레이아웃 JSON을 복사했습니다.';}catch(_){win.prompt?.('MOBILE LAYOUT JSON',text);}});
    overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close(false);}});

    function replaceLegacyButton(id,label,handler){
      const old=doc.getElementById(id);if(!old)return null;
      const clone=old.cloneNode(true);clone.textContent=label;old.replaceWith(clone);clone.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();handler();});return clone;
    }
    const layoutEntry=replaceLegacyButton('pauseSetMobileLayout','BUTTON LAYOUT · ACTION / PULSE',open);
    replaceLegacyButton('pauseSetMobileReset','RESET MOBILE BUTTONS',()=>{state.saved=writeSettings(win,{...readSettings(win),...DEFAULTS,mobileControlPreset:'STANDARD'});apply(state.saved);});
    replaceLegacyButton('pauseSetMobileExport','EXPORT MOBILE LAYOUT',async()=>{const text=exportSettings(readSettings(win),win);try{await win.navigator.clipboard?.writeText(text);}catch(_){win.prompt?.('MOBILE LAYOUT JSON',text);}});
    if(layoutEntry){layoutEntry.title='ACTION과 PULSE 버튼의 위치·크기·투명도를 조절합니다.';}

    const reapply=()=>{if(refreshRaf)win.cancelAnimationFrame(refreshRaf);refreshRaf=win.requestAnimationFrame(()=>apply());};
    for(const name of ['resize','orientationchange','pageshow','fullscreenchange'])win.addEventListener(name,reapply,{passive:true});
    if(win.MutationObserver){rootObserver=new win.MutationObserver(()=>{if(!state.applying)reapply();});rootObserver.observe(doc.documentElement,{attributes:true,attributeFilter:['style']});}
    state.saved=writeSettings(win,state.saved);apply(state.saved);

    const api={open,close,render,apply:()=>apply(),state:()=>({open:state.open,saved:{...state.saved},draft:state.draft?{...state.draft}:null,lastPixels:state.lastPixels}),setDraft};
    win.CircleMixMobileLayoutV2TestApi=api;
    return api;
  }

  function autoMount(doc,win){
    const run=()=>mount(doc,win);
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',run,{once:true});else run();
  }

  return Object.freeze({VERSION,STORAGE_KEY,PRESETS,DEFAULTS,sanitizeSettings,presetLayout,resolveLayout,clampPoint,layoutPixels,isMobileEnvironment,readSettings,writeSettings,exportSettings,mount,autoMount});
});