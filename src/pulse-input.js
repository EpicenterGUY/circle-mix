/* PULSE v1 input and timing contract for CIRCLE MIX. */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CircleMixPulseInput=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";

  const NOTE_TYPE="pulse";
  const SHIFT_CODES=Object.freeze(["ShiftLeft","ShiftRight"]);
  const DEFAULT_WINDOWS=Object.freeze({perfectMs:45,greatMs:90,missMs:150});

  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

  function isPulseNote(note){
    return !!note&&note.type===NOTE_TYPE;
  }

  function normalizePulseNote(note={}){
    return {
      id:String(note.id??"").trim()||undefined,
      type:NOTE_TYPE,
      beat:Math.max(0,finite(note.beat,0))
    };
  }

  function normalizeWindows(windows={}){
    const perfectMs=Math.max(0,finite(windows.perfectMs,DEFAULT_WINDOWS.perfectMs));
    const greatMs=Math.max(perfectMs,finite(windows.greatMs,DEFAULT_WINDOWS.greatMs));
    const missMs=Math.max(greatMs,finite(windows.missMs,DEFAULT_WINDOWS.missMs));
    return {perfectMs,greatMs,missMs};
  }

  function judge(deltaMs,windows=DEFAULT_WINDOWS){
    const timing=normalizeWindows(windows);
    const absolute=Math.abs(finite(deltaMs,Infinity));
    if(absolute<=timing.perfectMs)return "perfect";
    if(absolute<=timing.greatMs)return "great";
    if(absolute<=timing.missMs)return "miss";
    return null;
  }

  function createGate(options={}){
    const held=new Set();
    let latched=false;
    const onPulse=typeof options.onPulse==="function"?options.onPulse:()=>{};

    function keydown(event={}){
      const code=String(event.code||"");
      if(!SHIFT_CODES.includes(code))return {handled:false,accepted:false,reason:"OTHER_KEY"};
      held.add(code);
      if(event.repeat)return {handled:true,accepted:false,reason:"REPEAT"};
      if(latched)return {handled:true,accepted:false,reason:"RELEASE_REQUIRED"};
      latched=true;
      const detail={code,source:"keyboard",timeStamp:finite(event.timeStamp,0)};
      onPulse(detail,event);
      return {handled:true,accepted:true,detail};
    }

    function keyup(event={}){
      const code=String(event.code||"");
      if(!SHIFT_CODES.includes(code))return {handled:false,released:false};
      held.delete(code);
      if(held.size===0)latched=false;
      return {handled:true,released:!latched};
    }

    function release(code){
      return keyup({code});
    }

    function reset(){
      held.clear();
      latched=false;
    }

    function state(){
      return Object.freeze({latched,held:Object.freeze([...held])});
    }

    return {keydown,keyup,release,reset,state};
  }

  function bindKeyboard(target,onPulse,options={}){
    if(!target?.addEventListener)throw new TypeError("PULSE keyboard target is unavailable");
    const gate=createGate({onPulse});
    const preventDefault=options.preventDefault!==false;
    const down=event=>{
      const result=gate.keydown(event);
      if(result.handled&&preventDefault)event.preventDefault?.();
    };
    const up=event=>{
      const result=gate.keyup(event);
      if(result.handled&&preventDefault)event.preventDefault?.();
    };
    const reset=()=>gate.reset();
    target.addEventListener("keydown",down);
    target.addEventListener("keyup",up);
    target.addEventListener("blur",reset);
    return {gate,destroy(){target.removeEventListener("keydown",down);target.removeEventListener("keyup",up);target.removeEventListener("blur",reset);gate.reset();}};
  }

  function approachProgress(nowMs,hitMs,approachMs){
    const duration=Math.max(1,finite(approachMs,1000));
    return clamp(1-(finite(hitMs,0)-finite(nowMs,0))/duration,0,1);
  }

  return Object.freeze({NOTE_TYPE,SHIFT_CODES,DEFAULT_WINDOWS,isPulseNote,normalizePulseNote,normalizeWindows,judge,createGate,bindKeyboard,approachProgress});
});
