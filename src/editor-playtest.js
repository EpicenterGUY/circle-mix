(function(root,factory){
  "use strict";
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CircleMixEditorPlaytest=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const SESSION_KEY="circleMixEditorPlaytest.v1";
  const PREFERENCES_KEY="circleMixEditorPlaytestPreferences.v1";
  const SESSION_MAX_AGE_MS=8*60*60*1000;
  const PRESET_SCALES=Object.freeze({STRICT:.82,NORMAL:1,LENIENT:1.18});
  const DEFAULTS=Object.freeze({judgementPreset:"NORMAL",hitRadiusScale:1,noteScale:1,approachSeconds:.60});
  const clamp=(value,min,max,fallback)=>{value=Number(value);return Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;};
  function sanitize(raw={}){
    const judgementPreset=Object.prototype.hasOwnProperty.call(PRESET_SCALES,String(raw.judgementPreset||"").toUpperCase())?String(raw.judgementPreset).toUpperCase():DEFAULTS.judgementPreset;
    return Object.freeze({
      judgementPreset,
      judgementScale:PRESET_SCALES[judgementPreset],
      hitRadiusScale:clamp(raw.hitRadiusScale,.75,1.15,DEFAULTS.hitRadiusScale),
      noteScale:clamp(raw.noteScale,.80,1.40,DEFAULTS.noteScale),
      approachSeconds:clamp(raw.approachSeconds,.34,1.10,DEFAULTS.approachSeconds)
    });
  }
  function parse(storage,key){try{return JSON.parse(storage?.getItem?.(key)||"null");}catch(_){return null;}}
  function write(storage,key,value){try{storage?.setItem?.(key,JSON.stringify(value));return true;}catch(_){return false;}}
  function loadPreferences(storage=typeof localStorage!=="undefined"?localStorage:null){return sanitize(parse(storage,PREFERENCES_KEY)||DEFAULTS);}
  function savePreferences(raw,storage=typeof localStorage!=="undefined"?localStorage:null){const value=sanitize(raw);write(storage,PREFERENCES_KEY,value);return value;}
  function beginSession(raw={},storage=typeof sessionStorage!=="undefined"?sessionStorage:null,now=Date.now()){
    const settings=sanitize(raw);
    const record={...settings,songId:String(raw.songId||""),chartId:String(raw.chartId||""),createdAt:Number(now)||Date.now()};
    if(!record.songId||!record.chartId)throw new Error("Editor playtest requires a songId and chartId.");
    write(storage,SESSION_KEY,record);
    return Object.freeze(record);
  }
  function readSession({storage=typeof sessionStorage!=="undefined"?sessionStorage:null,search=typeof location!=="undefined"?location.search:"",now=Date.now()}={}){
    const params=new URLSearchParams(String(search||""));
    if(params.get("editorPlaytest")!=="1")return null;
    const raw=parse(storage,SESSION_KEY);
    if(!raw)return null;
    const createdAt=Number(raw.createdAt)||0;
    if(!createdAt||Number(now)-createdAt>SESSION_MAX_AGE_MS){clearSession(storage);return null;}
    const songId=params.get("song")||"", chartId=params.get("chart")||params.get("difficulty")||"";
    if(String(raw.songId||"")!==songId||String(raw.chartId||"")!==chartId)return null;
    return Object.freeze({...sanitize(raw),songId,chartId,createdAt});
  }
  function clearSession(storage=typeof sessionStorage!=="undefined"?sessionStorage:null){try{storage?.removeItem?.(SESSION_KEY);}catch(_){}}
  function previewMetrics(raw={},canvasSize=560){const value=sanitize(raw),size=Math.max(1,Number(canvasSize)||560);return Object.freeze({ringRadius:size*.35*value.hitRadiusScale,noteRadius:8*value.noteScale,lineWidth:3*value.noteScale});}
  function summary(raw={}){const value=sanitize(raw);return `${value.judgementPreset} · RING ${value.hitRadiusScale.toFixed(2)}x · NOTE ${value.noteScale.toFixed(2)}x · APPROACH ${value.approachSeconds.toFixed(2)}s`;}
  function mergeLocalDifficulty(existing,incoming,diffKey){
    const id=String(diffKey||'').trim();
    if(!id||!incoming||typeof incoming!=='object')throw new Error('A local difficulty record and id are required.');
    const previous=existing&&typeof existing==='object'?existing:{};
    const difficulties={...(previous.difficulties||{}),...(incoming.difficulties||{})};
    const charts={...(previous.charts||{}),...(incoming.charts||{})};
    const available=new Set([...Object.keys(difficulties),...Object.keys(charts)]),difficultyOrder=[],seen=new Set();
    const candidates=[...(Array.isArray(previous.difficultyOrder)?previous.difficultyOrder:[]),...Object.keys(previous.difficulties||{}),...Object.keys(previous.charts||{}),...(Array.isArray(incoming.difficultyOrder)?incoming.difficultyOrder:[]),...Object.keys(incoming.difficulties||{}),...Object.keys(incoming.charts||{}),id];
    for(const candidate of candidates)if(typeof candidate==='string'&&available.has(candidate)&&!seen.has(candidate)){seen.add(candidate);difficultyOrder.push(candidate);}
    return {...previous,...incoming,difficultyOrder,difficulties,charts};
  }
  function mountBadge(session,doc=typeof document!=="undefined"?document:null){
    if(!session||!doc||doc.getElementById("editorPlaytestBadge"))return null;
    const style=doc.createElement("style");style.id="editorPlaytestBadgeStyle";style.textContent="#editorPlaytestBadge{position:fixed;z-index:10050;left:max(10px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top));display:flex;align-items:center;gap:9px;padding:8px 11px;border:1px solid rgba(255,159,67,.72);border-radius:999px;background:rgba(7,12,24,.92);box-shadow:0 0 24px rgba(255,159,67,.28);font:800 11px/1.2 system-ui;color:#fff;letter-spacing:.04em;pointer-events:auto}#editorPlaytestBadge strong{color:#ffb347}#editorPlaytestBadge a{color:#5cfffb;text-decoration:none;border-left:1px solid rgba(255,255,255,.18);padding-left:9px}";doc.head?.appendChild(style);
    const badge=doc.createElement("div");badge.id="editorPlaytestBadge";badge.dataset.judgement=session.judgementPreset;badge.dataset.ringScale=String(session.hitRadiusScale);badge.dataset.noteScale=String(session.noteScale);badge.dataset.approach=String(session.approachSeconds);badge.innerHTML=`<strong>EDITOR PLAYTEST</strong><span>${summary(session)}</span><a href="./editor.html?localSong=${encodeURIComponent(session.songId)}">BACK TO EDITOR</a>`;doc.body?.appendChild(badge);return badge;
  }
  return Object.freeze({SESSION_KEY,PREFERENCES_KEY,SESSION_MAX_AGE_MS,PRESET_SCALES,DEFAULTS,sanitize,loadPreferences,savePreferences,beginSession,readSession,clearSession,previewMetrics,summary,mergeLocalDifficulty,mountBadge});
});
